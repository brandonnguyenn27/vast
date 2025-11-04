// Canvas API related types
export interface CanvasEnrollment {
  id: number;
  user_id: number;
  course_id: number;
  type: string;
  computed_current_score?: number;
  computed_final_score?: number;
  computed_current_grade?: string;
  computed_final_grade?: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  start_at?: string;
  end_at?: string;
  workflow_state: string;
  enrollments?: CanvasEnrollment[];
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at?: string;
  workflow_state: string;
  score?: number;
  graded_at?: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  points_possible: number;
  course_id: number;
  submission_types: string[];
  submission?: CanvasSubmission;
}

// Canvas upcoming events API response structure
export interface CanvasUpcomingEvent {
  created_at: string;
  updated_at: string;
  title: string;
  all_day: boolean;
  all_day_date: string;
  workflow_state: string;
  submission_types: string;
  description: string;
  id: string;
  type: string;
  assignment?: {
    id: number;
    position: number;
    description: string;
    due_at?: string;
    points_possible: number;
    course_id: number;
    submission_types: string[];
    name?: string;
  };
  quiz?: {
    id: number;
    title: string;
    description?: string;
    due_at?: string;
    points_possible: number;
    course_id: number;
    quiz_type?: string;
  };
  end_at?: string;
  start_at?: string;
  context_code?: string;
  location_name?: string;
}

// Unified feed item type that combines calendar events and assignments
export type FeedItemType = "assignment" | "quiz" | "exam" | "announcement" | "calendar_event" | "other";

export interface FeedItem {
  id: string;
  title: string;
  type: FeedItemType;
  description?: string;
  due_at?: string;
  start_at?: string;
  end_at?: string;
  course_id?: number;
  course_name?: string;
  points_possible?: number;
  submission_types?: string[];
  assignment_id?: number;
  quiz_id?: number;
  location_name?: string;
  all_day?: boolean;
  workflow_state?: string;
  submission?: CanvasSubmission;
}
