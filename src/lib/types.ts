export type ResourceType = "book" | "video" | "course" | "article" | "note";
export type ResourceStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "on_hold";
export type UnitLabel = "pages" | "lessons" | "videos" | "minutes" | "chapters";
export type Priority = "low" | "normal" | "high";

export const RESOURCE_TYPES: ResourceType[] = [
  "book",
  "video",
  "course",
  "article",
  "note",
];
export const RESOURCE_STATUSES: ResourceStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "on_hold",
];
export const UNIT_LABELS: UnitLabel[] = [
  "pages",
  "lessons",
  "videos",
  "minutes",
  "chapters",
];
export const PRIORITIES: Priority[] = ["low", "normal", "high"];

export interface LearningDomain {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  title: string;
  type: ResourceType;
  focus_area_id: string | null;     // legacy — kept for DB compat
  learning_domain_id: string | null;
  status: ResourceStatus;
  source_url: string | null;
  author_or_creator: string | null;
  total_units: number | null;
  completed_units: number;
  unit_label: UnitLabel | null;
  priority: Priority;
  rating: number | null;
  cover_image_url: string | null;
  file_key: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  ai_summary: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export const statusBadgeClasses: Record<ResourceStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  on_hold: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export type NoteType = "note" | "takeaway" | "quote" | "action_item";

export const NOTE_TYPES: NoteType[] = [
  "note",
  "takeaway",
  "quote",
  "action_item",
];

export interface Note {
  id: string;
  user_id: string;
  resource_id: string;
  type: NoteType;
  content: string;
  location: string | null;
  is_review_card: boolean;
  is_completed: boolean;
  completed_at: string | null;
  source: "manual" | "ai";
  created_at: string;
  updated_at: string;
}

export type ItemType = "chapter" | "lesson" | "video" | "article";
export const ITEM_TYPES: ItemType[] = ["chapter", "lesson", "video", "article"];

export interface ResourceItem {
  id: string;
  user_id: string;
  resource_id: string;
  title: string;
  description: string | null;
  item_type: string; // text column — chapter | lesson | video | article
  url: string | null;
  estimated_minutes: number | null;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Concept {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConceptLink {
  id: string;
  user_id: string;
  concept_id: string;
  note_id: string | null;
  resource_id: string | null;
  resource_item_id: string | null;
  created_at: string;
}

export interface DueCard {
  id: string;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  review_count: number;
  status: string;
  note: {
    id: string;
    content: string;
    location: string | null;
    type: NoteType;
    resource: {
      id: string;
      title: string;
      learning_domain: {
        name: string;
        color: string | null;
      } | null;
    } | null;
  } | null;
}
