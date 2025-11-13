import { CanvasCourse } from "../types/canvas";
import { List } from "@raycast/api";

/**
 * Gets the grade accessory for a course if available
 */
export function getGradeAccessory(course: CanvasCourse): List.Item.Accessory | undefined {
  if (course.enrollments && course.enrollments.length > 0) {
    const enrollment = course.enrollments[0];
    const score = enrollment.computed_current_score;
    if (score !== undefined && score !== null) {
      return { text: `${score.toFixed(2)}%` };
    }
  }
  return undefined;
}
