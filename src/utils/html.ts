// @ts-expect-error - turndown doesn't have type definitions
import TurndownService from "turndown";

/**
 * Converts HTML content to markdown format
 * Useful for converting Canvas API HTML descriptions to markdown for display
 */
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  // Configure turndown to handle file links better
  turndownService.addRule("fileLink", {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: (node: any) => {
      return (
        node.nodeName === "A" &&
        node.hasAttribute("class") &&
        node.getAttribute("class")?.includes("instructure_file_link")
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replacement: (content: string, node: any) => {
      const href = (node as HTMLAnchorElement).href || "";
      const title = (node as HTMLAnchorElement).title || content;
      // Extract filename from title or content
      const filename = title || content || "File";
      return `[${filename}](${href})`;
    },
  });

  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error("Error converting HTML to markdown:", error);
    // Fallback: return the HTML as-is if conversion fails
    return html;
  }
}
