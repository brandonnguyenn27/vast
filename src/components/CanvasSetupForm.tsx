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

export function CanvasSetupForm() {
  const prefs = getPreferenceValues<{ canvasBaseUrl: string; canvasApiToken: string; vastBaseDirectory?: string }>();
  const [baseDirectory, setBaseDirectory] = useState(prefs.vastBaseDirectory?.trim() || "");

  const handlePickFolder = async () => {
    try {
      const selectedPath = await showFolderPicker();
      if (selectedPath) {
        const trimmedPath = selectedPath.trim();
        setBaseDirectory(trimmedPath);
        await showToast({
          style: Toast.Style.Success,
          title: "Folder Selected",
          message: `Selected: ${trimmedPath}`,
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

  const handleSubmit = async (values: { canvasBaseUrl: string; canvasApiToken: string; vastBaseDirectory: string }) => {
    try {
      // Trim all values before validation
      const trimmedValues = {
        canvasBaseUrl: values.canvasBaseUrl?.trim() || "",
        canvasApiToken: values.canvasApiToken?.trim() || "",
        vastBaseDirectory: values.vastBaseDirectory?.trim() || "",
      };

      // Validate the form values
      if (!trimmedValues.canvasBaseUrl || !trimmedValues.canvasApiToken || !trimmedValues.vastBaseDirectory) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Missing Required Fields",
          message: "Please fill in Canvas Base URL, API Token, and Base Directory",
        });
        return;
      }

      // Update the base directory state with trimmed value
      setBaseDirectory(trimmedValues.vastBaseDirectory);

      // Open preferences to save the values
      await openExtensionPreferences();

      await showToast({
        style: Toast.Style.Success,
        title: "Opening Preferences",
        message:
          "Please save your Canvas settings in the preferences window. Make sure to copy the trimmed values without trailing spaces.",
      });
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed To Open Preferences",
        message: "Please manually open Raycast Preferences → Extensions → Vast",
      });
    }
  };

  const handleOpenCanvasSettings = async () => {
    await showToast({
      style: Toast.Style.Success,
      title: "Canvas Settings Instructions",
      message: "Go to Canvas → Profile → Settings → Approved Integrations → New Access Token",
    });
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Validate & Open Preferences" onSubmit={handleSubmit} />
          <Action title="Choose Folder…" icon="📂" onAction={handlePickFolder} />
          <Action title="Open Preferences Now" onAction={openExtensionPreferences} />
          <Action title="How To Get API Token" onAction={handleOpenCanvasSettings} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Canvas Configuration"
        text="Fill in your Canvas settings below. After validation, you'll be taken to Raycast Preferences to save them."
      />

      <Form.TextField
        id="canvasBaseUrl"
        title="Canvas Base URL"
        placeholder="https://canvas.instructure.com"
        defaultValue={prefs.canvasBaseUrl?.trim() || ""}
        info="The base URL of your Canvas instance (e.g., https://canvas.instructure.com or https://your-school.instructure.com)"
      />

      <Form.PasswordField
        id="canvasApiToken"
        title="Personal Access Token"
        placeholder="Enter your Canvas API token"
        defaultValue={prefs.canvasApiToken?.trim() || ""}
        info="Generate this from Canvas → Profile → Settings → Approved Integrations → New Access Token"
      />

      <Form.Separator />

      <Form.Description
        title="Base Directory Configuration"
        text="Select or enter the base directory where all course folders will be created. This is a required setting."
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
        onChange={(value) => setBaseDirectory(value.trim())}
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

      <Form.Description
        title="Security Note"
        text="Your API token is stored securely in Raycast preferences and only used to access your Canvas data."
      />
    </Form>
  );
}
