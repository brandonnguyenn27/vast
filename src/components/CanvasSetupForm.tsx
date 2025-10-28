import React from "react";
import {
  ActionPanel,
  Action,
  showToast,
  Toast,
  getPreferenceValues,
  Form,
  openExtensionPreferences,
} from "@raycast/api";

export function CanvasSetupForm() {
  const prefs = getPreferenceValues<{ canvasBaseUrl: string; canvasApiToken: string }>();

  const handleSubmit = async (values: { canvasBaseUrl: string; canvasApiToken: string }) => {
    try {
      // Validate the form values
      if (!values.canvasBaseUrl || !values.canvasApiToken) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Missing Required Fields",
          message: "Please fill in both Canvas Base URL and API Token",
        });
        return;
      }

      // Open preferences to save the values
      await openExtensionPreferences();

      await showToast({
        style: Toast.Style.Success,
        title: "Opening Preferences",
        message: "Please save your Canvas settings in the preferences window",
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
        defaultValue={prefs.canvasBaseUrl || ""}
        info="The base URL of your Canvas instance (e.g., https://canvas.instructure.com or https://your-school.instructure.com)"
      />

      <Form.PasswordField
        id="canvasApiToken"
        title="Personal Access Token"
        placeholder="Enter your Canvas API token"
        defaultValue={prefs.canvasApiToken || ""}
        info="Generate this from Canvas → Profile → Settings → Approved Integrations → New Access Token"
      />

      <Form.Description
        title="Security Note"
        text="Your API token is stored securely in Raycast preferences and only used to access your Canvas data."
      />
    </Form>
  );
}
