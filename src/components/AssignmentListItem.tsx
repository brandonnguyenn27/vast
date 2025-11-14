import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { CanvasAssignment } from "../types/canvas";
import { FeedItem } from "../types/canvas";
import { formatDate, formatTime } from "../utils/date";
import { truncateTitle } from "../utils/text";
import { AssignmentDetailView } from "./AssignmentDetailView";

interface AssignmentListItemProps {
  item: CanvasAssignment | FeedItem;
  canvasBaseUrl?: string;
  onRefresh?: () => void;
}

/**
 * Reusable component for rendering assignment list items
 * Works with both CanvasAssignment and FeedItem types
 */
export function AssignmentListItem({ item, canvasBaseUrl, onRefresh }: AssignmentListItemProps) {
  // Determine if this is a FeedItem or CanvasAssignment
  const isFeedItem = "type" in item && "title" in item;
  const assignment = isFeedItem ? undefined : (item as CanvasAssignment);
  const feedItem = isFeedItem ? (item as FeedItem) : undefined;

  // Extract common properties
  const assignmentId = assignment?.id || feedItem?.assignment_id;
  const courseId = assignment?.course_id || feedItem?.course_id;
  const title = assignment?.name || feedItem?.title || "";
  const dueAt = assignment?.due_at || feedItem?.due_at;
  const pointsPossible = assignment?.points_possible || feedItem?.points_possible;
  const submission = assignment?.submission || feedItem?.submission;

  // Build subtitle
  const subtitleParts: string[] = [];

  if (feedItem?.course_name) {
    subtitleParts.push(feedItem.course_name);
  }

  if (feedItem?.location_name) {
    subtitleParts.push(` ${feedItem.location_name}`);
  }

  // For CanvasAssignment, show submission info
  if (assignment && submission) {
    const hasSubmission =
      submission.workflow_state !== "unsubmitted" &&
      (submission.workflow_state === "submitted" ||
        submission.workflow_state === "graded" ||
        submission.workflow_state === "pending_review");

    if (hasSubmission) {
      if (submission.submitted_at) {
        subtitleParts.push(`Submitted: ${formatDate(submission.submitted_at)}`);
      }
      if (submission.score !== undefined && submission.score !== null) {
        subtitleParts.push(`Score: ${submission.score}/${pointsPossible}`);
      }
    }
  }

  // Always show due date
  if (dueAt) {
    if (assignment) {
      subtitleParts.push(`Due: ${formatDate(dueAt)}`);
    }
  } else if (assignment) {
    subtitleParts.push("No due date");
  }

  // Build accessories
  const accessories = [];

  // Status icon
  if (feedItem) {
    // FeedItem status logic
    if (feedItem.submission) {
      accessories.push({ icon: Icon.CheckCircle });
    } else if (feedItem.due_at) {
      const dueDate = new Date(feedItem.due_at);
      const now = new Date();
      if (dueDate < now) {
        accessories.push({ icon: Icon.XMarkCircle });
      } else if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
        accessories.push({ icon: Icon.ExclamationMark });
      }
    }
  } else if (assignment) {
    // CanvasAssignment status logic
    const hasSubmission =
      submission &&
      submission.workflow_state !== "unsubmitted" &&
      (submission.workflow_state === "submitted" ||
        submission.workflow_state === "graded" ||
        submission.workflow_state === "pending_review");

    if (hasSubmission) {
      accessories.push({ icon: Icon.CheckCircle });
    } else {
      accessories.push({ icon: Icon.Circle });
    }
  }

  // Points or time
  if (assignment && pointsPossible !== undefined) {
    if (pointsPossible > 0) {
      accessories.push({
        text:
          submission?.score !== undefined && submission?.score !== null
            ? `${submission.score}/${pointsPossible} pts`
            : `${pointsPossible} pts`,
        icon: Icon.Star,
      });
    } else {
      accessories.push({
        text: "Ungraded",
        icon: Icon.Star,
      });
    }
  } else if (feedItem && dueAt) {
    accessories.push({
      text: formatTime(dueAt),
    });
  } else if (feedItem && feedItem.start_at) {
    accessories.push({
      text: formatTime(feedItem.start_at),
    });
  }

  // Build URL
  let itemUrl: string | null = null;
  if (canvasBaseUrl && courseId && assignmentId) {
    const baseUrl = canvasBaseUrl.replace(/\/$/, "");
    itemUrl = `${baseUrl}/courses/${courseId}/assignments/${assignmentId}`;
  } else if (canvasBaseUrl && feedItem) {
    const baseUrl = canvasBaseUrl.replace(/\/$/, "");
    if (feedItem.assignment_id) {
      itemUrl = `${baseUrl}/courses/${feedItem.course_id}/assignments/${feedItem.assignment_id}`;
    } else if (feedItem.quiz_id) {
      itemUrl = `${baseUrl}/courses/${feedItem.course_id}/quizzes/${feedItem.quiz_id}`;
    } else if (feedItem.course_id) {
      itemUrl = `${baseUrl}/courses/${feedItem.course_id}`;
    }
  }

  const subtitle = subtitleParts.join(" • ");

  // Get icon based on type
  const getIcon = () => {
    if (feedItem) {
      switch (feedItem.type) {
        case "assignment":
          return Icon.Document;
        case "quiz":
          return Icon.QuestionMark;
        case "exam":
          return Icon.Clipboard;
        case "announcement":
          return Icon.Megaphone;
        case "calendar_event":
          return Icon.Calendar;
        default:
          return Icon.Circle;
      }
    }
    return Icon.Document;
  };

  return (
    <List.Item
      title={truncateTitle(title)}
      subtitle={subtitle}
      accessories={accessories}
      icon={getIcon()}
      actions={
        <ActionPanel>
          {assignmentId && courseId && (
            <Action.Push
              title="View Assignment Details"
              icon={Icon.Eye}
              target={
                <AssignmentDetailView
                  assignmentId={assignmentId}
                  courseId={courseId}
                  assignment={assignment} // Pass assignment data if available (CanvasAssignment type)
                />
              }
            />
          )}
          {itemUrl && (
            <Action.OpenInBrowser
              title={feedItem?.quiz_id ? "Open Quiz in Browser" : "Open Assignment in Browser"}
              icon={Icon.Globe}
              url={itemUrl}
            />
          )}
          {onRefresh && (
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              onAction={() => onRefresh()}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
