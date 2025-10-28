import { getPreferenceValues } from "@raycast/api";

/**
 * Gets Canvas API configuration from preferences (using personal access token)
 */
export function getCanvasConfig(): { baseUrl: string; apiToken: string } | null {
  try {
    const prefs = getPreferenceValues<{ canvasBaseUrl: string; canvasApiToken: string }>();

    if (!prefs.canvasBaseUrl || !prefs.canvasApiToken) {
      return null;
    }

    return {
      baseUrl: prefs.canvasBaseUrl.replace(/\/$/, ""), // Remove trailing slash
      apiToken: prefs.canvasApiToken,
    };
  } catch (error) {
    console.error("Error getting Canvas config:", error);
    return null;
  }
}
