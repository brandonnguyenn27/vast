import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { useCanvasCourses } from "./hooks/useCanvasCourses";
import { CanvasSetupForm } from "./components/CanvasSetupForm";
import { CourseDetailView } from "./components/CourseDetailView";
import { CanvasCourse } from "./types/canvas";

export default function Command() {
  const { isConfigured } = useCanvasAuth();
  const { courses, isLoading, error, revalidate } = useCanvasCourses();

  if (!isConfigured) {
    return <CanvasSetupForm />;
  }

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon="⚠️"
          title="Error Loading Courses"
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

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search courses...">
      {courses && courses.length > 0 ? (
        courses.map((course: CanvasCourse) => (
          <List.Item
            key={course.id}
            title={course.name}
            subtitle={course.course_code}
            icon={Icon.Book}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Course Details"
                  icon={Icon.ArrowRight}
                  target={<CourseDetailView course={course} />}
                />
              </ActionPanel>
            }
          />
        ))
      ) : (
        <List.EmptyView
          icon="📚"
          title="No Courses Found"
          description={isLoading ? "Loading courses..." : "You don't have any active courses."}
        />
      )}
    </List>
  );
}
