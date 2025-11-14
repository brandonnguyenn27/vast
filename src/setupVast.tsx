import React from "react";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { useVastDirectory } from "./hooks/useVastDirectory";
import { SetupVastFormWithPicker } from "./components/SetupVastFormWithPicker";
import { CanvasSetupForm } from "./components/CanvasSetupForm";
import { VastSetupForm } from "./components/VastSetupForm";

export default function SetupVastCommand() {
  const { isConfigured: isCanvasConfigured } = useCanvasAuth();
  const { baseDirectory, isConfigured: isDirectoryConfigured } = useVastDirectory();

  // If Canvas is not configured, show Canvas setup
  if (!isCanvasConfigured) {
    return <CanvasSetupForm />;
  }

  // If directory is not configured, show directory setup form
  if (!isDirectoryConfigured || !baseDirectory) {
    return <VastSetupForm />;
  }

  // Show setup form with directory already configured
  // Using SetupVastFormWithPicker for testing - switch back to SetupVastForm when done
  return <SetupVastFormWithPicker />;
}
