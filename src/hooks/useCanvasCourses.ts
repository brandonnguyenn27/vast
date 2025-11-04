import { showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useCanvasAuth } from "./useCanvasAuth";
import { fetchCanvasCourses } from "../services/canvasAPI";

/**
 * Custom hook to fetch and cache Canvas courses
 * Uses useCachedPromise for automatic caching and revalidation
 */
export function useCanvasCourses() {
  const { isConfigured } = useCanvasAuth();

  const {
    data: courses,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(
    async (configured: boolean) => {
      if (!configured) {
        console.log("useCanvasCourses: Not configured, returning empty array");
        return [];
      }

      const coursesData = await fetchCanvasCourses();

      return coursesData;
    },
    [isConfigured],
    {
      initialData: [],
      // Cache for 24 hours since courses change infrequently
      // You can adjust this or manually invalidate when needed
      keepPreviousData: true,
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch courses",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      },
    },
  );

  return {
    courses: courses || [],
    isLoading,
    error,
    revalidate,
  };
}
