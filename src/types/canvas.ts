// Canvas API related types
export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  start_at?: string;
  end_at?: string;
  workflow_state: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  points_possible: number;
  course_id: number;
  submission_types: string[];
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
  end_at?: string;
}
