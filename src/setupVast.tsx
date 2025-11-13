import React from "react";
import { List, ActionPanel, Action, Icon, openExtensionPreferences } from "@raycast/api";
import { useCanvasAuth } from "./hooks/useCanvasAuth";
import { useVastDirectory } from "./hooks/useVastDirectory";
import { SetupVastForm } from "./components/SetupVastForm";
import { SetupVastFormWithPicker } from "./components/SetupVastFormWithPicker";
import { CanvasSetupForm } from "./components/CanvasSetupForm";

export default function SetupVastCommand() {
  const { isConfigured: isCanvasConfigured } = useCanvasAuth();
  const { baseDirectory, isConfigured: isDirectoryConfigured } = useVastDirectory();

  // If Canvas is not configured, show Canvas setup
  if (!isCanvasConfigured) {
    return <CanvasSetupForm />;
  }

  // If directory is not configured, show directory setup form
  if (!isDirectoryConfigured || !baseDirectory) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Folder}
          title="Base Directory Not Configured"
          description="Please configure the base directory in preferences or use the form below to set it up."
          actions={
            <ActionPanel>
              <Action.Push
                title="Setup Directory with Picker"
                icon={Icon.Folder}
                target={<SetupVastFormWithPicker />}
              />
              <Action.Push title="Setup Directory (Original)" icon={Icon.Folder} target={<SetupVastForm />} />
              <Action title="Open Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // Show setup form with directory already configured
  // Using SetupVastFormWithPicker for testing - switch back to SetupVastForm when done
  return <SetupVastFormWithPicker />;
}
