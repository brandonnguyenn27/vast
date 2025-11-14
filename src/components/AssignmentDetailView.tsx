import { Detail, ActionPanel, Action, Icon, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchAssignment } from "../services/canvasAPI";
import { CanvasAssignment } from "../types/canvas";
import { formatDate } from "../utils/date";
import { useCanvasAuth } from "../hooks/useCanvasAuth";
import { htmlToMarkdown } from "../utils/html";

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
