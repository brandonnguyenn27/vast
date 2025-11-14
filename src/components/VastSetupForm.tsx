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

export function VastSetupForm() {
  const prefs = getPreferenceValues<{ vastBaseDirectory?: string }>();

  const handleSubmit = async (values: { vastBaseDirectory: string }) => {
    try {
      // Validate the form values
      if (!values.vastBaseDirectory || values.vastBaseDirectory.trim().length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Missing Required Field",
          message: "Please fill in the Base Directory path",
        });
        return;
      }

      // Open preferences to save the values
      await openExtensionPreferences();

      await showToast({
        style: Toast.Style.Success,
        title: "Opening Preferences",
        message: "Please save your Vast directory settings in the preferences window",
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
          <Action title="Open Preferences Now" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Vast Directory Configuration"
        text="Fill in your base directory path below. After validation, you'll be taken to Raycast Preferences to save it."
      />

      <Form.TextField
        id="vastBaseDirectory"
        title="Base Directory"
        placeholder="/Users/username/Documents/Vast"
        defaultValue={prefs.vastBaseDirectory || ""}
        info="The base directory where all course folders will be created (e.g., /Users/username/Documents/Vast)"
      />

      <Form.Description
        title="Note"
        text="This directory will be used as the root location for organizing all your course materials."
      />
    </Form>
  );
}
