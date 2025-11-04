/**
 * Truncates text to a maximum length and appends ellipsis when truncated
 */
export function truncateTitle(title: string, maxLength: number = 40): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + "...";
}
