"use server";

import { cookies } from "next/headers";
import { getAdminSupabaseClient } from "@/lib/supabase";

const ADMIN_COOKIE_NAME = "senpaiden_admin_session";
const DEFAULT_ADMIN_PASS = "senpaiden123";

// ── Security Actions ─────────────────────────────────────────────────────────

export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  const expectedPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;

  if (password === expectedPassword) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, "authenticated_session_token_valid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return { success: true };
  }

  return { success: false, error: "Invalid admin password credentials." };
}

export async function logoutAdmin(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return { success: true };
}

export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  return session?.value === "authenticated_session_token_valid";
}

// ── Metrics & Stats Actions ──────────────────────────────────────────────────

export async function getDashboardMetrics() {
  const isAuth = await checkAdminSession();
  if (!isAuth) throw new Error("Unauthorized admin access");

  const supabase = getAdminSupabaseClient();

  // 1. Chapter State Machine Counts
  const statuses = ['QUEUED', 'PROCESSING', 'READY', 'FAILED', 'STALE_RETRY', 'ARCHIVED'];
  const statusCounts: Record<string, number> = {
    QUEUED: 0,
    PROCESSING: 0,
    READY: 0,
    FAILED: 0,
    STALE_RETRY: 0,
    ARCHIVED: 0,
  };

  for (const status of statuses) {
    const { count } = await supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('job_status', status);
    statusCounts[status] = count || 0;
  }

  // 2. Total Manga Count
  const { count: mangaCount } = await supabase
    .from('manga')
    .select('id', { count: 'exact', head: true });

  // 3. Total Page Slices Count
  const { count: pageCount } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true });

  // 4. DLQ Unresolved Count
  const { count: dlqCount } = await supabase
    .from('dead_letter_queue')
    .select('id', { count: 'exact', head: true })
    .eq('resolved', false);

  // 5. Real Manga Records
  const { data: popularManga } = await supabase
    .from('manga')
    .select('id, title, view_count, cover_url, status, source_provider, created_at, updated_at')
    .order('view_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(10);

  // 6. Recent Error Logs
  let { data: recentErrors } = await supabase
    .from('error_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!recentErrors || recentErrors.length === 0) {
    const { data: dlqErrors } = await supabase
      .from('dead_letter_queue')
      .select('id, error_type, error_detail, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (dlqErrors && dlqErrors.length > 0) {
      recentErrors = dlqErrors.map((err) => ({
        id: err.id,
        provider: 'Pipeline Ingestion',
        error_type: err.error_type,
        error_detail: err.error_detail,
        created_at: err.created_at,
      }));
    }
  }

  // 7. DLQ Table Items
  const { data: dlqItems } = await supabase
    .from('dead_letter_queue')
    .select('*, chapters(title, chapter_number, manga(title))')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(25);

  return {
    statusCounts,
    mangaCount: mangaCount || 0,
    pageCount: pageCount || 0,
    dlqCount: dlqCount || 0,
    popularManga: popularManga || [],
    recentErrors: recentErrors || [],
    dlqItems: dlqItems || [],
    lastRefreshed: new Date().toISOString(),
  };
}

// ── Provider Comparison & Inspection Strategy ───────────────────────────────

export interface ProviderAuditResult {
  provider: 'mangapill' | 'mangadex';
  mangaTitle: string;
  totalChapters: number;
  hasCombinedChapters: boolean;
  combinedChapterDetails: string[];
  hasGaps: boolean;
  gapDetails: string;
  recommended: boolean;
  error?: string;
}

