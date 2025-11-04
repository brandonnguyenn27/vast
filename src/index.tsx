import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { useCanvasCourses } from "./hooks/useCanvasCourses";
import { CanvasSetupForm } from "./components/CanvasSetupForm";
import { CourseDetailView } from "./components/CourseDetailView";
import { CanvasCourse } from "./types/canvas";

export default function Command() {
  const { isConfigured, config } = useCanvasAuth();
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

  const getGradeAccessory = (course: CanvasCourse) => {
    // Try to get grade from enrollment data
    if (course.enrollments && course.enrollments.length > 0) {
      const enrollment = course.enrollments[0];
      // Only use computed_current_score
      const score = enrollment.computed_current_score;
      if (score !== undefined && score !== null) {
        return { text: `${score.toFixed(2)}%` };
      }
    }
    return undefined;
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search courses...">
      {courses && courses.length > 0 ? (
        courses.map((course: CanvasCourse) => {
          const accessory = getGradeAccessory(course);
          return (
            <List.Item
              key={course.id}
              title={course.name}
              icon={Icon.Book}
              accessories={accessory ? [accessory] : undefined}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="View Course Details"
                    icon={Icon.ArrowRight}
                    target={<CourseDetailView course={course} />}
                  />
                  {config?.canvasBaseUrl && (
                    <Action.OpenInBrowser
                      title="Open Course in Browser"
                      icon={Icon.Globe}
                      url={`${config.canvasBaseUrl.replace(/\/$/, "")}/courses/${course.id}`}
                    />
                  )}
                </ActionPanel>
              }
            />
          );
        })
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
