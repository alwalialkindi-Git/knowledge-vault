-- ============================================================================
-- My Learning Vault — Storage setup (Phase 2)
-- ----------------------------------------------------------------------------
-- Creates a PRIVATE bucket for uploaded PDFs and restricts every object to its
-- owner. Files are stored under a per-user folder:  <auth.uid()>/<uuid>.pdf
-- so the first path segment identifies the owner.
--
-- Where to run it:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once (idempotent).
-- ============================================================================

-- 1. Private bucket --------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', false)
on conflict (id) do nothing;

-- 2. Owner-only access to objects in this bucket ---------------------------
--    (storage.objects already has RLS enabled by Supabase.)

drop policy if exists "resource_files_select" on storage.objects;
create policy "resource_files_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resource-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resource_files_insert" on storage.objects;
create policy "resource_files_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resource-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resource_files_update" on storage.objects;
create policy "resource_files_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'resource-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'resource-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resource_files_delete" on storage.objects;
create policy "resource_files_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resource-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
