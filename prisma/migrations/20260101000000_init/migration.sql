-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('book', 'video', 'course', 'article', 'note');
CREATE TYPE "ResourceStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'on_hold');
CREATE TYPE "UnitLabel" AS ENUM ('pages', 'lessons', 'videos', 'minutes', 'chapters');
CREATE TYPE "Priority" AS ENUM ('low', 'normal', 'high');
CREATE TYPE "NoteType" AS ENUM ('note', 'takeaway', 'quote');
CREATE TYPE "ContentSource" AS ENUM ('manual', 'ai');
CREATE TYPE "CardStatus" AS ENUM ('active', 'suspended');

-- CreateTable
CREATE TABLE "focus_areas" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    CONSTRAINT "focus_areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "focus_area_id" UUID,
    "status" "ResourceStatus" NOT NULL DEFAULT 'not_started',
    "source_url" TEXT,
    "author_or_creator" TEXT,
    "total_units" INTEGER,
    "completed_units" INTEGER NOT NULL DEFAULT 0,
    "unit_label" "UnitLabel",
    "priority" "Priority" NOT NULL DEFAULT 'normal',
    "rating" INTEGER,
    "cover_image_url" TEXT,
    "file_key" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'note',
    "content" TEXT NOT NULL,
    "location" TEXT,
    "is_review_card" BOOLEAN NOT NULL DEFAULT false,
    "source" "ContentSource" NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_cards" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "note_id" UUID NOT NULL,
    "interval_days" INTEGER NOT NULL DEFAULT 1,
    "next_review_at" DATE NOT NULL,
    "last_reviewed_at" TIMESTAMP(3),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "status" "CardStatus" NOT NULL DEFAULT 'active',
    "source" "ContentSource" NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "review_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "focus_areas_key_key" ON "focus_areas"("key");
CREATE INDEX "resources_user_id_idx" ON "resources"("user_id");
CREATE INDEX "resources_focus_area_id_idx" ON "resources"("focus_area_id");
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");
CREATE INDEX "notes_resource_id_idx" ON "notes"("resource_id");
CREATE UNIQUE INDEX "review_cards_note_id_key" ON "review_cards"("note_id");
CREATE INDEX "review_cards_user_id_idx" ON "review_cards"("user_id");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_focus_area_id_fkey" FOREIGN KEY ("focus_area_id") REFERENCES "focus_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
