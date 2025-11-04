import React from "react";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { CanvasSetupForm } from "./components/CanvasSetupForm";
import { AssignmentFeedView } from "./components/AssignmentFeedView";

export default function AssignmentFeedCommand() {
  const { isConfigured } = useCanvasAuth();

  if (!isConfigured) {
    return <CanvasSetupForm />;
  }

  return <AssignmentFeedView />;
}
