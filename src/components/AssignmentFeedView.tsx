import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { useAssignmentFeed } from "../hooks/useAssignmentFeed";
import { FeedItem } from "../types/canvas";
import { formatDateSectionTitle, getDateKey, formatTime } from "../utils/date";
import { truncateTitle } from "../utils/text";
import { useCanvasAuth } from "../hooks/useCanvasAuth";

export function AssignmentFeedView() {
  const { allItems, isLoading, error, revalidate } = useAssignmentFeed();
  const { config } = useCanvasAuth();

  const getTypeIcon = (item: FeedItem) => {
    switch (item.type) {
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
  };

  const getStatusIcon = (item: FeedItem) => {
    if (item.submission) return Icon.CheckCircle;
    if (!item.due_at) return null;
    const dueDate = new Date(item.due_at);
    const now = new Date();
    if (dueDate < now) return Icon.XMarkCircle;
    if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return Icon.ExclamationMark;
    return null;
  };

  const renderFeedItem = (item: FeedItem) => {
    const subtitleParts: string[] = [];

    if (item.course_name) {
      subtitleParts.push(item.course_name);
    }

    if (item.location_name) {
      subtitleParts.push(` ${item.location_name}`);
    }

    const accessories = [];

    const statusIcon = getStatusIcon(item);
    if (statusIcon) {
      accessories.push({ icon: statusIcon });
    }

    if (item.due_at) {
      accessories.push({
        text: formatTime(item.due_at),
      });
    } else if (item.start_at) {
      accessories.push({
        text: formatTime(item.start_at),
      });
    }

    let itemUrl: string | null = null;
    if (config?.canvasBaseUrl && item.course_id) {
      const baseUrl = config.canvasBaseUrl.replace(/\/$/, "");
      if (item.assignment_id) {
        itemUrl = `${baseUrl}/courses/${item.course_id}/assignments/${item.assignment_id}`;
      } else if (item.quiz_id) {
        itemUrl = `${baseUrl}/courses/${item.course_id}/quizzes/${item.quiz_id}`;
      } else if (item.course_id) {
        itemUrl = `${baseUrl}/courses/${item.course_id}`;
      }
    }

    const subtitle = subtitleParts.join(" • ");

    return (
      <List.Item
        key={item.id}
        title={truncateTitle(item.title)}
        subtitle={subtitle}
        accessories={accessories}
        icon={getTypeIcon(item)}
        actions={
          <ActionPanel>
            {itemUrl && (
              <Action.OpenInBrowser
                title={
                  item.assignment_id
                    ? "Open Assignment in Browser"
                    : item.quiz_id
                      ? "Open Quiz in Browser"
                      : "Open in Browser"
                }
                icon={Icon.Globe}
                url={itemUrl}
              />
            )}
            <Action
              title="Refresh Feed"
              icon={Icon.ArrowClockwise}
              onAction={() => revalidate()}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          </ActionPanel>
        }
      />
    );
  };

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon="⚠️"
          title="Error Loading Feed"
          description={error instanceof Error ? error.message : "Unknown error occurred"}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={() => revalidate()} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // Group items by due date
  const itemsByDate = new Map<string, FeedItem[]>();
  allItems.forEach((item) => {
    const dateKey = getDateKey(item.due_at || item.start_at);
    if (!itemsByDate.has(dateKey)) {
      itemsByDate.set(dateKey, []);
    }
    itemsByDate.get(dateKey)!.push(item);
  });

  // Sort date keys chronologically
  const sortedDateKeys = Array.from(itemsByDate.keys()).sort((a, b) => {
    if (a === "unscheduled") return 1;
    if (b === "unscheduled") return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const totalItems = allItems.length;

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Assignment Feed"
      searchBarPlaceholder="Search assignments, quizzes, exams..."
      actions={
        <ActionPanel>
          <Action
            title="Refresh Feed"
            icon={Icon.ArrowClockwise}
            onAction={() => revalidate()}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
    >
      {totalItems > 0 ? (
        <>
          {sortedDateKeys.map((dateKey) => {
            const items = itemsByDate.get(dateKey)!;
            const sectionTitle =
              dateKey === "unscheduled"
                ? "Unscheduled"
                : formatDateSectionTitle(items[0]?.due_at || items[0]?.start_at);
            return (
              <List.Section key={dateKey} title={sectionTitle}>
                {items.map((item) => renderFeedItem(item))}
              </List.Section>
            );
          })}
        </>
      ) : (
        <List.EmptyView
          icon={isLoading ? Icon.Hourglass : Icon.Bookmark}
          title={isLoading ? "Fetching your Canvas Feed... Hang Tight!" : "No Upcoming Items"}
          description={isLoading ? "" : "No assignments, quizzes, or events found."}
          actions={
            <ActionPanel>
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={() => revalidate()} />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
