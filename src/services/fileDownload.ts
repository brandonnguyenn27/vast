import { CanvasCourse, CanvasAssignment } from "../types/canvas";
import { extractFileLinksFromHtml } from "../utils/fileExtraction";
import { ensureAssignmentDirectoryExists, courseDirectoryExists } from "../utils/assignmentDirectory";
import { downloadFile, fetchFileInfo } from "./canvasAPI";
import { joinPath } from "../utils/directory";
import { existsSync } from "fs";

export interface FileDownloadResult {
  fileId: number;
  filename: string;
  success: boolean;
  error?: string;
  path?: string;
}

export interface AssignmentDownloadResult {
  success: boolean;
  files: FileDownloadResult[];
  assignmentDirectory: string;
  error?: string;
}

/**
 * Generates a unique filename if the file already exists
 * Appends a number to the filename (e.g., file.pdf -> file (1).pdf)
 */
function generateUniqueFilename(directory: string, filename: string): string {
  const filePath = joinPath(directory, filename);

  if (!existsSync(filePath)) {
    return filename;
  }

  // Extract name and extension
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";

  // Try appending numbers until we find a unique name
  let counter = 1;
  let newFilename = `${name} (${counter})${extension}`;
  let newPath = joinPath(directory, newFilename);

  while (existsSync(newPath)) {
    counter++;
    newFilename = `${name} (${counter})${extension}`;
    newPath = joinPath(directory, newFilename);
  }

  return newFilename;
}

/**
 * Downloads all files from an assignment description to the assignment directory
 */
export async function downloadAssignmentFiles(
  assignment: CanvasAssignment,
  course: CanvasCourse,
  baseDirectory: string,
): Promise<AssignmentDownloadResult> {
  try {
    // Check if course directory exists
    const courseExists = await courseDirectoryExists(baseDirectory, course);
    if (!courseExists) {
      return {
        success: false,
        files: [],
        assignmentDirectory: "",
        error: "Course directory does not exist. Please run Vast setup first to create course directories.",
      };
    }

    // Extract file links from assignment description
    if (!assignment.description) {
      return {
        success: false,
        files: [],
        assignmentDirectory: "",
        error: "Assignment has no description or files.",
      };
    }

    const fileLinks = extractFileLinksFromHtml(assignment.description);
    if (fileLinks.length === 0) {
      return {
        success: false,
        files: [],
        assignmentDirectory: "",
        error: "No files found in assignment description.",
      };
    }

    // Ensure assignment directory exists
    const assignmentDirectory = await ensureAssignmentDirectoryExists(baseDirectory, course, assignment);

    // Download each file
    const downloadResults: FileDownloadResult[] = [];

    for (const fileLink of fileLinks) {
      try {
        // Get file info to get the actual filename
        const fileInfo = await fetchFileInfo(fileLink.fileId);
        const actualFilename = fileInfo.display_name || fileInfo.filename || fileLink.filename;

        // Generate unique filename if needed
        const uniqueFilename = generateUniqueFilename(assignmentDirectory, actualFilename);
        const destinationPath = joinPath(assignmentDirectory, uniqueFilename);

        // Download the file
        await downloadFile(fileLink.fileId, destinationPath);

        downloadResults.push({
          fileId: fileLink.fileId,
          filename: uniqueFilename,
          success: true,
          path: destinationPath,
        });
      } catch (error) {
        downloadResults.push({
          fileId: fileLink.fileId,
          filename: fileLink.filename,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    const allSuccessful = downloadResults.every((result) => result.success);
    const someSuccessful = downloadResults.some((result) => result.success);

    return {
      success: allSuccessful,
      files: downloadResults,
      assignmentDirectory,
      error: allSuccessful
        ? undefined
        : someSuccessful
          ? "Some files failed to download. Check individual file results."
          : "All files failed to download.",
    };
  } catch (error) {
    return {
      success: false,
      files: [],
      assignmentDirectory: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Downloads a single file from an assignment
 */
export async function downloadSingleFile(
  fileId: number,
  filename: string,
  assignment: CanvasAssignment,
  course: CanvasCourse,
  baseDirectory: string,
): Promise<FileDownloadResult> {
  try {
    // Check if course directory exists
    const courseExists = await courseDirectoryExists(baseDirectory, course);
    if (!courseExists) {
      return {
        fileId,
        filename,
        success: false,
        error: "Course directory does not exist. Please run Vast setup first.",
      };
    }

    // Ensure assignment directory exists
    const assignmentDirectory = await ensureAssignmentDirectoryExists(baseDirectory, course, assignment);

    // Get file info to get the actual filename
    const fileInfo = await fetchFileInfo(fileId);
    const actualFilename = fileInfo.display_name || fileInfo.filename || filename;

    // Generate unique filename if needed
    const uniqueFilename = generateUniqueFilename(assignmentDirectory, actualFilename);
    const destinationPath = joinPath(assignmentDirectory, uniqueFilename);

    // Download the file
    await downloadFile(fileId, destinationPath);

    return {
      fileId,
      filename: uniqueFilename,
      success: true,
      path: destinationPath,
    };
  } catch (error) {
    return {
      fileId,
      filename,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
