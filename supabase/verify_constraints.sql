-- ============================================================
-- Senpai Den — Schema Constraint Verification Script
-- Run this in the Supabase SQL editor to test DB constraints
-- Expected outcome: Most of these should THROW AN ERROR
-- ============================================================

-- Wrap in a transaction and rollback at the end so we don't mess up the seed data
BEGIN;

DO $$ 
BEGIN 
  RAISE NOTICE '--- Starting Constraint Verification ---'; 
END $$;

-- 1. Test: Invalid Job Status Enum
-- Expected: ERROR: new row for relation "chapters" violates check constraint
DO $$
DECLARE
  test_manga_id UUID;
BEGIN
  SELECT id INTO test_manga_id FROM manga LIMIT 1;
  
  BEGIN
    INSERT INTO chapters (manga_id, chapter_number, source_url, job_status)
    VALUES (test_manga_id, 999, 'http://test.com', 'INVALID_STATUS');
    RAISE EXCEPTION 'Test Failed: Allowed invalid job_status!';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test Passed: Invalid job_status blocked.';
  END;
END $$;

-- 2. Test: Invalid Content Freshness Enum
-- Expected: ERROR: new row for relation "chapters" violates check constraint
DO $$
DECLARE
  test_manga_id UUID;
BEGIN
  SELECT id INTO test_manga_id FROM manga LIMIT 1;
  
  BEGIN
    INSERT INTO chapters (manga_id, chapter_number, source_url, content_freshness)
    VALUES (test_manga_id, 998, 'http://test.com', 'rotten');
    RAISE EXCEPTION 'Test Failed: Allowed invalid content_freshness!';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test Passed: Invalid content_freshness blocked.';
  END;
END $$;

-- 3. Test: Unique Chapter Constraint (manga_id, chapter_number)
-- Expected: ERROR: duplicate key value violates unique constraint
DO $$
DECLARE
  test_manga_id UUID;
BEGIN
  SELECT id INTO test_manga_id FROM manga LIMIT 1;
  
  BEGIN
    -- Insert chapter 997 twice
    INSERT INTO chapters (manga_id, chapter_number, source_url) VALUES (test_manga_id, 997, 'http://test1.com');
    INSERT INTO chapters (manga_id, chapter_number, source_url) VALUES (test_manga_id, 997, 'http://test2.com');
    RAISE EXCEPTION 'Test Failed: Allowed duplicate chapter_number for same manga!';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'Test Passed: Duplicate chapter_number blocked.';
  END;
END $$;

-- 4. Test: Triggers update `updated_at`
DO $$
DECLARE
  test_manga_id UUID;
  old_updated_at TIMESTAMPTZ;
  new_updated_at TIMESTAMPTZ;
BEGIN
  SELECT id, updated_at INTO test_manga_id, old_updated_at FROM manga LIMIT 1;
  
  -- Fake delay for timestamp to shift
  PERFORM pg_sleep(0.1); 
  
  UPDATE manga SET view_count = view_count + 1 WHERE id = test_manga_id
  RETURNING updated_at INTO new_updated_at;
  
  IF new_updated_at > old_updated_at THEN
    RAISE NOTICE 'Test Passed: updated_at trigger working.';
  ELSE
    RAISE EXCEPTION 'Test Failed: updated_at trigger did not update timestamp!';
  END IF;
END $$;

-- 5. Test: ON DELETE CASCADE
DO $$
DECLARE
  target_manga_id UUID;
  chapter_count INT;
BEGIN
  -- We'll delete Tower of God (should have 2 chapters)
  SELECT id INTO target_manga_id FROM manga WHERE title = 'Tower of God' LIMIT 1;
  
  DELETE FROM manga WHERE id = target_manga_id;
  
  -- Check if its chapters were deleted
  SELECT COUNT(*) INTO chapter_count FROM chapters WHERE manga_id = target_manga_id;
  
  IF chapter_count = 0 THEN
    RAISE NOTICE 'Test Passed: ON DELETE CASCADE working perfectly.';
  ELSE
    RAISE EXCEPTION 'Test Failed: Chapters still exist after manga deletion!';
  END IF;
END $$;


DO $$ 
BEGIN 
  RAISE NOTICE '--- Constraint Verification Complete ---'; 
END $$;

-- Rollback the transaction so we don't actually delete 'Tower of God' or mess up the DB state
ROLLBACK;
