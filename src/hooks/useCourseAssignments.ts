import { showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useEffect } from "react";
import { useCanvasAuth } from "./useCanvasAuth";
import { fetchCourseAssignments } from "../services/canvasAPI";
import { CanvasAssignment } from "../types/canvas";

interface CategorizedAssignments {
  active: CanvasAssignment[];
  pastDue: CanvasAssignment[];
}

/**
 * Categorizes assignments into active and past due based on due date
 * Active: assignments that haven't passed their due date yet (or have no due date)
 * Past Due: assignments that have passed their due date
 * Submission status is indicated by icons, not separate categories
 */
function categorizeAssignments(assignments: CanvasAssignment[]): CategorizedAssignments {
  const active: CanvasAssignment[] = [];
  const pastDue: CanvasAssignment[] = [];

  const now = new Date();

  assignments.forEach((assignment) => {
    // Group by due date only, regardless of submission status
    if (assignment.due_at) {
      const dueDate = new Date(assignment.due_at);
      if (dueDate < now) {
        pastDue.push(assignment);
      } else {
        active.push(assignment);
      }
    } else {
      // No due date, consider it active
      active.push(assignment);
    }
  });

  // Sort active assignments by due date (soonest first)
  // Assignments without due dates go to the end
  active.sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  // Sort past due assignments by due date (most recent first)
  pastDue.sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return -1;
    if (!b.due_at) return 1;
    return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
  });

  return { active, pastDue };
}

/**
 * Custom hook to fetch and cache assignments for a specific course
 * Uses useCachedPromise for automatic caching and revalidation
 * Categorizes assignments during data fetching for better performance
 */
export function useCourseAssignments(courseId: number | null) {
  const { isConfigured } = useCanvasAuth();

  const {
    data: categorizedData,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(
    async (configured: boolean, id: number | null): Promise<CategorizedAssignments> => {
      if (!configured || !id) {
        console.log("useCourseAssignments: Not configured or no course ID, returning empty categories");
        return { active: [], pastDue: [] };
      }

      const assignmentsData = await fetchCourseAssignments(id);
      const categorized = categorizeAssignments(assignmentsData);

      return categorized;
    },
    [isConfigured, courseId],
    {
      initialData: { active: [], pastDue: [] },
      keepPreviousData: true,
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch assignments",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      },
    },
  );

  // Always refresh on mount to ensure fresh data
  useEffect(() => {
    if (isConfigured && courseId !== null && !isLoading) {
      // Revalidate in the background to get fresh data
      // This ensures users see updated assignments when they open the view
      revalidate();
    }
  }, [isConfigured, courseId]);

  return {
    active: (categorizedData?.active || []) as CanvasAssignment[],
    pastDue: (categorizedData?.pastDue || []) as CanvasAssignment[],
    isLoading,
    error,
    revalidate,
  };
}
