import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { CanvasCourse } from "../types/canvas";
import { CourseDetailView } from "./CourseDetailView";
import { getGradeAccessory } from "../utils/course";

interface CourseItemProps {
  course: CanvasCourse;
  canvasBaseUrl?: string;
}

export function CourseItem({ course, canvasBaseUrl }: CourseItemProps) {
  const accessory = getGradeAccessory(course);

  return (
    <List.Item
      title={course.name}
      icon={Icon.Book}
      accessories={accessory ? [accessory] : undefined}
      actions={
        <ActionPanel>
          <Action.Push
            title="View Course Details"
            icon={Icon.ArrowRight}
            target={<CourseDetailView course={course} />}
          />
          {canvasBaseUrl && (
            <Action.OpenInBrowser
              title="Open Course in Browser"
              icon={Icon.Globe}
              url={`${canvasBaseUrl.replace(/\/$/, "")}/courses/${course.id}`}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
