-- Phase 4 (correctness): the app writes through the Supabase client rather than
-- Prisma, so `updated_at` needs a database default (Prisma would otherwise set
-- it itself). We also add a trigger to keep it fresh on every UPDATE.
-- Idempotent; safe to run via `prisma migrate deploy` or the Supabase SQL Editor.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

alter table "resources"    alter column "updated_at" set default now();
alter table "notes"        alter column "updated_at" set default now();
alter table "review_cards" alter column "updated_at" set default now();

drop trigger if exists "resources_set_updated_at" on "resources";
create trigger "resources_set_updated_at" before update on "resources"
  for each row execute function set_updated_at();

drop trigger if exists "notes_set_updated_at" on "notes";
create trigger "notes_set_updated_at" before update on "notes"
  for each row execute function set_updated_at();

drop trigger if exists "review_cards_set_updated_at" on "review_cards";
create trigger "review_cards_set_updated_at" before update on "review_cards"
  for each row execute function set_updated_at();
