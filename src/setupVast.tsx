import React from "react";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { SetupVastFormWithPicker } from "./components/SetupVastFormWithPicker";
import { CanvasSetupForm } from "./components/CanvasSetupForm";

export default function SetupVastCommand() {
  const { isConfigured: isCanvasConfigured } = useCanvasAuth();

  // If Canvas is not configured, show Canvas setup (which now includes base directory)
  if (!isCanvasConfigured) {
    return <CanvasSetupForm />;
  }

  // Show setup form with Canvas and directory already configured
  return <SetupVastFormWithPicker />;
}
