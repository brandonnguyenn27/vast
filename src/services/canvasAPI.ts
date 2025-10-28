import { getCanvasConfig } from "./oauth";
import { CanvasCourse, CanvasAssignment, CanvasUpcomingEvent } from "../types/canvas";

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
 * Fetches user's active courses
 */
export async function fetchCanvasCourses(): Promise<CanvasCourse[]> {
  return makeCanvasRequest<CanvasCourse[]>("/courses?enrollment_state=active&per_page=100");
}

/**
 * Fetches assignments for a specific course
 */
export async function fetchCourseAssignments(courseId: number): Promise<CanvasAssignment[]> {
  return makeCanvasRequest<CanvasAssignment[]>(`/courses/${courseId}/assignments?per_page=100`);
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
 * Checks if user has configured Canvas API token
 */
export function isCanvasConfigured(): boolean {
  const config = getCanvasConfig();
  return !!(config?.baseUrl && config?.apiToken);
}