export async function compareProviders(title: string): Promise<{
  title: string;
  mangapill: ProviderAuditResult;
  mangadex: ProviderAuditResult;
  optimalProvider: 'mangapill' | 'mangadex';
  rationale: string;
}> {
  const query = title.trim();

  // Helper 1: Inspect MangaPill
  const inspectMangaPill = async (): Promise<ProviderAuditResult> => {
    try {
      const searchRes = await fetch(`https://mangapill.com/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://mangapill.com/'
        }
      });
      if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`);
      const html = await searchRes.text();
      const match = html.match(/href="\/manga\/(\d+\/[^"]+)"[^>]*>[\s\S]*?<div class="[^"]*font-bold[^"]*">([^<]+)<\/div>/i);
      if (!match) throw new Error(`Series not found on MangaPill`);

      const mangaSourceId = match[1];
      const mangaTitle = match[2]?.trim() || query;

      const chRes = await fetch(`https://mangapill.com/manga/${mangaSourceId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://mangapill.com/'
        }
      });
      if (!chRes.ok) throw new Error(`HTTP ${chRes.status}`);
      const chHtml = await chRes.text();
      const chMatches = [...chHtml.matchAll(/href="\/chapters\/([^"]+)"[^>]*>([^<]+)</g)];

      const combined: string[] = [];
      const numbers: number[] = [];

      chMatches.forEach((m) => {
        const slug = m[1];
        const t = m[2]?.trim() || '';
        const numMatch = slug.match(/chapter-([\d.]+)/i);
        const num = numMatch ? parseFloat(numMatch[1]) : 0;
        if (num > 0) numbers.push(num);

        // Combined chapter regex check (e.g., 1-5, omnibus, vol)
        if (/\d+[-_]\d+/.test(slug) || /combined|omnibus|vol\.?\d+-\d+/i.test(t)) {
          combined.push(t || slug);
        }
      });

      numbers.sort((a, b) => a - b);
      let hasGaps = false;
      let gapDetails = "No gaps";
      if (numbers.length > 1) {
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const expectedCount = max - min + 1;
        if (numbers.length < expectedCount * 0.85) {
          hasGaps = true;
          gapDetails = `Missing ~${Math.round(expectedCount - numbers.length)} chapters between Ch. ${min} & Ch. ${max}`;
        }
      }

      return {
        provider: 'mangapill',
        mangaTitle,
        totalChapters: chMatches.length,
        hasCombinedChapters: combined.length > 0,
        combinedChapterDetails: combined.slice(0, 3),
        hasGaps,
        gapDetails,
        recommended: false,
      };
    } catch (err: any) {
      return {
        provider: 'mangapill',
        mangaTitle: query,
        totalChapters: 0,
        hasCombinedChapters: false,
        combinedChapterDetails: [],
        hasGaps: false,
        gapDetails: "N/A",
        recommended: false,
        error: err.message,
      };
    }
  };

  // Helper 2: Inspect MangaDex
  const inspectMangaDex = async (): Promise<ProviderAuditResult> => {
    try {
      const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=1`);
      if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`);
      const searchData = await searchRes.json() as { data?: Array<any> };
      const item = searchData.data?.[0];
      if (!item) throw new Error(`Series not found on MangaDex`);

      const mangaSourceId = item.id;
      const tObj = item.attributes?.title || {};
      const mangaTitle = tObj.en || Object.values(tObj)[0] || query;

      const chRes = await fetch(`https://api.mangadex.org/manga/${mangaSourceId}/feed?limit=500&translatedLanguage[]=en&order[chapter]=asc`);
      if (!chRes.ok) throw new Error(`HTTP ${chRes.status}`);
      const chData = await chRes.json() as { data?: Array<any> };
      const list = chData.data || [];

      const combined: string[] = [];
      const numbers: number[] = [];

      list.forEach((ch) => {
        const numStr = ch.attributes?.chapter || '';
        const titleStr = ch.attributes?.title || '';
        const num = parseFloat(numStr);
        if (!isNaN(num) && num > 0) numbers.push(num);

        if (/\d+[-_]\d+/.test(numStr) || /combined|omnibus|vol\.?\d+-\d+/i.test(titleStr)) {
          combined.push(`Ch. ${numStr}: ${titleStr}`);
        }
      });

      numbers.sort((a, b) => a - b);
      let hasGaps = false;
      let gapDetails = "No gaps";
      if (numbers.length > 1) {
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const expectedCount = max - min + 1;
        if (numbers.length < expectedCount * 0.85) {
          hasGaps = true;
          gapDetails = `Missing ~${Math.round(expectedCount - numbers.length)} chapters between Ch. ${min} & Ch. ${max}`;
        }
      }

      return {
        provider: 'mangadex',
        mangaTitle,
        totalChapters: list.length,
        hasCombinedChapters: combined.length > 0,
        combinedChapterDetails: combined.slice(0, 3),
        hasGaps,
        gapDetails,
        recommended: false,
      };
    } catch (err: any) {
      return {
        provider: 'mangadex',
        mangaTitle: query,
        totalChapters: 0,
        hasCombinedChapters: false,
        combinedChapterDetails: [],
        hasGaps: false,
        gapDetails: "N/A",
        recommended: false,
        error: err.message,
      };
    }
  };

  const [mangapill, mangadex] = await Promise.all([inspectMangaPill(), inspectMangaDex()]);

  // Determine Optimal Provider Strategy
  let optimalProvider: 'mangapill' | 'mangadex' = 'mangapill';
  let rationale = "";

  if (mangapill.totalChapters > 0 && mangadex.totalChapters === 0) {
    optimalProvider = 'mangapill';
    rationale = `MangaPill contains ${mangapill.totalChapters} chapters while MangaDex returned 0 chapters.`;
  } else if (mangadex.totalChapters > 0 && mangapill.totalChapters === 0) {
    optimalProvider = 'mangadex';
    rationale = `MangaDex contains ${mangadex.totalChapters} chapters while MangaPill returned 0 chapters.`;
  } else if (mangapill.totalChapters >= mangadex.totalChapters) {
    if (mangapill.hasCombinedChapters && !mangadex.hasCombinedChapters) {
      optimalProvider = 'mangadex';
      rationale = `MangaDex selected to avoid combined/grouped chapters found on MangaPill.`;
    } else {
      optimalProvider = 'mangapill';
      rationale = `MangaPill selected with superior total chapter count (${mangapill.totalChapters} vs ${mangadex.totalChapters}).`;
    }
  } else {
    if (mangadex.hasCombinedChapters && !mangapill.hasCombinedChapters) {
      optimalProvider = 'mangapill';
      rationale = `MangaPill selected to avoid combined/grouped chapters on MangaDex.`;
    } else {
      optimalProvider = 'mangadex';
      rationale = `MangaDex selected with superior chapter count (${mangadex.totalChapters} vs ${mangapill.totalChapters}).`;
    }
  }

  if (optimalProvider === 'mangapill') mangapill.recommended = true;
  else mangadex.recommended = true;

  return {
    title: query,
    mangapill,
    mangadex,
    optimalProvider,
    rationale,
  };
}

