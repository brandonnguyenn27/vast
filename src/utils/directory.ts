import { mkdir, access } from "fs/promises";
import { join } from "path";

/**
 * Sanitizes a string to be filesystem-safe
 * Removes invalid characters and trims whitespace
 */
export function sanitizeDirectoryName(name: string): string {
  // Remove invalid filesystem characters: / \ : * ? " < > |
  // Also remove leading/trailing dots and spaces
  return name
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .trim();
}

/**
 * Validates if a directory path is valid
 */
export function isValidDirectoryPath(path: string): boolean {
  if (!path || path.trim().length === 0) {
    return false;
  }
  // Basic validation - check for invalid characters
  return !/[<>:"|?*]/.test(path);
}

/**
 * Creates a directory recursively if it doesn't exist
 * @param dirPath - The directory path to create
 * @throws Error if directory creation fails
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
    throw new Error("Failed to create directory: Unknown error");
  }
}

/**
 * Checks if a directory exists and is accessible
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Joins path segments safely
 */
export function joinPath(...segments: string[]): string {
  return join(...segments);
}

