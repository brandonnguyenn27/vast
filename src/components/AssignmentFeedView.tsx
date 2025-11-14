import { List, Icon, ActionPanel, Action } from "@raycast/api";
import { useAssignmentFeed } from "../hooks/useAssignmentFeed";
import { FeedItem } from "../types/canvas";
import { formatDateSectionTitle, getDateKey } from "../utils/date";
import { useCanvasAuth } from "../hooks/useCanvasAuth";
import { AssignmentListItem } from "./AssignmentListItem";

export function AssignmentFeedView() {
  const { allItems, isLoading, error, revalidate } = useAssignmentFeed();
  const { config } = useCanvasAuth();

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
                {items.map((item) => (
                  <AssignmentListItem
                    key={item.id}
                    item={item}
                    canvasBaseUrl={config?.canvasBaseUrl}
                    onRefresh={revalidate}
                  />
                ))}
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
