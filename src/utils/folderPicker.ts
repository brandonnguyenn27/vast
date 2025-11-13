import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Shows a native macOS folder picker dialog
 * @returns The selected folder path, or null if cancelled
 * @throws Error if permission is denied or other error occurs
 */
export async function showFolderPicker(): Promise<string | null> {
  try {
    // Note: choose folder is a modal dialog that will take focus
    // Unfortunately, this is a limitation of native macOS dialogs
    // The panel may close, but the selected path will still be saved
    const script = `
      set folderPath to choose folder with prompt "Select base directory for Vast"
      return POSIX path of folderPath
    `;

    const { stdout } = await execAsync(`osascript -e '${script}'`);
    return stdout.trim();
  } catch (error) {
    // User cancelled the dialog or permission denied
    if (error instanceof Error && error.message.includes("User cancelled")) {
      return null;
    }
    // Check if it's a permission error
    if (error instanceof Error && error.message.includes("not allowed")) {
      throw new Error("Accessibility permission required");
    }
    return null;
  }
}
