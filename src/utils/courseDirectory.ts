import { CanvasCourse } from "../types/canvas";
import { sanitizeDirectoryName, joinPath } from "./directory";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

export interface VastConfig {
  courseDirectoryNames: Record<number, string>; // courseId -> custom directory name
  termNames?: Record<number, string>; // enrollment_term_id -> custom term name
}

const CONFIG_FILE_NAME = ".vast-config.json";

/**
 * Generates default course directory name from course data
 * Format: "COURSE_CODE - Course Name"
 */
export function generateDefaultCourseDirectoryName(course: CanvasCourse): string {
  const code = course.course_code || `Course-${course.id}`;
  const name = course.name || "Untitled Course";
  return `${code} - ${name}`;
}

/**
 * Gets the directory name for a course, using custom name if available
 */
export function getCourseDirectoryName(course: CanvasCourse, config?: VastConfig): string {
  if (config?.courseDirectoryNames?.[course.id]) {
    return config.courseDirectoryNames[course.id];
  }
  return generateDefaultCourseDirectoryName(course);
}

/**
 * Sanitizes and returns a safe directory name for a course
 */
export function getSanitizedCourseDirectoryName(course: CanvasCourse, config?: VastConfig): string {
  const name = getCourseDirectoryName(course, config);
  return sanitizeDirectoryName(name);
}

/**
 * Loads Vast configuration from the base directory
 */
export async function loadVastConfig(baseDirectory: string): Promise<VastConfig> {
  const configPath = joinPath(baseDirectory, CONFIG_FILE_NAME);

  if (!existsSync(configPath)) {
    return { courseDirectoryNames: {} };
  }

  try {
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content) as VastConfig;
    return {
      courseDirectoryNames: config.courseDirectoryNames || {},
      termNames: config.termNames || {},
    };
  } catch (error) {
    console.error("Error loading Vast config:", error);
    return { courseDirectoryNames: {} };
  }
}

/**
 * Saves Vast configuration to the base directory
 */
export async function saveVastConfig(baseDirectory: string, config: VastConfig): Promise<void> {
  const configPath = joinPath(baseDirectory, CONFIG_FILE_NAME);

  try {
    await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save Vast config: ${error.message}`);
    }
    throw new Error("Failed to save Vast config: Unknown error");
  }
}

/**
 * Updates course directory name in config
 */
export async function updateCourseDirectoryName(
  baseDirectory: string,
  courseId: number,
  directoryName: string,
): Promise<void> {
  const config = await loadVastConfig(baseDirectory);
  config.courseDirectoryNames[courseId] = directoryName;
  await saveVastConfig(baseDirectory, config);
}

/**
 * Updates term name in config
 */
export async function updateTermName(baseDirectory: string, termId: number, termName: string): Promise<void> {
  const config = await loadVastConfig(baseDirectory);
  if (!config.termNames) {
    config.termNames = {};
  }
  config.termNames[termId] = termName;
  await saveVastConfig(baseDirectory, config);
}

/**
 * Gets the display name for a term, using configured name if available
 */
export function getTermDisplayName(termId: number, vastConfig?: VastConfig): string {
  const termNames = vastConfig?.termNames;
  if (termNames && typeof termNames === "object" && termId in termNames) {
    const termName = (termNames as Record<number, string>)[termId];
    if (termName && termName.trim().length > 0) {
      return termName;
    }
  }
  // Fallback to a generic name if no term name is configured
  return "Unnamed Term";
}
