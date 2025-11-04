/**
 * Formats a date string into a human-readable format
 * @param dateString - ISO date string or undefined
 * @returns Formatted date string (e.g., "Jan 15, 2024, 02:30 PM") or "No due date" if undefined
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a date as "[Day of the Week], Month Day" (e.g., "Monday, January 15")
 */
export function formatDateSectionTitle(dateString?: string): string {
  if (!dateString) return "Unscheduled";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Gets the date key for grouping (normalizes to start of day)
 */
export function getDateKey(dateString?: string): string {
  if (!dateString) return "unscheduled";
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Formats a date to show only the time in a compact format (e.g., "2:30p")
 */
export function formatTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const timeString = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return timeString.replace(/\s+(AM|PM)/i, (match, period) => period.toLowerCase());
}
