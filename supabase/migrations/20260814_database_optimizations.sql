-- supabase/migrations/20260814_database_optimizations.sql
-- Optimizations for query latency, co-binged recommendations, and genre lookups

-- 1. Index for popular manga & recommendation queries (avoids Seq Scan on order by view_count)
CREATE INDEX IF NOT EXISTS idx_manga_view_count ON public.manga (view_count DESC);

-- 2. GIN Index for fast genre containment/overlap queries (contains('genres', ...))
CREATE INDEX IF NOT EXISTS idx_manga_genres_gin ON public.manga USING GIN (genres);

-- 3. Composite Index for chapter lookup with language & chapter ordering
CREATE INDEX IF NOT EXISTS idx_chapters_manga_lang_num ON public.chapters (manga_id, language, chapter_number DESC);

-- 4. Index on last_served_at for eviction queries
CREATE INDEX IF NOT EXISTS idx_chapters_last_served ON public.chapters (last_served_at) WHERE last_served_at IS NOT NULL;
