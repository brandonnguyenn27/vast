import { getPreferenceValues } from "@raycast/api";

/**
 * Gets Canvas API configuration from preferences (using personal access token)
 */
export function getCanvasConfig(): { baseUrl: string; apiToken: string } | null {
  try {
    const prefs = getPreferenceValues<{ canvasBaseUrl: string; canvasApiToken: string }>();

    const baseUrl = prefs.canvasBaseUrl?.trim() || "";
    const apiToken = prefs.canvasApiToken?.trim() || "";

    if (!baseUrl || !apiToken) {
      return null;
    }

    return {
      baseUrl: baseUrl.replace(/\/$/, ""), // Remove trailing slash
      apiToken: apiToken,
    };
  } catch (error) {
    console.error("Error getting Canvas config:", error);
    return null;
  }
}
