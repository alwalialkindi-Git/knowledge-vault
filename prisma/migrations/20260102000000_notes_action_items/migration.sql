-- Phase 3: add the action_item note type and action-item status fields.
-- Idempotent so it is safe to run via `prisma migrate deploy` or directly
-- in the Supabase SQL Editor.

-- New value on the NoteType enum
ALTER TYPE "NoteType" ADD VALUE IF NOT EXISTS 'action_item';

-- Action-item status fields on notes (unused/default for other note types)
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "is_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);
