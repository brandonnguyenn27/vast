import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { useCourseAssignments } from "../hooks/useCourseAssignments";
import { CanvasCourse } from "../types/canvas";
import { useCanvasAuth } from "../hooks/useCanvasAuth";
import { AssignmentListItem } from "./AssignmentListItem";

interface CourseDetailViewProps {
  course: CanvasCourse;
}

export function CourseDetailView({ course }: CourseDetailViewProps) {
  const { active, pastDue, submitted, isLoading, error, revalidate } = useCourseAssignments(course.id);
  const { config } = useCanvasAuth();

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

  const totalAssignments = active.length + pastDue.length + submitted.length;

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
              {active.map((assignment) => (
                <AssignmentListItem
                  key={assignment.id}
                  item={assignment}
                  canvasBaseUrl={config?.canvasBaseUrl}
                  onRefresh={revalidate}
                />
              ))}
            </List.Section>
          )}
          {submitted.length > 0 && (
            <List.Section title={`Submitted (${submitted.length})`}>
              {submitted.map((assignment) => (
                <AssignmentListItem
                  key={assignment.id}
                  item={assignment}
                  canvasBaseUrl={config?.canvasBaseUrl}
                  onRefresh={revalidate}
                />
              ))}
            </List.Section>
          )}
          {pastDue.length > 0 && (
            <List.Section title={`Past Due (${pastDue.length})`}>
              {pastDue.map((assignment) => (
                <AssignmentListItem
                  key={assignment.id}
                  item={assignment}
                  canvasBaseUrl={config?.canvasBaseUrl}
                  onRefresh={revalidate}
                />
              ))}
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
