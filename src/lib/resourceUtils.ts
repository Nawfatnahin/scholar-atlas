import type { ResourceType } from "@/types/resources";

export function detectResourceType(url: string): ResourceType {
  if (url.includes("drive.google.com")) return "gdrive";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes(".pdf")) return "pdf";
  if (url.includes("notion.so") || url.includes("obsidian")) return "notes";
  return "link";
}

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  gdrive:  "🗂️",
  youtube: "▶️",
  pdf:     "📄",
  notes:   "📝",
  link:    "🔗",
  other:   "📎",
};
