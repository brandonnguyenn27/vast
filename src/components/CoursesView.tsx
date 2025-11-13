import { List, ActionPanel, Action } from "@raycast/api";
import { useMemo } from "react";
import { useCachedPromise } from "@raycast/utils";
import { useCanvasCourses } from "../hooks/useCanvasCourses";
import { useCanvasAuth } from "../hooks/useCanvasAuth";
import { useVastDirectory } from "../hooks/useVastDirectory";
import { groupCoursesByTerm } from "../services/vastSetup";
import { loadVastConfig, getTermDisplayName } from "../utils/courseDirectory";
import { CourseItem } from "./CourseItem";

export function CoursesView() {
  const { config } = useCanvasAuth();
  const { courses, isLoading, error, revalidate } = useCanvasCourses();
  const { baseDirectory } = useVastDirectory();

  const { data: vastConfig, isLoading: isLoadingConfig } = useCachedPromise(
    async (baseDir: string | null) => {
      if (!baseDir) {
        return { courseDirectoryNames: {}, termNames: {} };
      }
      try {
        return await loadVastConfig(baseDir);
      } catch (error) {
        console.error("Error loading Vast config:", error);
        return { courseDirectoryNames: {}, termNames: {} };
      }
    },
    [baseDirectory],
    {
      initialData: { courseDirectoryNames: {}, termNames: {} },
      keepPreviousData: true,
    },
  );

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

  const coursesByTerm = useMemo(() => groupCoursesByTerm(courses || []), [courses]);

  return (
    <List isLoading={isLoading || isLoadingConfig} searchBarPlaceholder="Search courses...">
      {courses && courses.length > 0 ? (
        Array.from(coursesByTerm.entries()).map(([termId, termCourses]) => (
          <List.Section
            key={termId}
            title={getTermDisplayName(termId, vastConfig)}
            subtitle={`${termCourses.length} course${termCourses.length === 1 ? "" : "s"}`}
          >
            {termCourses.map((course) => (
              <CourseItem key={course.id} course={course} canvasBaseUrl={config?.canvasBaseUrl} />
            ))}
          </List.Section>
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
