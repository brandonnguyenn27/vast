import React, { useState, useEffect, useMemo } from "react";
import { ActionPanel, Action, showToast, Toast, Form, openExtensionPreferences } from "@raycast/api";
import { useCanvasCourses } from "../hooks/useCanvasCourses";
import { useCanvasAuth } from "../hooks/useCanvasAuth";
import { useVastDirectory } from "../hooks/useVastDirectory";
import { loadVastConfig, saveVastConfig, generateDefaultCourseDirectoryName } from "../utils/courseDirectory";
import { ensureDirectoryExists, joinPath, sanitizeDirectoryName, directoryExists } from "../utils/directory";

interface SetupVastFormValues {
  baseDirectory: string;
}

export function SetupVastForm() {
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

  const handleSubmit = async (values: SetupVastFormValues) => {
    if (!isCanvasConfigured) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Canvas not configured",
        message: "Please configure Canvas settings first",
      });
      return;
    }

    if (!values.baseDirectory || values.baseDirectory.trim().length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Base directory required",
        message: "Please specify a base directory",
      });
      return;
    }

    // Validate that all term names are provided
    const coursesByTerm = new Map<number, typeof courses>();
    courses.forEach((course) => {
      const termId = course.enrollment_term_id;
      if (!coursesByTerm.has(termId)) {
        coursesByTerm.set(termId, []);
      }
      coursesByTerm.get(termId)!.push(course);
    });

    for (const [termId, termCourses] of coursesByTerm.entries()) {
      const termName = termNames[termId];
      if (!termName || termName.trim().length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Term name required",
          message: `Please enter a name for the term containing ${termCourses.length} course${termCourses.length === 1 ? "" : "s"}`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Check if base directory exists, create if not
      const baseExists = await directoryExists(values.baseDirectory);
      if (!baseExists) {
        await ensureDirectoryExists(values.baseDirectory);
      }

      // Group courses by term and create directories
      const coursesByTerm = new Map<number, typeof courses>();
      courses.forEach((course) => {
        const termId = course.enrollment_term_id;
        if (!coursesByTerm.has(termId)) {
          coursesByTerm.set(termId, []);
        }
        coursesByTerm.get(termId)!.push(course);
      });

      let createdCount = 0;
      let existingCount = 0;
      const errors: string[] = [];
      const termPathStatus = new Map<number, boolean>(); // Track which term paths already exist

      // Create directories for each term group
      for (const [termId, termCourses] of coursesByTerm.entries()) {
        const termName = termNames[termId];
        const sanitizedTermName = sanitizeDirectoryName(termName);
        const termPath = joinPath(values.baseDirectory, sanitizedTermName);

        // Check if term directory exists, create if not
        const termPathExists = await directoryExists(termPath);
        termPathStatus.set(termId, termPathExists);
        if (!termPathExists) {
          await ensureDirectoryExists(termPath);
        }

        // Create course directories within this term directory
        for (const course of termCourses) {
          const courseDirName = courseDirectoryNames[course.id] || generateDefaultCourseDirectoryName(course);
          const sanitizedCourseName = sanitizeDirectoryName(courseDirName);
          const coursePath = joinPath(termPath, sanitizedCourseName);

          try {
            const courseExists = await directoryExists(coursePath);
            if (!courseExists) {
              await ensureDirectoryExists(coursePath);
              createdCount++;
            } else {
              existingCount++;
            }
          } catch {
            errors.push(`Failed to create directory for: ${course.name}`);
          }
        }
      }

      // Save configuration
      const config = {
        courseDirectoryNames,
        termNames,
      };
      await saveVastConfig(values.baseDirectory, config);

      // Build success message
      const messages: string[] = [];
      if (createdCount > 0) {
        messages.push(`Created ${createdCount} new director${createdCount === 1 ? "y" : "ies"}`);
      }
      if (existingCount > 0) {
        messages.push(`${existingCount} director${existingCount === 1 ? "y" : "ies"} already exist`);
      }
      if (baseExists) {
        messages.push("Base directory already exists");
      }
      // Check if any term directories already existed
      const existingTermPaths = Array.from(termPathStatus.values()).filter((exists) => exists).length;
      if (existingTermPaths > 0) {
        messages.push(`${existingTermPaths} term director${existingTermPaths === 1 ? "y" : "ies"} already exist`);
      }
      if (errors.length > 0) {
        messages.push(`${errors.length} error${errors.length === 1 ? "" : "s"} occurred`);
      }

      const message = messages.length > 0 ? messages.join(". ") : "Setup complete";

      if (errors.length > 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Setup completed with errors",
          message,
        });
      } else if (existingCount > 0 || baseExists || Array.from(termPathStatus.values()).some((exists) => exists)) {
        await showToast({
          style: Toast.Style.Success,
          title: "Setup complete",
          message,
        });
      } else {
        await showToast({
          style: Toast.Style.Success,
          title: "Setup complete",
          message: `Successfully created ${createdCount} course director${createdCount === 1 ? "y" : "ies"}`,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Setup failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCourseDirectoryName = (courseId: number, name: string) => {
    setCourseDirectoryNames((prev) => ({ ...prev, [courseId]: name }));
  };

  const updateTermName = (termId: number, name: string) => {
    setTermNames((prev) => ({ ...prev, [termId]: name }));
  };

  // Group courses by enrollment term for display (memoized to avoid recalculation)
  const coursesByTerm = useMemo(() => {
    const grouped = new Map<number, typeof courses>();
    courses.forEach((course) => {
      const termId = course.enrollment_term_id;
      if (!grouped.has(termId)) {
        grouped.set(termId, []);
      }
      grouped.get(termId)!.push(course);
    });
    return grouped;
  }, [courses]);

  if (!isCanvasConfigured) {
    return (
      <Form>
        <Form.Description
          title="Canvas Not Configured"
          text="Please configure Canvas settings first before setting up Vast directories."
        />
        <Form.Separator />
        <Form.Description text="Go to Raycast Preferences → Extensions → Vast to configure Canvas." />
      </Form>
    );
  }

  return (
    <Form
      isLoading={coursesLoading || isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Setup Vast Directories" onSubmit={handleSubmit} icon="📁" />
          <Action title="Open Preferences" icon="⚙️" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Setup Vast Directory Structure"
        text="Configure where course directories will be created and how they should be organized."
      />

      <Form.TextField
        id="baseDirectory"
        title="Base Directory"
        placeholder="/Users/username/Documents/Vast"
        value={baseDirectory}
        onChange={setBaseDirectory}
        info="The base directory where all course folders will be created. Enter the full path manually (e.g., /Users/username/Documents/Vast)."
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
