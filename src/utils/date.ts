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