// ── Manual Scraper Action ────────────────────────────────────────────────────

export async function triggerManualScrape(title: string, provider: 'mangapill' | 'mangadex') {
  const isAuth = await checkAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized" };

  if (!title.trim()) return { success: false, error: "Title cannot be empty" };

  try {
    const supabase = getAdminSupabaseClient();
    const query = title.trim();
    let mangaSourceId = '';
    let mangaTitle = query;
    let chaptersFound: Array<{ sourceId: string; chapterNumber: number; title: string; sourceUrl: string }> = [];

    if (provider === 'mangapill') {
      const searchRes = await fetch(`https://mangapill.com/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://mangapill.com/'
        }
      });

      if (!searchRes.ok) throw new Error(`MangaPill Search HTTP ${searchRes.status}`);
      const html = await searchRes.text();
      const match = html.match(/href="\/manga\/(\d+\/[^"]+)"[^>]*>[\s\S]*?<div class="[^"]*font-bold[^"]*">([^<]+)<\/div>/i);

      if (!match) {
        throw new Error(`No manga found matching "${query}" on MangaPill`);
      }

      mangaSourceId = match[1];
      mangaTitle = match[2]?.trim() || query;

      const chRes = await fetch(`https://mangapill.com/manga/${mangaSourceId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://mangapill.com/'
        }
      });
      if (!chRes.ok) throw new Error(`MangaPill Chapter List HTTP ${chRes.status}`);
      const chHtml = await chRes.text();
      const chMatches = [...chHtml.matchAll(/href="\/chapters\/([^"]+)"[^>]*>([^<]+)</g)];

      chaptersFound = chMatches.map((m) => {
        const slug = m[1];
        const t = m[2]?.trim() || '';
        const numMatch = slug.match(/chapter-([\d.]+)/i);
        const num = numMatch ? parseFloat(numMatch[1]) : 0;
        return {
          sourceId: slug,
          chapterNumber: num,
          title: t,
          sourceUrl: `https://mangapill.com/chapters/${slug}`,
        };
      });
    } else {
      const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=1`);
      if (!searchRes.ok) throw new Error(`MangaDex Search HTTP ${searchRes.status}`);
      const searchData = await searchRes.json() as { data?: Array<any> };
      const item = searchData.data?.[0];

      if (!item) throw new Error(`No manga found matching "${query}" on MangaDex`);

      mangaSourceId = item.id;
      const tObj = item.attributes?.title || {};
      mangaTitle = tObj.en || Object.values(tObj)[0] || query;

      const chRes = await fetch(`https://api.mangadex.org/manga/${mangaSourceId}/feed?limit=500&translatedLanguage[]=en&order[chapter]=asc`);
      if (!chRes.ok) throw new Error(`MangaDex Feed HTTP ${chRes.status}`);
      const chData = await chRes.json() as { data?: Array<any> };

      chaptersFound = (chData.data || []).map((ch) => {
        const num = ch.attributes?.chapter ? parseFloat(ch.attributes.chapter) : 0;
        return {
          sourceId: ch.id,
          chapterNumber: num,
          title: ch.attributes?.title || `Chapter ${num}`,
          sourceUrl: `https://mangadex.org/chapter/${ch.id}`,
        };
      });
    }

    if (chaptersFound.length === 0) {
      return { success: false, error: `Found series "${mangaTitle}", but no English chapters were discovered.` };
    }

    const { data: mangaRow, error: mangaErr } = await supabase
      .from('manga')
      .upsert(
        {
          source_id: mangaSourceId,
          source_provider: provider,
          title: mangaTitle,
          status: 'ongoing',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'source_id' }
      )
      .select('id')
      .single();

    if (mangaErr) throw new Error(`Failed to save manga: ${mangaErr.message}`);

    let queuedCount = 0;
    for (const ch of chaptersFound) {
      const { data: inserted, error: chErr } = await supabase
        .from('chapters')
        .upsert(
          {
            manga_id: mangaRow.id,
            chapter_number: ch.chapterNumber,
            title: ch.title,
            source_url: ch.sourceUrl,
            job_status: 'QUEUED',
            content_freshness: 'fresh',
          },
          { onConflict: 'manga_id,chapter_number', ignoreDuplicates: true }
        )
        .select('id');

      if (!chErr && inserted && inserted.length > 0) queuedCount++;
    }

    return {
      success: true,
      mangaTitle,
      totalDiscovered: chaptersFound.length,
      newlyQueued: queuedCount,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to execute manual scrape." };
  }
}

