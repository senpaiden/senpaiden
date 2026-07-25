-- supabase/migrations/20260725_add_performance_indexes.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_manga_title_trgm ON manga USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_manga_updated_at ON manga (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_manga_number ON chapters (manga_id, chapter_number DESC);
CREATE INDEX IF NOT EXISTS idx_pages_chapter_number ON pages (chapter_id, page_number ASC);
CREATE INDEX IF NOT EXISTS idx_chapters_queued_jobs ON chapters (created_at ASC) WHERE job_status = 'QUEUED';
CREATE INDEX IF NOT EXISTS idx_chapters_processing_started ON chapters (processing_started_at) WHERE job_status = 'PROCESSING';
