import { showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useCanvasAuth } from "./useCanvasAuth";
import { fetchAssignmentFeed } from "../services/canvasAPI";
import { FeedItem } from "../types/canvas";
import { getCurrentDateKey } from "../utils/date";

interface CategorizedFeed {
  assignments: FeedItem[];
  quizzes: FeedItem[];
  exams: FeedItem[];
  announcements: FeedItem[];
  calendarEvents: FeedItem[];
  other: FeedItem[];
}

function categorizeFeedItems(items: FeedItem[]): CategorizedFeed {
  const categorized: CategorizedFeed = {
    assignments: [],
    quizzes: [],
    exams: [],
    announcements: [],
    calendarEvents: [],
    other: [],
  };

  items.forEach((item) => {
    switch (item.type) {
      case "assignment":
        categorized.assignments.push(item);
        break;
      case "quiz":
        categorized.quizzes.push(item);
        break;
      case "exam":
        categorized.exams.push(item);
        break;
      case "announcement":
        categorized.announcements.push(item);
        break;
      case "calendar_event":
        categorized.calendarEvents.push(item);
        break;
      default:
        categorized.other.push(item);
    }
  });

  return categorized;
}

/**
 * Custom hook to fetch and cache the assignment feed
 * Combines calendar events and assignments, categorized by type
 * Automatically fetches fresh data when a new day starts
 */
export function useAssignmentFeed() {
  const { isConfigured } = useCanvasAuth();

  // Get current date key - calculated fresh each time the hook runs
  // This ensures that when the command opens on a new day, the cache key is different
  // and fresh data will be fetched instead of showing cached data from the previous day
  const currentDateKey = getCurrentDateKey();

  const {
    data: categorizedData,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(
    async (configured: boolean, _dateKey: string): Promise<CategorizedFeed> => {
      // _dateKey is included in dependencies to invalidate cache when date changes
      // but we don't need to use it in the function body
      void _dateKey; // Suppress unused parameter warning
      if (!configured) {
        console.log("useAssignmentFeed: Not configured, returning empty categories");
        return {
          assignments: [],
          quizzes: [],
          exams: [],
          announcements: [],
          calendarEvents: [],
          other: [],
        };
      }

      const feedItems = await fetchAssignmentFeed();
      const categorized = categorizeFeedItems(feedItems);

      return categorized;
    },
    // Include currentDateKey in the dependency array so cache invalidates when date changes
    // This ensures fresh data is fetched when a new day starts
    [isConfigured, currentDateKey],
    {
      initialData: {
        assignments: [],
        quizzes: [],
        exams: [],
        announcements: [],
        calendarEvents: [],
        other: [],
      },
      keepPreviousData: false, // Don't keep previous day's data when date changes
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch assignment feed",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      },
    },
  );

  const allItems = [
    ...(categorizedData?.assignments || []),
    ...(categorizedData?.quizzes || []),
    ...(categorizedData?.exams || []),
    ...(categorizedData?.announcements || []),
    ...(categorizedData?.calendarEvents || []),
    ...(categorizedData?.other || []),
  ];

  return {
    assignments: categorizedData?.assignments || [],
    quizzes: categorizedData?.quizzes || [],
    exams: categorizedData?.exams || [],
    announcements: categorizedData?.announcements || [],
    calendarEvents: categorizedData?.calendarEvents || [],
    other: categorizedData?.other || [],
    allItems,
    isLoading,
    error,
    revalidate,
  };
}
