/**
 * Extracts Canvas file information from HTML assignment descriptions
 */

export interface CanvasFileLink {
  fileId: number;
  filename: string;
  url: string;
}

/**
 * Extracts file ID from Canvas file URL
 * Canvas file URLs can be in formats:
 * - /courses/{course_id}/files/{file_id}/download
 * - /files/{file_id}/download
 * - /courses/{course_id}/files/{file_id}/preview
 */
function extractFileIdFromUrl(url: string): number | null {
  try {
    // Match patterns like /files/123/download or /courses/456/files/123/download
    const fileIdMatch = url.match(/\/files\/(\d+)(?:\/download|\/preview)?/);
    if (fileIdMatch && fileIdMatch[1]) {
      return parseInt(fileIdMatch[1], 10);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parses HTML content to extract Canvas file links
 * Looks for anchor tags with class "instructure_file_link"
 */
export function extractFileLinksFromHtml(html: string): CanvasFileLink[] {
  if (!html || html.trim().length === 0) {
    return [];
  }

  const fileLinks: CanvasFileLink[] = [];

  try {
    // Create a temporary DOM element to parse HTML
    // Note: In Node.js/Raycast environment, we'll use regex parsing
    // since we don't have a full DOM parser available

    // Match anchor tags with instructure_file_link class
    const linkPattern =
      /<a[^>]*class="[^"]*instructure_file_link[^"]*"[^>]*href="([^"]*)"[^>]*(?:title="([^"]*)")?[^>]*>(.*?)<\/a>/gi;

    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1] || "";
      const title = match[2] || "";
      const linkText = match[3] || "";

      // Extract file ID from URL
      const fileId = extractFileIdFromUrl(href);
      if (!fileId) {
        continue;
      }

      // Determine filename from title, link text, or URL
      let filename = title.trim();
      if (!filename) {
        filename = linkText.trim();
      }
      if (!filename) {
        // Try to extract from URL as last resort
        const urlMatch = href.match(/\/([^\/]+)(?:\?|$)/);
        filename = urlMatch ? urlMatch[1] : `file-${fileId}`;
      }

      // Clean up filename (remove HTML entities and tags)
      filename = filename
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (!filename) {
        filename = `file-${fileId}`;
      }

      fileLinks.push({
        fileId,
        filename,
        url: href,
      });
    }
  } catch (error) {
    console.error("Error extracting file links from HTML:", error);
  }

  // Remove duplicates based on fileId
  const uniqueFiles = new Map<number, CanvasFileLink>();
  fileLinks.forEach((file) => {
    if (!uniqueFiles.has(file.fileId)) {
      uniqueFiles.set(file.fileId, file);
    }
  });

  return Array.from(uniqueFiles.values());
}
