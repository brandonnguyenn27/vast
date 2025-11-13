import { CanvasCourse } from "../types/canvas";
import { ensureDirectoryExists, joinPath, sanitizeDirectoryName, directoryExists } from "../utils/directory";
import { saveVastConfig, generateDefaultCourseDirectoryName, VastConfig } from "../utils/courseDirectory";

export interface SetupVastOptions {
  baseDirectory: string;
  courses: CanvasCourse[];
  termNames: Record<number, string>;
  courseDirectoryNames: Record<number, string>;
}

export interface SetupVastResult {
  createdCount: number;
  existingCount: number;
  errors: string[];
  termPathStatus: Map<number, boolean>;
  baseExists: boolean;
}

/**
 * Groups courses by enrollment term
 */
export function groupCoursesByTerm(courses: CanvasCourse[]): Map<number, CanvasCourse[]> {
  const grouped = new Map<number, CanvasCourse[]>();
  courses.forEach((course) => {
    const termId = course.enrollment_term_id;
    if (!grouped.has(termId)) {
      grouped.set(termId, []);
    }
    grouped.get(termId)!.push(course);
  });
  return grouped;
}

/**
 * Validates that all required term names are provided
 */
export function validateTermNames(
  coursesByTerm: Map<number, CanvasCourse[]>,
  termNames: Record<number, string>,
): { isValid: boolean; errorMessage?: string } {
  for (const [termId, termCourses] of coursesByTerm.entries()) {
    const termName = termNames[termId];
    if (!termName || termName.trim().length === 0) {
      return {
        isValid: false,
        errorMessage: `Please enter a name for the term containing ${termCourses.length} course${termCourses.length === 1 ? "" : "s"}`,
      };
    }
  }
  return { isValid: true };
}

/**
 * Creates the directory structure for Vast setup
 */
export async function createVastDirectories(options: SetupVastOptions): Promise<SetupVastResult> {
  const { baseDirectory, courses, termNames, courseDirectoryNames } = options;

  // Check if base directory exists, create if not
  const baseExists = await directoryExists(baseDirectory);
  if (!baseExists) {
    await ensureDirectoryExists(baseDirectory);
  }

  // Group courses by term
  const coursesByTerm = groupCoursesByTerm(courses);

  let createdCount = 0;
  let existingCount = 0;
  const errors: string[] = [];
  const termPathStatus = new Map<number, boolean>();

  // Create directories for each term group
  for (const [termId, termCourses] of coursesByTerm.entries()) {
    const termName = termNames[termId];
    const sanitizedTermName = sanitizeDirectoryName(termName);
    const termPath = joinPath(baseDirectory, sanitizedTermName);

    // Check if term directory exists, create if not
    const termPathExists = await directoryExists(termPath);
    termPathStatus.set(termId, termPathExists);
    if (!termPathExists) {
      await ensureDirectoryExists(termPath);
    }

    // Create course directories within this term directory
    for (const course of termCourses) {
      const courseDirName = courseDirectoryNames[course.id] || generateDefaultCourseDirectoryName(course);
      const sanitizedCourseName = sanitizeDirectoryName(courseDirName);
      const coursePath = joinPath(termPath, sanitizedCourseName);

      try {
        const courseExists = await directoryExists(coursePath);
        if (!courseExists) {
          await ensureDirectoryExists(coursePath);
          createdCount++;
        } else {
          existingCount++;
        }
      } catch {
        errors.push(`Failed to create directory for: ${course.name}`);
      }
    }
  }

  return {
    createdCount,
    existingCount,
    errors,
    termPathStatus,
    baseExists,
  };
}

/**
 * Builds a success message from the setup result
 */
export function buildSetupMessage(result: SetupVastResult): string {
  const { createdCount, existingCount, baseExists, termPathStatus, errors } = result;
  const messages: string[] = [];

  if (createdCount > 0) {
    messages.push(`Created ${createdCount} new director${createdCount === 1 ? "y" : "ies"}`);
  }
  if (existingCount > 0) {
    messages.push(`${existingCount} director${existingCount === 1 ? "y" : "ies"} already exist`);
  }
  if (baseExists) {
    messages.push("Base directory already exists");
  }
  // Check if any term directories already existed
  const existingTermPaths = Array.from(termPathStatus.values()).filter((exists) => exists).length;
  if (existingTermPaths > 0) {
    messages.push(`${existingTermPaths} term director${existingTermPaths === 1 ? "y" : "ies"} already exist`);
  }
  if (errors.length > 0) {
    messages.push(`${errors.length} error${errors.length === 1 ? "" : "s"} occurred`);
  }

  return messages.length > 0 ? messages.join(". ") : "Setup complete";
}

/**
 * Validates form submission values
 */
export function validateFormSubmission(
  isCanvasConfigured: boolean,
  baseDirectory: string,
): { isValid: boolean; error?: { title: string; message: string } } {
  if (!isCanvasConfigured) {
    return {
      isValid: false,
      error: {
        title: "Canvas not configured",
        message: "Please configure Canvas settings first",
      },
    };
  }

  if (!baseDirectory || baseDirectory.trim().length === 0) {
    return {
      isValid: false,
      error: {
        title: "Base directory required",
        message: "Please specify a base directory",
      },
    };
  }

  return { isValid: true };
}

/**
 * Gets toast notification details for setup result
 */
export function getSetupToast(result: SetupVastResult): {
  style: "success" | "failure";
  title: string;
  message: string;
} {
  const { createdCount, existingCount, baseExists, termPathStatus, errors } = result;
  const message = buildSetupMessage(result);

  if (errors.length > 0) {
    return {
      style: "failure",
      title: "Setup completed with errors",
      message,
    };
  }

  const hasExistingPaths =
    existingCount > 0 || baseExists || Array.from(termPathStatus.values()).some((exists) => exists);

  if (hasExistingPaths) {
    return {
      style: "success",
      title: "Setup complete",
      message,
    };
  }

  return {
    style: "success",
    title: "Setup complete",
    message: `Successfully created ${createdCount} course director${createdCount === 1 ? "y" : "ies"}`,
  };
}

/**
 * Gets error toast details from an error
 */
export function getErrorToast(error: unknown): { title: string; message: string } {
  if (error instanceof Error) {
    const isValidationError = error.message.includes("Validation failed");
    return {
      title: isValidationError ? "Term name required" : "Setup failed",
      message: error.message,
    };
  }
  return {
    title: "Setup failed",
    message: "Unknown error occurred",
  };
}

/**
 * Main function to setup Vast directories
 * Returns the result for the caller to handle UI feedback
 */
export async function setupVastDirectories(options: SetupVastOptions): Promise<SetupVastResult> {
  // Validate that all term names are provided
  const coursesByTerm = groupCoursesByTerm(options.courses);
  const validation = validateTermNames(coursesByTerm, options.termNames);

  if (!validation.isValid) {
    throw new Error(validation.errorMessage || "Validation failed");
  }

  // Create directories
  const result = await createVastDirectories(options);

  // Save configuration
  const config: VastConfig = {
    courseDirectoryNames: options.courseDirectoryNames,
    termNames: options.termNames,
  };
  await saveVastConfig(options.baseDirectory, config);

  return result;
}
