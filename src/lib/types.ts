import type { Locale } from "@/i18n/config";

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

export interface FocusArea {
  id: string;
  key: string;
  name_en: string;
  name_ar: string;
  color: string;
  sort_order: number;
}

export interface Resource {
  id: string;
  user_id: string;
  title: string;
  type: ResourceType;
  focus_area_id: string | null;
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

export function focusAreaName(area: FocusArea, locale: Locale): string {
  return locale === "ar" ? area.name_ar : area.name_en;
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
      focus_area: {
        name_en: string;
        name_ar: string;
        color: string;
      } | null;
    } | null;
  } | null;
}
