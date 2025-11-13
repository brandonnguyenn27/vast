import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { CanvasSetupForm } from "./components/CanvasSetupForm";
import { CoursesView } from "./components/CoursesView";

export default function Command() {
  const { isConfigured } = useCanvasAuth();

  if (!isConfigured) {
    return <CanvasSetupForm />;
  }

  return <CoursesView />;
}
