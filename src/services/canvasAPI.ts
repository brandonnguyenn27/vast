import { getCanvasConfig } from "./oauth";
import { CanvasCourse, CanvasAssignment, CanvasUpcomingEvent, FeedItem, FeedItemType } from "../types/canvas";

/**
 * Makes authenticated requests to Canvas API using personal access token
 */
async function makeCanvasRequest<T>(endpoint: string): Promise<T> {
  const config = getCanvasConfig();
  if (!config) {
    throw new Error("Canvas configuration not found. Please configure Canvas Base URL and API Token in preferences.");
  }

  const url = `${config.baseUrl}/api/v1${endpoint}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API token. Please check your Canvas API token in preferences.");
    }
    if (response.status === 403) {
      throw new Error("Access forbidden. Please ensure your Canvas API token has the necessary permissions.");
    }
    throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as T;
}

/**
 * Fetches user's active courses with enrollment information (including grade data)
 */
export async function fetchCanvasCourses(): Promise<CanvasCourse[]> {
  return makeCanvasRequest<CanvasCourse[]>("/courses?enrollment_state=active&per_page=100&include[]=total_scores");
}

/**
 * Fetches assignments for a specific course with submission information
 */
export async function fetchCourseAssignments(courseId: number): Promise<CanvasAssignment[]> {
  return makeCanvasRequest<CanvasAssignment[]>(`/courses/${courseId}/assignments?per_page=100&include[]=submission`);
}

/**
 * Fetches a single assignment by ID with full details including description
 */
export async function fetchAssignment(courseId: number, assignmentId: number): Promise<CanvasAssignment> {
  return makeCanvasRequest<CanvasAssignment>(`/courses/${courseId}/assignments/${assignmentId}?include[]=submission`);
}

/**
 * Fetches user's assignments across all courses
 */
export async function fetchAllAssignments(): Promise<CanvasAssignment[]> {
  try {
    const result = await makeCanvasRequest<CanvasUpcomingEvent[]>(
      "/users/self/upcoming_events?type=assignment&per_page=100",
    );

    // Transform the upcoming events format to CanvasAssignment format
    const assignments: CanvasAssignment[] = result
      .filter((event: CanvasUpcomingEvent) => event.assignment) // Only include events with assignment data
      .map((event: CanvasUpcomingEvent) => ({
        id: event.assignment!.id,
        name: event.title,
        description: event.description,
        due_at: event.end_at || event.assignment!.due_at,
        points_possible: event.assignment!.points_possible,
        course_id: event.assignment!.course_id,
        submission_types: event.submission_types ? [event.submission_types] : event.assignment!.submission_types,
      }));

    return assignments;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
}

/**
 * Fetches all upcoming calendar events from Canvas
 * This includes assignments, quizzes, calendar events, announcements, etc.
 */
export async function fetchUpcomingEvents(): Promise<CanvasUpcomingEvent[]> {
  return makeCanvasRequest<CanvasUpcomingEvent[]>("/users/self/upcoming_events?per_page=100");
}

/**
 * Categorizes an event type string into a FeedItemType
 */
function categorizeEventType(
  eventType: string,
  assignment?: CanvasUpcomingEvent["assignment"],
  quiz?: CanvasUpcomingEvent["quiz"],
): FeedItemType {
  const lowerType = eventType.toLowerCase();

  // Check if it's a quiz
  if (lowerType === "quiz" || quiz) {
    // Check if quiz type indicates it's an exam
    const quizType = quiz?.quiz_type?.toLowerCase();
    if (quizType === "assignment" || quizType === "graded_survey") {
      // Check title/name for exam keywords
      const title = (quiz?.title || "").toLowerCase();
      if (title.includes("exam") || title.includes("test") || title.includes("midterm") || title.includes("final")) {
        return "exam";
      }
    }
    return "quiz";
  }

  // Check if it's an assignment
  if (lowerType === "assignment" || assignment) {
    // Check title/name for exam keywords
    const title = (assignment?.name || "").toLowerCase();
    if (title.includes("exam") || title.includes("test") || title.includes("midterm") || title.includes("final")) {
      return "exam";
    }
    return "assignment";
  }

  // Check for announcement
  if (lowerType === "announcement") {
    return "announcement";
  }

  // Check for calendar event
  if (lowerType === "calendar_event" || lowerType === "event") {
    return "calendar_event";
  }

  return "other";
}

/**
 * Converts CanvasUpcomingEvent to FeedItem
 */
function eventToFeedItem(event: CanvasUpcomingEvent, courseName?: string): FeedItem {
  const type = categorizeEventType(event.type, event.assignment, event.quiz);

  return {
    id: event.id,
    title: event.title,
    type,
    description: event.description,
    due_at: event.end_at || event.assignment?.due_at || event.quiz?.due_at,
    start_at: event.start_at,
    end_at: event.end_at,
    course_id: event.assignment?.course_id || event.quiz?.course_id,
    course_name: courseName,
    points_possible: event.assignment?.points_possible || event.quiz?.points_possible,
    submission_types: event.assignment?.submission_types || (event.submission_types ? [event.submission_types] : []),
    assignment_id: event.assignment?.id,
    quiz_id: event.quiz?.id,
    location_name: event.location_name,
    all_day: event.all_day,
    workflow_state: event.workflow_state,
  };
}

/**
 * Fetches and combines calendar events with assignment details
 * Returns a categorized feed of all upcoming items
 */
export async function fetchAssignmentFeed(): Promise<FeedItem[]> {
  try {
    // Fetch all upcoming events
    const events = await fetchUpcomingEvents();

    // Fetch all courses to get course names
    const courses = await fetchCanvasCourses();
    const courseMap = new Map<number, string>();
    courses.forEach((course) => {
      courseMap.set(course.id, course.name);
    });

    // Convert events to feed items
    const feedItems: FeedItem[] = events.map((event) => {
      const courseId = event.assignment?.course_id || event.quiz?.course_id;
      const courseName = courseId ? courseMap.get(courseId) : undefined;
      return eventToFeedItem(event, courseName);
    });

    // Fetch detailed assignment data with submissions for assignments in the feed
    // Get unique course IDs that have assignments
    const courseIdsWithAssignments = new Set<number>();
    feedItems.forEach((item) => {
      if (item.assignment_id && item.course_id) {
        courseIdsWithAssignments.add(item.course_id);
      }
    });

    // Fetch assignments with submissions for each course
    const assignmentMap = new Map<number, CanvasAssignment>();
    await Promise.all(
      Array.from(courseIdsWithAssignments).map(async (courseId) => {
        try {
          const assignments = await fetchCourseAssignments(courseId);
          assignments.forEach((assignment) => {
            assignmentMap.set(assignment.id, assignment);
          });
        } catch (error) {
          console.error(`Error fetching assignments for course ${courseId}:`, error);
        }
      }),
    );

    // Merge submission data into feed items
    feedItems.forEach((item) => {
      if (item.assignment_id) {
        const assignment = assignmentMap.get(item.assignment_id);
        if (assignment?.submission) {
          item.submission = assignment.submission;
        }
      }
    });

    // Sort by due date (soonest first), items without due dates go to end
    feedItems.sort((a, b) => {
      if (!a.due_at && !b.due_at) return 0;
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });

    return feedItems;
  } catch (error) {
    console.error("Error fetching assignment feed:", error);
    throw error;
  }
}

/**
 * Checks if user has configured Canvas API token
 */
export function isCanvasConfigured(): boolean {
  const config = getCanvasConfig();
  return !!(config?.baseUrl && config?.apiToken);
}
