import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { useVastDirectory } from "./hooks/useVastDirectory";
import { CanvasSetupForm } from "./components/CanvasSetupForm";
import { VastSetupForm } from "./components/VastSetupForm";
import { CoursesView } from "./components/CoursesView";

export default function Command() {
  const { isConfigured: isCanvasConfigured } = useCanvasAuth();
  const { isConfigured: isVastDirectoryConfigured } = useVastDirectory();

  if (!isCanvasConfigured) {
    return <CanvasSetupForm />;
  }

  if (!isVastDirectoryConfigured) {
    return <VastSetupForm />;
  }

  return <CoursesView />;
}
