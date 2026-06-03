export type ResourceType = "link" | "gdrive" | "youtube" | "pdf" | "notes" | "other";

export interface ResourceLink {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  url: string;
  type: ResourceType;
  created_at: string;
}
