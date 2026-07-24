-- ============================================================
-- Senpai Den — Supabase PostgreSQL Schema
-- Phase 1: Run this in the Supabase SQL editor
-- ============================================================

-- Enable fuzzy search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- manga
-- ============================================================
CREATE TABLE IF NOT EXISTS manga (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       TEXT UNIQUE NOT NULL,
  source_provider TEXT NOT NULL,
  title           TEXT NOT NULL,
  cover_url       TEXT,
  genres          TEXT[] DEFAULT '{}',
  author          TEXT,
  status          TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing','completed','hiatus')),
  description     TEXT,
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS manga_title_trgm_idx ON manga USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS manga_genres_idx ON manga USING GIN (genres);

-- ============================================================
-- chapters
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id              UUID REFERENCES manga(id) ON DELETE CASCADE,
  chapter_number        DECIMAL NOT NULL,
  title                 TEXT,
  source_url            TEXT NOT NULL,
  job_status            TEXT DEFAULT 'QUEUED'
                        CHECK (job_status IN (
                          'DISCOVERED','QUEUED','PROCESSING','READY',
                          'FAILED','STALE_RETRY','ARCHIVED'
                        )),
  content_freshness     TEXT DEFAULT 'fresh'
                        CHECK (content_freshness IN ('fresh','stale','archived')),
  last_served_at        TIMESTAMPTZ,
  retry_count           INTEGER DEFAULT 0,
  error_message         TEXT,
  processing_started_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manga_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS chapters_job_status_idx ON chapters (job_status);
CREATE INDEX IF NOT EXISTS chapters_manga_id_idx ON chapters (manga_id);

-- ============================================================
-- pages
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id       UUID REFERENCES chapters(id) ON DELETE CASCADE,
  page_number      INTEGER NOT NULL,
  r2_keys          TEXT[] DEFAULT '{}',
  slice_dimensions JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, page_number)
);

-- ============================================================
-- dead_letter_queue
-- ============================================================
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id    UUID REFERENCES chapters(id),
  error_type    TEXT NOT NULL,
  error_detail  TEXT,
  retry_count   INTEGER DEFAULT 0,
  max_retries   INTEGER DEFAULT 3,
  resolved      BOOLEAN DEFAULT false,
  next_retry_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- error_log
-- ============================================================
CREATE TABLE IF NOT EXISTS error_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT,
  error_type   TEXT NOT NULL,
  error_detail TEXT,
  chapter_id   UUID REFERENCES chapters(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manga_updated_at
  BEFORE UPDATE ON manga FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER chapters_updated_at
  BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER dlq_updated_at
  BEFORE UPDATE ON dead_letter_queue FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Eviction function (called by weekly GitHub Actions job)
-- ============================================================
CREATE OR REPLACE FUNCTION evict_old_chapter_images(days_old INT DEFAULT 30)
RETURNS UUID[] AS $$
DECLARE
  evicted_ids UUID[];
BEGIN
  SELECT array_agg(id) INTO evicted_ids
  FROM chapters
  WHERE updated_at < NOW() - (days_old || ' days')::INTERVAL
    AND job_status = 'READY'
    AND id NOT IN (
      SELECT DISTINCT chapter_id
      FROM pages
      WHERE created_at > NOW() - '7 days'::INTERVAL
    );

  IF evicted_ids IS NOT NULL THEN
    UPDATE chapters
    SET job_status = 'ARCHIVED', content_freshness = 'archived'
    WHERE id = ANY(evicted_ids);
  END IF;

  RETURN COALESCE(evicted_ids, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

-- Public read for manga, chapters, pages
CREATE POLICY "Public can read manga" ON manga FOR SELECT USING (true);
CREATE POLICY "Public can read chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Public can read pages" ON pages FOR SELECT USING (true);

-- Service role only for writes (enforced via SUPABASE_SERVICE_KEY)
-- No explicit policy needed — service role bypasses RLS by default in Supabase
