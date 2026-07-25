-- supabase/migrations/20260725_add_blurhash_column.sql
ALTER TABLE pages ADD COLUMN IF NOT EXISTS blurhash TEXT;
