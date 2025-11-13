import { getPreferenceValues } from "@raycast/api";
import { useMemo } from "react";
import { directoryExists, ensureDirectoryExists, isValidDirectoryPath } from "../utils/directory";

interface VastDirectoryConfig {
  vastBaseDirectory?: string;
}

interface UseVastDirectoryReturn {
  baseDirectory: string | null;
  isConfigured: boolean;
  isValid: boolean;
  ensureBaseDirectory: () => Promise<void>;
}

/**
 * Custom hook to manage Vast base directory configuration
 */
export function useVastDirectory(): UseVastDirectoryReturn {
  const config = useMemo(() => {
    try {
      const prefs = getPreferenceValues<VastDirectoryConfig>();
      return prefs;
    } catch (error) {
      console.error("Error getting Vast directory config:", error);
      return null;
    }
  }, []);

  const baseDirectory = useMemo(() => {
    return config?.vastBaseDirectory?.trim() || null;
  }, [config]);

  const isConfigured = useMemo(() => {
    return !!baseDirectory && baseDirectory.length > 0;
  }, [baseDirectory]);

  const isValid = useMemo(() => {
    if (!baseDirectory) return false;
    return isValidDirectoryPath(baseDirectory);
  }, [baseDirectory]);

  const ensureBaseDirectory = async (): Promise<void> => {
    if (!baseDirectory) {
      throw new Error("Base directory is not configured");
    }

    if (!isValid) {
      throw new Error("Base directory path is invalid");
    }

    // Check if directory exists, if not create it
    const exists = await directoryExists(baseDirectory);
    if (!exists) {
      await ensureDirectoryExists(baseDirectory);
    }
  };

  return {
    baseDirectory,
    isConfigured,
    isValid,
    ensureBaseDirectory,
  };
}

