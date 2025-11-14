import React, { useState } from "react";
import {
  ActionPanel,
  Action,
  showToast,
  Toast,
  getPreferenceValues,
  Form,
  openExtensionPreferences,
} from "@raycast/api";
import { showFolderPicker } from "../utils/folderPicker";

export function VastSetupForm() {
  const prefs = getPreferenceValues<{ vastBaseDirectory?: string }>();
  const [baseDirectory, setBaseDirectory] = useState(prefs.vastBaseDirectory || "");

  const handlePickFolder = async () => {
    try {
      const selectedPath = await showFolderPicker();
      if (selectedPath) {
        setBaseDirectory(selectedPath);
        await showToast({
          style: Toast.Style.Success,
          title: "Folder Selected",
          message: `Selected: ${selectedPath}. Please save this in preferences.`,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Folder Picker Error",
        message:
          error instanceof Error && error.message.includes("Accessibility")
            ? "Please enable Accessibility permission in System Settings → Privacy & Security → Accessibility"
            : "Failed to open folder picker. You can still enter the path manually.",
      });
    }
  };

  const handleSubmit = async (values: { vastBaseDirectory: string }) => {
    try {
      // Validate the form values
      if (!values.vastBaseDirectory || values.vastBaseDirectory.trim().length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Missing Required Field",
          message: "Please select or enter a base directory path",
        });
        return;
      }

      // Open preferences to save the values
      await openExtensionPreferences();

      await showToast({
        style: Toast.Style.Success,
        title: "Opening Preferences",
        message: "Please save your Vast base directory in the preferences window",
      });
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed To Open Preferences",
        message: "Please manually open Raycast Preferences → Extensions → Vast",
      });
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Validate & Open Preferences" onSubmit={handleSubmit} />
          <Action title="Choose Folder…" icon="📂" onAction={handlePickFolder} />
          <Action title="Open Preferences Now" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Vast Directory Configuration"
        text="Select or enter your base directory path. After validation, you'll be taken to Raycast Preferences to save it."
      />

      <Form.Description
        title="⚠️ Accessibility Permission Required"
        text="To use the folder picker, you need to enable Accessibility permission for Raycast in System Settings → Privacy & Security → Accessibility. If you don't have this permission, you can still enter the path manually below."
      />

      <Form.TextField
        id="vastBaseDirectory"
        title="Base Directory"
        placeholder="/Users/username/Documents/Vast"
        value={baseDirectory}
        onChange={setBaseDirectory}
        info="The base directory where all course folders will be created. Press ⌘+K and select 'Choose Folder…' to use the native folder picker, or enter the full path manually."
      />

      <Form.Description
        title=""
        text="💡 Tip: Press ⌘+K while this field is focused and select 'Choose Folder…' to browse for a folder."
      />

      <Form.Description
        title="⚠️ Note"
        text="The native folder picker may cause the Raycast panel to close temporarily. Don't worry - your selected folder will be saved automatically. Simply reopen this command to continue with your selection."
      />
    </Form>
  );
}
