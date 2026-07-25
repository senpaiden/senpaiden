-- supabase/migrations/20260725_claim_next_chapter_rpc.sql
CREATE OR REPLACE FUNCTION claim_next_chapter()
RETURNS TABLE (id UUID, source_url TEXT, chapter_number NUMERIC, manga_id UUID) AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT c.id INTO target_id
  FROM chapters c
  WHERE c.job_status = 'QUEUED'
  ORDER BY c.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF target_id IS NOT NULL THEN
    UPDATE chapters
    SET job_status = 'PROCESSING', processing_started_at = NOW()
    WHERE chapters.id = target_id;
  END IF;

  RETURN QUERY SELECT c.id, c.source_url, c.chapter_number, c.manga_id
  FROM chapters c WHERE c.id = target_id;
END;
$$ LANGUAGE plpgsql;
