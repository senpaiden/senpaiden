-- ============================================================
-- Senpai Den — Supabase Database Seed Script (Phase 1)
-- Run this AFTER schema.sql in the Supabase SQL editor
-- ============================================================

-- Wrap in a transaction to ensure all or nothing
BEGIN;

-- 1. Insert Test Manga (Solo Leveling, One Piece, Tower of God)
WITH new_manga AS (
  INSERT INTO manga (source_id, source_provider, title, cover_url, genres, author, status, description, view_count)
  VALUES 
    ('sl-001', 'firefly', 'Solo Leveling', 'https://example.com/solo-leveling.jpg', ARRAY['Action', 'Fantasy', 'Webtoon'], 'Chugong', 'completed', 'Ten years ago, "the Gate" appeared...', 1050),
    ('op-002', 'mangahook', 'One Piece', 'https://example.com/one-piece.jpg', ARRAY['Action', 'Adventure', 'Comedy'], 'Eiichiro Oda', 'ongoing', 'Gol D. Roger, a man referred to as the "Pirate King"...', 9001),
    ('tog-003', 'firefly', 'Tower of God', 'https://example.com/tower-of-god.jpg', ARRAY['Action', 'Mystery', 'Drama'], 'SIU', 'ongoing', 'What do you desire? Money and wealth? Honor and pride?', 500)
  RETURNING id, title
)
-- 2. Insert Test Chapters
-- We use a CTE to get the manga IDs dynamically
INSERT INTO chapters (manga_id, chapter_number, title, source_url, job_status, content_freshness)
SELECT 
  m.id, 
  c.chapter_number, 
  c.title, 
  c.source_url, 
  c.job_status, 
  c.content_freshness
FROM new_manga m
JOIN (
  VALUES 
    -- Solo Leveling: Mix of READY, PROCESSING, and QUEUED
    ('Solo Leveling', 1.0, 'Prologue', 'https://firefly.com/sl/1', 'READY', 'fresh'),
    ('Solo Leveling', 2.0, 'The Gate', 'https://firefly.com/sl/2', 'READY', 'stale'), -- Testing stale banner
    ('Solo Leveling', 3.0, 'E-Rank Hunter', 'https://firefly.com/sl/3', 'PROCESSING', 'fresh'),
    ('Solo Leveling', 4.0, 'The Double Dungeon', 'https://firefly.com/sl/4', 'QUEUED', 'fresh'),
    ('Solo Leveling', 5.0, 'Statues', 'https://firefly.com/sl/5', 'QUEUED', 'fresh'),

    -- One Piece: Testing FAILED and ARCHIVED states
    ('One Piece', 1000.0, 'Straw Hat Luffy', 'https://mangahook.com/op/1000', 'READY', 'fresh'),
    ('One Piece', 1001.0, 'Onigashima', 'https://mangahook.com/op/1001', 'ARCHIVED', 'archived'), -- Evicted
    ('One Piece', 1002.0, 'Emperors', 'https://mangahook.com/op/1002', 'FAILED', 'fresh'),
    ('One Piece', 1003.0, 'Night on the Board', 'https://mangahook.com/op/1003', 'QUEUED', 'fresh'),
    
    -- Tower of God: Standard pipeline
    ('Tower of God', 1.0, 'Headon', 'https://firefly.com/tog/1', 'READY', 'fresh'),
    ('Tower of God', 2.0, 'The Test', 'https://firefly.com/tog/2', 'QUEUED', 'fresh')
) AS c(manga_title, chapter_number, title, source_url, job_status, content_freshness)
  ON m.title = c.manga_title;

-- 3. Insert Test Pages for a READY chapter (Solo Leveling Ch 1)
WITH sl_ch1 AS (
  SELECT c.id 
  FROM chapters c 
  JOIN manga m ON c.manga_id = m.id 
  WHERE m.title = 'Solo Leveling' AND c.chapter_number = 1.0
  LIMIT 1
)
INSERT INTO pages (chapter_id, page_number, r2_keys, slice_dimensions)
SELECT 
  id, 
  1, 
  ARRAY['manga/test-sl-ch1/1_0.webp', 'manga/test-sl-ch1/1_1.webp'], 
  '[{"width": 800, "height": 1500}, {"width": 800, "height": 750}]'::JSONB
FROM sl_ch1;

-- 4. Insert Dead Letter Queue entry for the FAILED chapter (One Piece Ch 1002)
WITH op_failed AS (
  SELECT c.id 
  FROM chapters c 
  JOIN manga m ON c.manga_id = m.id 
  WHERE m.title = 'One Piece' AND c.job_status = 'FAILED'
  LIMIT 1
)
INSERT INTO dead_letter_queue (chapter_id, error_type, error_detail)
SELECT 
  id, 
  'PROCESSING_TIMEOUT', 
  'Hugging Face worker timed out after 300 seconds.'
FROM op_failed;

COMMIT;

-- Print summary
DO $$
BEGIN
  RAISE NOTICE 'Seed successful! Inserted 3 Manga, 11 Chapters, 1 Page record, and 1 DLQ record.';
END $$;
