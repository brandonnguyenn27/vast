import { Detail, ActionPanel, Action, Icon, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { fetchAssignment } from "../services/canvasAPI";
import { CanvasAssignment, CanvasCourse } from "../types/canvas";
import { formatDate } from "../utils/date";
import { useCanvasAuth } from "../hooks/useCanvasAuth";
import { htmlToMarkdown } from "../utils/html";
import { useVastDirectory } from "../hooks/useVastDirectory";
import { useCanvasCourses } from "../hooks/useCanvasCourses";
import { extractFileLinksFromHtml } from "../utils/fileExtraction";
import { downloadAssignmentFiles, downloadSingleFile } from "../services/fileDownload";
import { getCourseDirectoryPath, ensureAssignmentDirectoryExists } from "../utils/assignmentDirectory";

interface AssignmentDetailViewProps {
  assignmentId: number;
  courseId: number;
  assignment?: CanvasAssignment; // Optional: if provided, use this instead of fetching
}

/**
 * Detail view component that displays full assignment information
 * Shows assignment description, due date, points, submission status, etc.
 * If assignment data is provided, it will be used directly (no API call).
 * Otherwise, it will fetch the assignment from the API.
 */
export function AssignmentDetailView({
  assignmentId,
  courseId,
  assignment: providedAssignment,
}: AssignmentDetailViewProps) {
  const { config } = useCanvasAuth();
  const { baseDirectory, isConfigured: isVastConfigured } = useVastDirectory();
  const { courses } = useCanvasCourses();
  const [isDownloading, setIsDownloading] = useState(false);

  // Find the course data
  const course = courses.find((c) => c.id === courseId);

  const {
    data: fetchedAssignment,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(
    async (id: number, cId: number) => {
      return await fetchAssignment(cId, id);
    },
    [assignmentId, courseId],
    {
      execute: !providedAssignment, // Only fetch if assignment is not provided
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load assignment",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      },
    },
  );

  // Use provided assignment if available, otherwise use fetched assignment
  const assignment = providedAssignment || fetchedAssignment;

  // Extract file links from assignment description
  const fileLinks = assignment?.description ? extractFileLinksFromHtml(assignment.description) : [];
  const hasFiles = fileLinks.length > 0;

  // Get directory path for opening course directory in Finder
  const { data: courseDirectoryPath } = useCachedPromise(
    async (baseDir: string | null, courseData: CanvasCourse | undefined) => {
      if (!baseDir || !courseData) return null;
      return await getCourseDirectoryPath(baseDir, courseData);
    },
    [baseDirectory, course],
  );

  if (error) {
    return (
      <Detail
        markdown="# Error Loading Assignment"
        actions={
          <ActionPanel>
            <Action title="Retry" icon={Icon.ArrowClockwise} onAction={() => revalidate()} />
          </ActionPanel>
        }
      />
    );
  }

  // Show loading only if we don't have provided assignment and are still fetching
  if (!providedAssignment && isLoading && !assignment) {
    return <Detail markdown="# Loading assignment details..." isLoading={isLoading} />;
  }

  // If we still don't have an assignment after loading, show error
  if (!assignment) {
    return (
      <Detail
        markdown="# Assignment Not Found"
        actions={
          <ActionPanel>
            <Action title="Retry" icon={Icon.ArrowClockwise} onAction={() => revalidate()} />
          </ActionPanel>
        }
      />
    );
  }

  // Build the markdown content
  const markdown = buildAssignmentMarkdown(assignment);

  // Build assignment URL
  const assignmentUrl = config?.canvasBaseUrl
    ? `${config.canvasBaseUrl.replace(/\/$/, "")}/courses/${courseId}/assignments/${assignmentId}`
    : null;

  // Handle download all files
  const handleDownloadAll = async () => {
    if (!assignment || !course || !baseDirectory) {
      showToast({
        style: Toast.Style.Failure,
        title: "Download failed",
        message: !baseDirectory
          ? "Vast base directory not configured. Please configure it in preferences."
          : !course
            ? "Course information not available."
            : "Assignment information not available.",
      });
      return;
    }

    setIsDownloading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Downloading files...",
      message: `Downloading ${fileLinks.length} file${fileLinks.length === 1 ? "" : "s"}`,
    });

    try {
      const result = await downloadAssignmentFiles(assignment, course, baseDirectory);

      if (result.success) {
        toast.style = Toast.Style.Success;
        toast.title = "Download complete";
        toast.message = `Downloaded ${result.files.length} file${result.files.length === 1 ? "" : "s"} to ${result.assignmentDirectory}`;
      } else {
        const successfulCount = result.files.filter((f) => f.success).length;
        if (successfulCount > 0) {
          toast.style = Toast.Style.Success;
          toast.title = "Partial download";
          toast.message = `Downloaded ${successfulCount} of ${result.files.length} files. ${result.error || ""}`;
        } else {
          toast.style = Toast.Style.Failure;
          toast.title = "Download failed";
          toast.message = result.error || "Failed to download files";
        }
      }
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Download failed";
      toast.message = error instanceof Error ? error.message : "Unknown error occurred";
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle download single file
  const handleDownloadFile = async (fileId: number, filename: string) => {
    if (!assignment || !course || !baseDirectory) {
      showToast({
        style: Toast.Style.Failure,
        title: "Download failed",
        message: !baseDirectory
          ? "Vast base directory not configured. Please configure it in preferences."
          : !course
            ? "Course information not available."
            : "Assignment information not available.",
      });
      return;
    }

    setIsDownloading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Downloading file...",
      message: filename,
    });

    try {
      const result = await downloadSingleFile(fileId, filename, assignment, course, baseDirectory);

      if (result.success) {
        toast.style = Toast.Style.Success;
        toast.title = "Download complete";
        toast.message = `Downloaded ${result.filename}${result.path ? ` to ${result.path}` : ""}`;
      } else {
        toast.style = Toast.Style.Failure;
        toast.title = "Download failed";
        toast.message = result.error || "Failed to download file";
      }
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Download failed";
      toast.message = error instanceof Error ? error.message : "Unknown error occurred";
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle create/open assignment directory
  const handleOpenAssignmentDirectory = async () => {
    if (!assignment || !course || !baseDirectory) {
      showToast({
        style: Toast.Style.Failure,
        title: "Cannot open directory",
        message: !baseDirectory
          ? "Vast base directory not configured. Please configure it in preferences."
          : !course
            ? "Course information not available."
            : "Assignment information not available.",
      });
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Creating directory...",
      message: "Please wait",
    });

    try {
      // Ensure the assignment directory exists (creates it if it doesn't)
      const assignmentPath = await ensureAssignmentDirectoryExists(baseDirectory, course, assignment);

      toast.style = Toast.Style.Success;
      toast.title = "Directory ready";
      toast.message = "Opening in Finder...";

      // Open in Finder
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      await execAsync(`open "${assignmentPath}"`);
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to open directory";
      toast.message = error instanceof Error ? error.message : "Unknown error occurred";
    }
  };

  return (
    <Detail
      markdown={markdown}
      isLoading={!providedAssignment && isLoading}
      metadata={<AssignmentMetadata assignment={assignment} />}
      actions={
        <ActionPanel>
          {assignmentUrl && (
            <Action.OpenInBrowser
              title="Open Assignment in Browser"
              icon={Icon.Globe}
              url={assignmentUrl}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
            />
          )}
          {hasFiles && isVastConfigured && course && !isDownloading && (
            <>
              <Action
                title={`Download All Files (${fileLinks.length})`}
                icon={Icon.Download}
                onAction={handleDownloadAll}
                shortcut={{ modifiers: ["cmd"], key: "d" }}
              />
              {fileLinks.length > 1 &&
                fileLinks.map((file) => (
                  <Action
                    key={file.fileId}
                    title={`Download ${file.filename}`}
                    icon={Icon.Document}
                    onAction={() => handleDownloadFile(file.fileId, file.filename)}
                  />
                ))}
            </>
          )}
          {hasFiles && isVastConfigured && course && isDownloading && (
            <Action title="Downloading…" icon={Icon.Clock} onAction={() => {}} />
          )}
          {hasFiles && (!isVastConfigured || !course) && (
            <Action
              title="Configure Vast to Download Files"
              icon={Icon.ExclamationMark}
              onAction={() => {
                showToast({
                  style: Toast.Style.Failure,
                  title: "Vast not configured",
                  message: !isVastConfigured
                    ? "Please configure Vast base directory in preferences to download files."
                    : "Course information not available. Please refresh.",
                });
              }}
            />
          )}
          {isVastConfigured && course && courseDirectoryPath && typeof courseDirectoryPath === "string" && (
            <>
              <Action.ShowInFinder
                title="Open Course Directory"
                icon={Icon.Folder}
                path={courseDirectoryPath}
                shortcut={{ modifiers: ["cmd", "shift"], key: "o" }}
              />
              {assignment && (
                <Action
                  title="Open Assignment Directory"
                  icon={Icon.Document}
                  onAction={handleOpenAssignmentDirectory}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                />
              )}
            </>
          )}
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            onAction={() => revalidate()}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
    />
  );
}

/**
 * Builds markdown content for the assignment detail view
 */
function buildAssignmentMarkdown(assignment: CanvasAssignment): string {
  let markdown = `# ${assignment.name}\n\n`;

  // Description (HTML content converted to markdown)
  if (assignment.description) {
    const descriptionMarkdown = htmlToMarkdown(assignment.description);
    markdown += `## Description\n\n${descriptionMarkdown}\n\n`;
  } else {
    markdown += `## Description\n\n*No description provided.*\n\n`;
  }

  return markdown;
}

/**
 * Metadata component for assignment detail view
 */
function AssignmentMetadata({ assignment }: { assignment: CanvasAssignment }) {
  return (
    <Detail.Metadata>
      {/* Due Date */}
      <Detail.Metadata.Label
        title="Due Date"
        text={assignment.due_at ? formatDate(assignment.due_at) : "No due date"}
      />
      <Detail.Metadata.Separator />

      {/* Points Possible */}
      {assignment.points_possible > 0 ? (
        <>
          <Detail.Metadata.Label title="Points Possible" text={`${assignment.points_possible} points`} />
          <Detail.Metadata.Separator />
        </>
      ) : (
        <>
          <Detail.Metadata.Label title="Grading" text="Ungraded" />
          <Detail.Metadata.Separator />
        </>
      )}

      {/* Submission Types */}
      {assignment.submission_types && assignment.submission_types.length > 0 && (
        <>
          <Detail.Metadata.Label title="Submission Types" text={assignment.submission_types.join(", ")} />
          <Detail.Metadata.Separator />
        </>
      )}

      {/* Submission Status */}
      {assignment.submission ? (
        <>
          <Detail.Metadata.Label title="Submission Status" text={assignment.submission.workflow_state} />
          {assignment.submission.submitted_at && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label title="Submitted At" text={formatDate(assignment.submission.submitted_at)} />
            </>
          )}
          {assignment.submission.score !== undefined && assignment.submission.score !== null && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label
                title="Score"
                text={`${assignment.submission.score}${assignment.points_possible > 0 ? ` / ${assignment.points_possible}` : ""}`}
              />
            </>
          )}
          {assignment.submission.graded_at && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label title="Graded At" text={formatDate(assignment.submission.graded_at)} />
            </>
          )}
        </>
      ) : (
        <Detail.Metadata.Label title="Submission Status" text="Not submitted" />
      )}
    </Detail.Metadata>
  );
}
