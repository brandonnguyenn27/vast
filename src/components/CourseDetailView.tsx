import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { useCourseAssignments } from "../hooks/useCourseAssignments";
import { CanvasCourse, CanvasAssignment } from "../types/canvas";
import { formatDate } from "../utils/date";
import { useCanvasAuth } from "../hooks/useCanvasAuth";

interface CourseDetailViewProps {
  course: CanvasCourse;
}

export function CourseDetailView({ course }: CourseDetailViewProps) {
  const { active, pastDue, submitted, isLoading, error, revalidate } = useCourseAssignments(course.id);
  const { config } = useCanvasAuth();

  const getAssignmentIcon = (assignment: CanvasAssignment) => {
    if (assignment.submission) return Icon.CheckCircle;
    if (!assignment.due_at) return Icon.Clock;
    const dueDate = new Date(assignment.due_at);
    const now = new Date();
    if (dueDate < now) return Icon.XMarkCircle;
    if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return Icon.ExclamationMark;
    return Icon.Calendar;
  };

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon="⚠️"
          title="Error Loading Assignments"
          description={error instanceof Error ? error.message : "Unknown error occurred"}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={() => revalidate()} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const renderAssignment = (assignment: CanvasAssignment, category?: "active" | "pastDue" | "submitted") => {
    const subtitleParts: string[] = [];

    if (assignment.submission) {
      if (assignment.submission.submitted_at) {
        subtitleParts.push(`Submitted: ${formatDate(assignment.submission.submitted_at)}`);
      }
      if (assignment.submission.score !== undefined && assignment.submission.score !== null) {
        subtitleParts.push(`Score: ${assignment.submission.score}/${assignment.points_possible}`);
      }
    }

    if (category === "active") {
      if (assignment.due_at) {
        subtitleParts.push(`Due: ${formatDate(assignment.due_at)}`);
      } else {
        subtitleParts.push("No due date");
      }
    } else if (assignment.due_at && !assignment.submission) {
      subtitleParts.push(`Due: ${formatDate(assignment.due_at)}`);
    } else if (!assignment.due_at && !assignment.submission) {
      subtitleParts.push("No due date");
    }

    const accessories = [];
    if (assignment.points_possible > 0) {
      accessories.push({
        text:
          assignment.submission?.score !== undefined && assignment.submission?.score !== null
            ? `${assignment.submission.score}/${assignment.points_possible} pts`
            : `${assignment.points_possible} pts`,
        icon: Icon.Star,
      });
    } else {
      accessories.push({
        text: "Ungraded",
        icon: Icon.Star,
      });
    }

    const assignmentUrl = config?.canvasBaseUrl
      ? `${config.canvasBaseUrl.replace(/\/$/, "")}/courses/${assignment.course_id}/assignments/${assignment.id}`
      : null;

    return (
      <List.Item
        key={assignment.id}
        title={assignment.name}
        subtitle={subtitleParts.join(" • ")}
        accessories={accessories}
        icon={getAssignmentIcon(assignment)}
        actions={
          <ActionPanel>
            {assignmentUrl && (
              <Action.OpenInBrowser title="Open Assignment in Browser" icon={Icon.Globe} url={assignmentUrl} />
            )}
            <Action
              title="Refresh Assignments"
              icon={Icon.ArrowClockwise}
              onAction={() => revalidate()}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          </ActionPanel>
        }
      />
    );
  };

  const totalAssignments = submitted.length + active.length + pastDue.length;

  return (
    <List
      isLoading={isLoading}
      navigationTitle={course.name}
      searchBarPlaceholder="Search assignments..."
      actions={
        <ActionPanel>
          {config?.canvasBaseUrl && (
            <Action.OpenInBrowser
              title="Open Course in Browser"
              icon={Icon.Globe}
              url={`${config.canvasBaseUrl.replace(/\/$/, "")}/courses/${course.id}`}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
            />
          )}
          <Action
            title="Refresh Assignments"
            icon={Icon.ArrowClockwise}
            onAction={() => revalidate()}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
    >
      {totalAssignments > 0 ? (
        <>
          {active.length > 0 && (
            <List.Section title={`Active (${active.length})`}>
              {active.map((assignment) => renderAssignment(assignment, "active"))}
            </List.Section>
          )}
          {pastDue.length > 0 && (
            <List.Section title={`Past Due (${pastDue.length})`}>
              {pastDue.map((assignment) => renderAssignment(assignment, "pastDue"))}
            </List.Section>
          )}
          {submitted.length > 0 && (
            <List.Section title={`Submitted (${submitted.length})`}>
              {submitted.map((assignment) => renderAssignment(assignment, "submitted"))}
            </List.Section>
          )}
        </>
      ) : (
        <List.EmptyView
          icon="📝"
          title="No Assignments"
          description={isLoading ? "Loading assignments..." : "No assignments found for this course."}
          actions={
            <ActionPanel>
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={() => revalidate()} />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
