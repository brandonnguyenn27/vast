import React, { useState, useEffect, useMemo } from "react";
import { ActionPanel, Action, showToast, Toast, Form, openExtensionPreferences } from "@raycast/api";
import { useCanvasCourses } from "../hooks/useCanvasCourses";
import { useCanvasAuth } from "../hooks/useCanvasAuth";
import { useVastDirectory } from "../hooks/useVastDirectory";
import { loadVastConfig, generateDefaultCourseDirectoryName } from "../utils/courseDirectory";
import { showFolderPicker } from "../utils/folderPicker";
import {
  setupVastDirectories,
  groupCoursesByTerm,
  validateFormSubmission,
  getSetupToast,
  getErrorToast,
} from "../services/vastSetup";
import { CanvasSetupForm } from "./CanvasSetupForm";

interface SetupVastFormValues {
  baseDirectory: string;
}

export function SetupVastFormWithPicker() {
  const { isConfigured: isCanvasConfigured } = useCanvasAuth();
  const { courses, isLoading: coursesLoading } = useCanvasCourses();
  const { baseDirectory: prefBaseDirectory } = useVastDirectory();
  const [baseDirectory, setBaseDirectory] = useState(prefBaseDirectory || "");
  const [termNames, setTermNames] = useState<Record<number, string>>({});
  const [courseDirectoryNames, setCourseDirectoryNames] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing config if base directory is set
  useEffect(() => {
    if (baseDirectory) {
      loadExistingConfig();
    }
  }, [baseDirectory]);

  // Initialize course directory names from courses (only for new courses)
  useEffect(() => {
    if (courses.length > 0) {
      setCourseDirectoryNames((prev) => {
        const initialCourseNames: Record<number, string> = {};

        courses.forEach((course) => {
          // Only initialize if not already set
          if (!prev[course.id]) {
            initialCourseNames[course.id] = generateDefaultCourseDirectoryName(course);
          }
        });

        if (Object.keys(initialCourseNames).length > 0) {
          return { ...prev, ...initialCourseNames };
        }
        return prev;
      });
    }
  }, [courses]);

  const loadExistingConfig = async () => {
    try {
      const config = await loadVastConfig(baseDirectory);
      if (config.courseDirectoryNames) {
        setCourseDirectoryNames(config.courseDirectoryNames);
      }
      if (config.termNames) {
        setTermNames(config.termNames);
      }
    } catch (error) {
      console.error("Error loading existing config:", error);
    }
  };

  const handlePickFolder = async () => {
    try {
      const selectedPath = await showFolderPicker();
      if (selectedPath) {
        setBaseDirectory(selectedPath);
        await showToast({
          style: Toast.Style.Success,
          title: "Folder Selected",
          message: `Selected: ${selectedPath}`,
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

  const handleSubmit = async (values: SetupVastFormValues) => {
    const validation = validateFormSubmission(isCanvasConfigured, values.baseDirectory);
    if (!validation.isValid && validation.error) {
      await showToast({
        style: Toast.Style.Failure,
        title: validation.error.title,
        message: validation.error.message,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await setupVastDirectories({
        baseDirectory: values.baseDirectory,
        courses,
        termNames,
        courseDirectoryNames,
      });

      const toast = getSetupToast(result);
      await showToast({
        style: toast.style === "success" ? Toast.Style.Success : Toast.Style.Failure,
        title: toast.title,
        message: toast.message,
      });
    } catch (error) {
      const errorToast = getErrorToast(error);
      await showToast({
        style: Toast.Style.Failure,
        title: errorToast.title,
        message: errorToast.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCourseDirectoryName = (courseId: number, name: string) =>
    setCourseDirectoryNames((prev) => ({ ...prev, [courseId]: name }));

  const updateTermName = (termId: number, name: string) => setTermNames((prev) => ({ ...prev, [termId]: name }));

  const coursesByTerm = useMemo(() => groupCoursesByTerm(courses), [courses]);

  if (!isCanvasConfigured) {
    return <CanvasSetupForm />;
  }

  return (
    <Form
      isLoading={coursesLoading || isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Setup Vast Directories" onSubmit={handleSubmit} icon="📁" />
          <Action title="Choose Folder…" icon="📂" onAction={handlePickFolder} />
          <Action title="Open Preferences" icon="⚙️" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Setup Vast Directory Structure"
        text="Configure where course directories will be created and how they should be organized."
      />

      <Form.Description
        title="⚠️ Accessibility Permission Required"
        text="To use the folder picker, you need to enable Accessibility permission for Raycast in System Settings → Privacy & Security → Accessibility. If you don't have this permission, you can still enter the path manually below."
      />

      <Form.TextField
        id="baseDirectory"
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

      <Form.Separator />
      <Form.Description
        title="Term Organization"
        text="Courses are automatically grouped by enrollment term. Enter a name for each term and customize course directory names below."
      />

      {Array.from(coursesByTerm.entries()).map(([termId, termCourses], index) => {
        const termName = termNames[termId] || "";
        return (
          <React.Fragment key={termId}>
            {index > 0 && <Form.Separator />}
            <Form.TextField
              id={`term-${termId}`}
              title={`Term Name (${termCourses.length} course${termCourses.length === 1 ? "" : "s"})`}
              placeholder="Fall 2025"
              value={termName}
              onChange={(value) => updateTermName(termId, value)}
              info={`Enter a name for this term (e.g., Fall 2024, Spring 2025). All courses below will be organized under this term directory.`}
            />
            <Form.Description
              title={`Courses in this term`}
              text={`Customize directory names for courses in this term (optional)`}
            />
            {termCourses.map((course) => {
              const defaultName = generateDefaultCourseDirectoryName(course);
              const currentName = courseDirectoryNames[course.id] || defaultName;
              return (
                <Form.TextField
                  key={course.id}
                  id={`course-${course.id}`}
                  title={course.course_code}
                  placeholder={defaultName}
                  value={currentName}
                  onChange={(value) => updateCourseDirectoryName(course.id, value)}
                  info={course.name}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </Form>
  );
}
