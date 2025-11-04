import { getPreferenceValues } from "@raycast/api";
import { useMemo } from "react";

interface CanvasConfig {
  canvasBaseUrl: string;
  canvasApiToken: string;
}

interface UseCanvasAuthReturn {
  isConfigured: boolean;
  config: CanvasConfig | null;
  isLoading: boolean;
}

/**
 * Custom hook to check Canvas authentication configuration
 * Returns configuration status and values
 */
export function useCanvasAuth(): UseCanvasAuthReturn {
  const config = useMemo(() => {
    try {
      const prefs = getPreferenceValues<CanvasConfig>();
      return prefs;
    } catch (error) {
      console.error("Error getting Canvas config:", error);
      return null;
    }
  }, []);

  const isConfigured = useMemo(() => {
    return !!(config?.canvasBaseUrl && config?.canvasApiToken);
  }, [config]);

  return {
    isConfigured,
    config,
    isLoading: false,
  };
}