// ── Mass / Batch Bulk Ingestion Pipeline ─────────────────────────────────────

export interface BatchItemResult {
  title: string;
  success: boolean;
  mangaTitle?: string;
  providerUsed?: 'mangapill' | 'mangadex';
  totalDiscovered?: number;
  newlyQueued?: number;
  rationale?: string;
  error?: string;
}

export async function triggerBatchScrape(
  rawInput: string | string[],
  providerMode: 'auto' | 'mangapill' | 'mangadex' = 'auto'
): Promise<{
  totalSubmitted: number;
  successCount: number;
  failedCount: number;
  totalChaptersQueued: number;
  results: BatchItemResult[];
}> {
  const isAuth = await checkAdminSession();
  if (!isAuth) throw new Error("Unauthorized admin access");

  // Parse multi-line / comma-separated titles (supports up to 100+ titles)
  const titles = Array.isArray(rawInput)
    ? rawInput.map((t) => t.trim()).filter((t) => t.length > 0)
    : rawInput
        .split(/[\n,;]+/)
        .map((t) => t.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter((t) => t.length > 0);

  const uniqueTitles = Array.from(new Set(titles)).slice(0, 150); // Cap at 150 for safety

  let successCount = 0;
  let failedCount = 0;
  let totalChaptersQueued = 0;
  const results: BatchItemResult[] = [];

  for (const rawTitle of uniqueTitles) {
    try {
      let chosenProvider: 'mangapill' | 'mangadex' = 'mangapill';
      let rationale = "";

      if (providerMode === 'auto') {
        const audit = await compareProviders(rawTitle);
        chosenProvider = audit.optimalProvider;
        rationale = audit.rationale;
      } else {
        chosenProvider = providerMode;
        rationale = `Forced provider selection: ${providerMode}`;
      }

      const res = await triggerManualScrape(rawTitle, chosenProvider);

      if (res.success) {
        successCount++;
        totalChaptersQueued += res.newlyQueued || 0;
        results.push({
          title: rawTitle,
          success: true,
          mangaTitle: res.mangaTitle,
          providerUsed: chosenProvider,
          totalDiscovered: res.totalDiscovered,
          newlyQueued: res.newlyQueued,
          rationale,
        });
      } else {
        // Fallback: If chosen provider failed in auto mode, try the secondary provider!
        if (providerMode === 'auto') {
          const secondaryProvider = chosenProvider === 'mangapill' ? 'mangadex' : 'mangapill';
          const secondaryRes = await triggerManualScrape(rawTitle, secondaryProvider);

          if (secondaryRes.success) {
            successCount++;
            totalChaptersQueued += secondaryRes.newlyQueued || 0;
            results.push({
              title: rawTitle,
              success: true,
              mangaTitle: secondaryRes.mangaTitle,
              providerUsed: secondaryProvider,
              totalDiscovered: secondaryRes.totalDiscovered,
              newlyQueued: secondaryRes.newlyQueued,
              rationale: `Fallback to ${secondaryProvider} succeeded after ${chosenProvider} failed.`,
            });
            continue;
          }
        }

        failedCount++;
        results.push({
          title: rawTitle,
          success: false,
          error: res.error || `Failed to scrape series from ${chosenProvider}`,
          providerUsed: chosenProvider,
          rationale,
        });
      }
    } catch (err: any) {
      failedCount++;
      results.push({
        title: rawTitle,
        success: false,
        error: err.message || "Unknown error during batch ingestion",
      });
    }
  }

  return {
    totalSubmitted: uniqueTitles.length,
    successCount,
    failedCount,
    totalChaptersQueued,
    results,
  };
}

export async function triggerAsyncBatchQueue(
  rawInput: string | string[],
  providerMode: 'auto' | 'mangapill' | 'mangadex' = 'auto'
): Promise<{
  success: boolean;
  totalSubmitted: number;
  message: string;
  titlesQueued: string[];
}> {
  const isAuth = await checkAdminSession();
  if (!isAuth) throw new Error("Unauthorized admin access");

  const titles = Array.isArray(rawInput)
    ? rawInput.map((t) => t.trim()).filter((t) => t.length > 0)
    : rawInput
        .split(/[\n,;]+/)
        .map((t) => t.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter((t) => t.length > 0);

  const uniqueTitles = Array.from(new Set(titles)).slice(0, 150);

  if (uniqueTitles.length === 0) {
    return {
      success: false,
      totalSubmitted: 0,
      message: "No valid manga titles provided.",
      titlesQueued: [],
    };
  }

  // Non-blocking background worker dispatch!
  (async () => {
    console.log(`[BACKGROUND BATCH QUEUE] Starting async processing for ${uniqueTitles.length} titles...`);
    for (const title of uniqueTitles) {
      try {
        let chosenProvider: 'mangapill' | 'mangadex' = 'mangapill';
        if (providerMode === 'auto') {
          const audit = await compareProviders(title);
          chosenProvider = audit.optimalProvider;
        } else {
          chosenProvider = providerMode;
        }

        const res = await triggerManualScrape(title, chosenProvider);
        if (!res.success && providerMode === 'auto') {
          const secondaryProvider = chosenProvider === 'mangapill' ? 'mangadex' : 'mangapill';
          await triggerManualScrape(title, secondaryProvider);
        }
      } catch (err: any) {
        console.error(`[BACKGROUND BATCH WORKER ERROR] Failed title "${title}":`, err.message);
      }
    }
    console.log(`[BACKGROUND BATCH QUEUE] Completed background ingestion loop.`);
  })();

  return {
    success: true,
    totalSubmitted: uniqueTitles.length,
    message: `Background Batch Dispatch Engine active: ${uniqueTitles.length} manga series have been queued for async ingestion into Supabase!`,
    titlesQueued: uniqueTitles,
  };
}


// ── DLQ & Maintenance Actions ────────────────────────────────────────────────

export async function retryDlqItem(dlqId: string, chapterId: string) {
  const isAuth = await checkAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized" };

  const supabase = getAdminSupabaseClient();

  await supabase
    .from('chapters')
    .update({ job_status: 'QUEUED', updated_at: new Date().toISOString() })
    .eq('id', chapterId);

  await supabase
    .from('dead_letter_queue')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', dlqId);

  return { success: true };
}

export async function bulkRetryFailed() {
  const isAuth = await checkAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized" };

  const supabase = getAdminSupabaseClient();

  const { count, error } = await supabase
    .from('chapters')
    .update({ job_status: 'QUEUED', updated_at: new Date().toISOString() })
    .eq('job_status', 'FAILED');

  if (error) return { success: false, error: error.message };

  return { success: true, retriedCount: count || 0 };
}

// ── Full Catalog Action ──────────────────────────────────────────────────────

export async function getAllMangaList(searchQuery?: string) {
  const isAuth = await checkAdminSession();
  if (!isAuth) throw new Error("Unauthorized admin access");

  const supabase = getAdminSupabaseClient();
  let queryBuilder = supabase
    .from('manga')
    .select('*, chapters(id, job_status)')
    .order('updated_at', { ascending: false });

  if (searchQuery && searchQuery.trim()) {
    queryBuilder = queryBuilder.ilike('title', `%${searchQuery.trim()}%`);
  }

  const { data: mangas, error } = await queryBuilder;
  if (error) throw new Error(error.message);

  return (mangas || []).map((m: any) => {
    const chapters = m.chapters || [];
    const totalChapters = chapters.length;
    const readyChapters = chapters.filter((c: any) => c.job_status === 'READY').length;
    const queuedChapters = chapters.filter((c: any) => c.job_status === 'QUEUED').length;
    const failedChapters = chapters.filter((c: any) => c.job_status === 'FAILED').length;

    return {
      id: m.id,
      source_id: m.source_id,
      source_provider: m.source_provider,
      title: m.title,
      description: m.description,
      cover_url: m.cover_url,
      status: m.status,
      view_count: m.view_count || 0,
      totalChapters,
      readyChapters,
      queuedChapters,
      failedChapters,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  });
}

export async function deleteMangaSeries(mangaId: string) {
  const isAuth = await checkAdminSession();
  if (!isAuth) return { success: false, error: "Unauthorized" };

  const supabase = getAdminSupabaseClient();

  const { error: chErr } = await supabase.from('chapters').delete().eq('manga_id', mangaId);
  if (chErr) return { success: false, error: chErr.message };

  const { error: mErr } = await supabase.from('manga').delete().eq('id', mangaId);
  if (mErr) return { success: false, error: mErr.message };

  return { success: true };
}

