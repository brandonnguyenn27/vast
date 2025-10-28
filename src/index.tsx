import { Detail } from "@raycast/api";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { CanvasSetupForm } from "./components/CanvasSetupForm";

export default function Command() {
  const { isConfigured } = useCanvasAuth();

  if (!isConfigured) {
    return <CanvasSetupForm />;
  }

  return (
    <Detail markdown="# Welcome to Vast Canvas Extension. Your Canvas settings are configured and ready to use!" />
  );
}
