import { CanvasCourse, CanvasAssignment } from "../types/canvas";
import { sanitizeDirectoryName, joinPath, ensureDirectoryExists } from "./directory";
import { loadVastConfig, getCourseDirectoryName, getTermDisplayName } from "./courseDirectory";

/**
 * Gets the full directory path for an assignment
 * Path format: baseDirectory/termName/courseName/sanitizedAssignmentName/
 */
export async function getAssignmentDirectoryPath(
  baseDirectory: string,
  course: CanvasCourse,
  assignment: CanvasAssignment,
): Promise<string> {
  // Load Vast config to get course directory name and term name
  const config = await loadVastConfig(baseDirectory);

  // Get term name from config
  const termName = getTermDisplayName(course.enrollment_term_id, config);
  const sanitizedTermName = sanitizeDirectoryName(termName);

  // Get course directory name
  const courseDirName = getCourseDirectoryName(course, config);
  const sanitizedCourseName = sanitizeDirectoryName(courseDirName);

  // Sanitize assignment name
  const sanitizedAssignmentName = sanitizeDirectoryName(assignment.name);

  // Construct full path
  return joinPath(baseDirectory, sanitizedTermName, sanitizedCourseName, sanitizedAssignmentName);
}

/**
 * Ensures the assignment directory exists, creating it if necessary
 * Also ensures parent directories (term and course) exist
 */
export async function ensureAssignmentDirectoryExists(
  baseDirectory: string,
  course: CanvasCourse,
  assignment: CanvasAssignment,
): Promise<string> {
  const assignmentPath = await getAssignmentDirectoryPath(baseDirectory, course, assignment);
  await ensureDirectoryExists(assignmentPath);
  return assignmentPath;
}

/**
 * Gets the full directory path for a course
 * Path format: baseDirectory/termName/courseName/
 */
export async function getCourseDirectoryPath(baseDirectory: string, course: CanvasCourse): Promise<string> {
  // Load Vast config to get course directory name and term name
  const config = await loadVastConfig(baseDirectory);

  // Get term name from config
  const termName = getTermDisplayName(course.enrollment_term_id, config);
  const sanitizedTermName = sanitizeDirectoryName(termName);

  // Get course directory name
  const courseDirName = getCourseDirectoryName(course, config);
  const sanitizedCourseName = sanitizeDirectoryName(courseDirName);

  // Construct full path
  return joinPath(baseDirectory, sanitizedTermName, sanitizedCourseName);
}

/**
 * Checks if the course directory exists (required before creating assignment directory)
 */
export async function courseDirectoryExists(baseDirectory: string, course: CanvasCourse): Promise<boolean> {
  try {
    const coursePath = await getCourseDirectoryPath(baseDirectory, course);
    const { directoryExists } = await import("./directory");
    return await directoryExists(coursePath);
  } catch {
    return false;
  }
}
