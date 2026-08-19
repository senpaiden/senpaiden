import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const { data: chapter, error } = await supabase
      .from('chapters')
      .select('id, job_status, content_freshness, processing_started_at, created_at, error_message')
      .eq('id', id)
      .single();

    if (error || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    let elapsed_seconds = 0;
    if (chapter.processing_started_at) {
      elapsed_seconds = Math.max(0, Math.floor((Date.now() - new Date(chapter.processing_started_at).getTime()) / 1000));
    }

    return NextResponse.json(
      {
        job_status: chapter.job_status,
        elapsed_seconds,
        content_freshness: chapter.content_freshness,
        error_message: chapter.error_message,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
