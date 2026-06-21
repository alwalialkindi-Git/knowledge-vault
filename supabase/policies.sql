-- ============================================================================
-- My Learning Vault — Row-Level Security (RLS)
-- ----------------------------------------------------------------------------
-- Makes the vault private: each signed-in user can only touch their own rows.
-- Run this AFTER the Prisma migration has created the tables.
--
-- Where to run it:
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--
-- Safe to run more than once (every statement is idempotent).
-- Note: Prisma connects as the table owner and bypasses RLS, so seeding and any
-- server-side admin work keep functioning. RLS protects access made with the
-- Supabase client using a user's session (the anon/authenticated keys).
-- ============================================================================

-- 1. Turn on RLS for every relevant table -----------------------------------
alter table "resources"    enable row level security;
alter table "notes"        enable row level security;
alter table "review_cards" enable row level security;
alter table "focus_areas"  enable row level security;

-- 2. resources: owner-only for select / insert / update / delete -------------
drop policy if exists "resources_owner_all" on "resources";
create policy "resources_owner_all"
  on "resources"
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. notes: owner-only for select / insert / update / delete -----------------
drop policy if exists "notes_owner_all" on "notes";
create policy "notes_owner_all"
  on "notes"
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4. review_cards: owner-only for select / insert / update / delete ----------
drop policy if exists "review_cards_owner_all" on "review_cards";
create policy "review_cards_owner_all"
  on "review_cards"
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 5. focus_areas: shared lookup table, readable by any signed-in user --------
--    No insert/update/delete policy => only the owner role (Prisma seed) can
--    write to it; authenticated users can read but not modify.
drop policy if exists "focus_areas_read" on "focus_areas";
create policy "focus_areas_read"
  on "focus_areas"
  for select
  to authenticated
  using (true);

-- ============================================================================
-- Optional verification: confirm RLS is enabled and policies exist.
-- (You can run these as separate queries after the block above.)
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in ('resources','notes','review_cards','focus_areas');
--
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
-- ============================================================================
