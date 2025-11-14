import React from "react";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { useVastDirectory } from "./hooks/useVastDirectory";
import { CanvasSetupForm } from "./components/CanvasSetupForm";
import { VastSetupForm } from "./components/VastSetupForm";
import { AssignmentFeedView } from "./components/AssignmentFeedView";

export default function AssignmentFeedCommand() {
  const { isConfigured: isCanvasConfigured } = useCanvasAuth();
  const { isConfigured: isVastDirectoryConfigured } = useVastDirectory();

  if (!isCanvasConfigured) {
    return <CanvasSetupForm />;
  }

  if (!isVastDirectoryConfigured) {
    return <VastSetupForm />;
  }

  return <AssignmentFeedView />;
}
