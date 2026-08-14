"use client";

import { useState } from "react";
import {
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowRight,
  Terminal,
  ShieldCheck,
  Flame,
  FileText,
  HelpCircle,
  Loader2,
  Clock
} from "lucide-react";
import { triggerBatchScrape, triggerAsyncBatchQueue, compareProviders, ProviderAuditResult, BatchItemResult } from "@/app/actions";

interface BatchIngestionControlProps {
  onRefreshMetrics: () => void;
}

export function BatchIngestionControl({ onRefreshMetrics }: BatchIngestionControlProps) {
  const [rawTitles, setRawTitles] = useState("");
  const [providerMode, setProviderMode] = useState<'auto' | 'mangapill' | 'mangadex'>('auto');
  const [executionMode, setExecutionMode] = useState<'background' | 'live'>('background');

  // Background Async Dispatch State
  const [asyncNotice, setAsyncNotice] = useState<{
    totalSubmitted: number;
    message: string;
    titlesQueued: string[];
  } | null>(null);

  // Live Inspector State
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [currentProcessingTitle, setCurrentProcessingTitle] = useState("");
  const [realtimeResults, setRealtimeResults] = useState<BatchItemResult[]>([]);
  const [batchReport, setBatchReport] = useState<{
    totalSubmitted: number;
    successCount: number;
    failedCount: number;
    totalChaptersQueued: number;
    results: BatchItemResult[];
  } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Provider Single-Series Inspection State
  const [inspectTitle, setInspectTitle] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [auditData, setAuditData] = useState<{
    title: string;
    mangapill: ProviderAuditResult;
    mangadex: ProviderAuditResult;
    optimalProvider: 'mangapill' | 'mangadex';
    rationale: string;
  } | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Parsed titles count
  const parsedList = rawTitles
    .split(/[\n,;]+/)
    .map((t) => t.trim().replace(/^[-*•\d.]+\s*/, ''))
    .filter((t) => t.length > 0);
  const uniqueTitles = Array.from(new Set(parsedList)).slice(0, 150);
  const titleCount = uniqueTitles.length;

  // Preset Loaders
  const loadPresetList = (presetType: 'top10' | 'top25' | 'top50') => {
    const top10 = [
      "One Piece",
      "Wind Breaker",
      "Solo Leveling",
      "Jujutsu Kaisen",
      "Chainsaw Man",
      "Demon Slayer",
      "My Hero Academia",
      "Tokyo Ghoul",
      "Attack on Titan",
      "Bleach"
    ];

    const top25 = [
      ...top10,
      "Naruto",
      "Dragon Ball Super",
      "Hunter x Hunter",
      "Berserk",
      "Vagabond",
      "Kingdom",
      "Vinland Saga",
      "Blue Lock",
      "Spy x Family",
      "Kaiju No. 8",
      "Tower of God",
      "Black Clover",
      "Fairy Tail",
      "Fire Force",
      "One Punch Man"
    ];

    const top50 = [
      ...top25,
      "20th Century Boys",
      "Monster",
      "Akira",
      "Slam Dunk",
      "Haikyuu",
      "Fullmetal Alchemist",
      "JoJo's Bizarre Adventure",
      "Death Note",
      "Gintama",
      "D.Gray-man",
      "Soul Eater",
      "Dr. Stone",
      "Mob Psycho 100",
      "Mashle",
      "Dandadan",
      "Undead Unluck",
      "Sakamoto Days",
      "Shangri-La Frontier",
      "Hell's Paradise",
      "The Beginning After The End",
      "Omniscient Reader's Viewpoint",
      "Overlord",
      "The Eminence in Shadow",
      "Tensei Shitara Slime Datta Ken",
      "Mushoku Tensei"
    ];

    if (presetType === 'top10') setRawTitles(top10.join("\n"));
    if (presetType === 'top25') setRawTitles(top25.join("\n"));
    if (presetType === 'top50') setRawTitles(top50.join("\n"));
  };

  const handleStartBatch = async () => {
    if (titleCount === 0) return;

    setIsProcessingBatch(true);
    setBatchError(null);
    setBatchReport(null);
    setAsyncNotice(null);

    if (executionMode === 'background') {
      try {
        const res = await triggerAsyncBatchQueue(uniqueTitles, providerMode);
        if (res.success) {
          setAsyncNotice({
            totalSubmitted: res.totalSubmitted,
            message: res.message,
            titlesQueued: res.titlesQueued,
          });
          onRefreshMetrics();
        } else {
          setBatchError(res.message || "Failed to trigger background queue.");
        }
      } catch (err: any) {
        setBatchError(err.message || "Failed to dispatch async batch.");
      } finally {
        setIsProcessingBatch(false);
      }
    } else {
      setRealtimeResults([]);
      let successCount = 0;
      let failedCount = 0;
      let totalChaptersQueued = 0;
      const accumulatedResults: BatchItemResult[] = [];

      for (let i = 0; i < uniqueTitles.length; i++) {
        const title = uniqueTitles[i];
        setCurrentProcessingIndex(i + 1);
        setCurrentProcessingTitle(title);

        try {
          const singleRes = await triggerBatchScrape([title], providerMode);
          const itemResult = singleRes.results[0] || {
            title,
            mangaTitle: title,
            success: false,
            error: "No result returned for series",
          };

          if (itemResult.success) {
            successCount++;
            totalChaptersQueued += itemResult.newlyQueued || 0;
          } else {
            failedCount++;
          }

          accumulatedResults.push(itemResult);
          setRealtimeResults([...accumulatedResults]);
        } catch (err: any) {
          failedCount++;
          accumulatedResults.push({
            title,
            mangaTitle: title,
            success: false,
            error: err.message || "Failed to process series in batch",
          });
          setRealtimeResults([...accumulatedResults]);
        }
      }

      setBatchReport({
        totalSubmitted: uniqueTitles.length,
        successCount,
        failedCount,
        totalChaptersQueued,
        results: accumulatedResults,
      });

      setIsProcessingBatch(false);
      onRefreshMetrics();
    }
  };

  const handleCompareProviders = async () => {
    if (!inspectTitle.trim()) return;

    setIsInspecting(true);
    setInspectError(null);
    setAuditData(null);

    try {
      const data = await compareProviders(inspectTitle);
      setAuditData(data);
    } catch (err: any) {
      setInspectError(err.message || "Failed to inspect providers.");
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Section 1: Mass Ingestion Pipeline Engine */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-8 border border-[#E5E0D8] relative overflow-hidden bg-white shadow-md">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm shrink-0">
              <Layers className="w-7 h-7 text-red-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-zinc-900 font-sans tracking-tight">
                  Mass Batch Ingestion Engine (100+ Series)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 uppercase tracking-wider">
                  Async Background Engine
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Paste up to 150 manga titles to immediately queue them into Supabase background workers for non-blocking processing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-zinc-700 text-xs font-mono">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>Parsed: <strong className="text-zinc-900 font-bold">{titleCount}</strong> Titles</span>
          </div>
        </div>

        {/* Quick Batch Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 font-mono font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-red-600" />
              Quick Batch Presets:
            </span>
            <span className="text-[11px] font-mono text-zinc-500">1-Click load popular manga lists</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadPresetList('top10')}
              disabled={isProcessingBatch}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-[#F3EFE6] border border-[#E5E0D8] text-xs font-mono font-semibold text-zinc-800 transition-all cursor-pointer hover:border-red-400 disabled:opacity-50 shadow-sm"
            >
              + Load Top 10 Shonen
            </button>
            <button
              onClick={() => loadPresetList('top25')}
              disabled={isProcessingBatch}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-[#F3EFE6] border border-[#E5E0D8] text-xs font-mono font-semibold text-zinc-800 transition-all cursor-pointer hover:border-red-400 disabled:opacity-50 shadow-sm"
            >
              + Load Top 25 Catalog
            </button>
            <button
              onClick={() => loadPresetList('top50')}
              disabled={isProcessingBatch}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-[#F3EFE6] border border-[#E5E0D8] text-xs font-mono font-semibold text-zinc-800 transition-all cursor-pointer hover:border-red-400 disabled:opacity-50 shadow-sm"
            >
              + Load Top 50 Action & Fantasy
            </button>
          </div>
        </div>

        {/* Execution Mode Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <span className="text-zinc-800 font-bold">Execution Dispatch Mode:</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="execMode"
                checked={executionMode === 'background'}
                onChange={() => setExecutionMode('background')}
                className="accent-red-600"
              />
              <span className={executionMode === 'background' ? 'text-red-700 font-bold' : 'text-zinc-600'}>
                ⚡ Instant Async Background Queue (Recommended)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="execMode"
                checked={executionMode === 'live'}
                onChange={() => setExecutionMode('live')}
                className="accent-red-600"
              />
              <span className={executionMode === 'live' ? 'text-red-700 font-bold' : 'text-zinc-600'}>
                🔍 Live Inspector Mode
              </span>
            </label>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-600 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              <span>Multi-Line Titles Input (One title per line or comma-separated)</span>
            </label>
            <textarea
              value={rawTitles}
              onChange={(e) => setRawTitles(e.target.value)}
              rows={8}
              disabled={isProcessingBatch}
              placeholder={`One Piece\nWind Breaker\nSolo Leveling\nJujutsu Kaisen\nChainsaw Man\nAttack on Titan...`}
              className="w-full p-4 rounded-2xl glass-input text-xs font-mono leading-relaxed border-[#E5E0D8] bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 disabled:opacity-50 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-mono text-zinc-600 uppercase tracking-wider block">
                Provider Selection & Health Strategy
              </label>
              <select
                value={providerMode}
                onChange={(e) => setProviderMode(e.target.value as any)}
                disabled={isProcessingBatch}
                className="w-full py-3.5 px-4 rounded-2xl glass-input text-xs font-mono font-semibold cursor-pointer border border-[#E5E0D8] bg-white text-zinc-900 disabled:opacity-50 shadow-sm"
              >
                <option value="auto" className="bg-white text-zinc-900">⚡ Auto-Select Healthiest Provider (Smart Gap & Chapter Completeness Audit)</option>
                <option value="mangapill" className="bg-white text-zinc-900">Force MangaPill Scraper Only</option>
                <option value="mangadex" className="bg-white text-zinc-900">Force MangaDex Official API Only</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleStartBatch}
                disabled={isProcessingBatch || titleCount === 0}
                className="w-full py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 font-sans"
              >
                {isProcessingBatch ? (
                  <span className="flex items-center gap-2 font-mono">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    DISPATCHING QUEUE ({titleCount})...
                  </span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>{executionMode === 'background' ? 'Queue Background Batch' : 'Execute Live Inspection'} ({titleCount})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instant Async Background Queue Confirmation */}
        {asyncNotice && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 font-mono">
            <div className="flex items-center gap-3 border-b border-emerald-200 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-zinc-900 font-sans">
                  ⚡ Instant Async Background Dispatch Activated!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">{asyncNotice.message}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-900 uppercase font-sans">Queued Series List ({asyncNotice.titlesQueued.length}):</span>
              <div className="max-h-44 overflow-y-auto rounded-xl bg-white p-3 border border-emerald-200 flex flex-wrap gap-2 text-xs">
                {asyncNotice.titlesQueued.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Streaming Progress Bar (Live Mode) */}
        {executionMode === 'live' && isProcessingBatch && (
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-red-200 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                <span className="text-zinc-900 font-bold font-sans">Processing Series [{currentProcessingIndex} / {titleCount}]:</span>
                <span className="text-red-700 font-bold">{currentProcessingTitle}</span>
              </div>
              <span className="text-zinc-600 font-bold">
                {Math.round((currentProcessingIndex / titleCount) * 100)}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden border border-zinc-300">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                style={{ width: `${(currentProcessingIndex / titleCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {batchError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{batchError}</span>
          </div>
        )}

        {/* Live Realtime Results List During Batch Processing (Live Mode) */}
        {executionMode === 'live' && realtimeResults.length > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] space-y-6 font-mono shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
              <div className="flex items-center gap-2.5 font-extrabold text-base font-sans text-red-700">
                <CheckCircle2 className="w-6 h-6 text-red-600" />
                <span>{isProcessingBatch ? "Batch Queue Processing in Progress..." : "Mass Batch Queue Completed!"}</span>
              </div>
              <span className="text-xs text-zinc-600 font-mono">
                Processed <strong className="text-zinc-900">{realtimeResults.length} / {titleCount}</strong> Series Titles
              </span>
            </div>

            {/* Detailed Batch Audit Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 font-sans uppercase tracking-wider">Live Series Ingestion Telemetry:</h4>
              <div className="max-h-80 overflow-y-auto rounded-xl border border-[#E5E0D8] divide-y divide-[#E5E0D8] bg-[#FAF8F5]">
                {realtimeResults.map((res: any, idx: number) => (
                  <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${res.success ? "bg-emerald-500" : "bg-red-500"}`} />
                        <strong className="text-zinc-900 font-sans text-sm">{res.mangaTitle || res.title}</strong>
                        {res.providerUsed && (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-red-100 border border-red-200 text-red-700 font-mono">
                            {res.providerUsed}
                          </span>
                        )}
                      </div>
                      {res.rationale && (
                        <p className="text-[11px] text-zinc-600 font-mono pl-4">{res.rationale}</p>
                      )}
                      {res.error && (
                        <p className="text-[11px] text-red-700 font-mono pl-4">{res.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      {res.success ? (
                        <div className="text-xs font-mono">
                          <span className="text-zinc-500 block text-[10px]">Discovered / Queued</span>
                          <span className="text-zinc-900 font-bold">{res.totalDiscovered} ch / <strong className="text-emerald-600">{res.newlyQueued} new</strong></span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded bg-red-100 text-red-700 text-[10px] font-mono border border-red-200">
                          FAILED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Provider Health & Chapter Completeness Auditor */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 border border-[#E5E0D8] bg-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <ShieldCheck className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 font-sans">
                Provider Chapter Health & Combined Chapter Auditor
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                Compare MangaPill vs MangaDex for any manga title to detect chapter gaps, omnibus combined chapters, and provider completeness
              </p>
            </div>
          </div>
          <HelpCircle className="w-5 h-5 text-zinc-400 hidden sm:block" />
        </div>

        {/* Audit Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inspectTitle}
              onChange={(e) => setInspectTitle(e.target.value)}
              placeholder="Enter series title to audit (e.g. One Piece, Wind Breaker)..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs font-mono bg-white border-[#E5E0D8] text-zinc-900 shadow-sm"
            />
          </div>

          <button
            onClick={handleCompareProviders}
            disabled={isInspecting || !inspectTitle.trim()}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-[#F3EFE6] border border-[#E5E0D8] text-zinc-800 text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            {isInspecting ? (
              <Terminal className="w-4 h-4 animate-spin text-red-600" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>Audit Providers</span>
              </>
            )}
          </button>
        </div>

        {inspectError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
            {inspectError}
          </div>
        )}

        {/* Side-by-Side Audit Breakdown Cards */}
        {auditData && (
          <div className="space-y-6 pt-2">
            {/* System Recommendation Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-mono space-y-1.5">
              <div className="flex items-center gap-2 font-sans font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Optimal Strategy: Recommended Provider — {auditData.optimalProvider.toUpperCase()}</span>
              </div>
              <p className="text-emerald-900 leading-relaxed">{auditData.rationale}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
              {/* MangaPill Audit Card */}
              <div className={`p-5 rounded-2xl border space-y-4 bg-[#FAF8F5] ${auditData.mangapill.recommended ? "border-red-400 shadow-sm" : "border-[#E5E0D8]"}`}>
                <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 font-sans">MangaPill Scraper</span>
                    {auditData.mangapill.recommended && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white uppercase">OPTIMAL</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600">{auditData.mangapill.totalChapters} Chapters</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Chapter Gaps:</span>
                    <span className={auditData.mangapill.hasGaps ? "text-red-700 font-bold" : "text-zinc-800"}>
                      {auditData.mangapill.gapDetails}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Combined Chapters:</span>
                    <span className={auditData.mangapill.hasCombinedChapters ? "text-red-700 font-bold" : "text-zinc-800"}>
                      {auditData.mangapill.hasCombinedChapters ? `Detected (${auditData.mangapill.combinedChapterDetails.length})` : "None (Discrete)"}
                    </span>
                  </div>

                  {auditData.mangapill.error && (
                    <div className="text-red-700 text-[11px] pt-1">Error: {auditData.mangapill.error}</div>
                  )}
                </div>
              </div>

              {/* MangaDex Audit Card */}
              <div className={`p-5 rounded-2xl border space-y-4 bg-[#FAF8F5] ${auditData.mangadex.recommended ? "border-red-400 shadow-sm" : "border-[#E5E0D8]"}`}>
                <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 font-sans">MangaDex Official API</span>
                    {auditData.mangadex.recommended && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white uppercase">OPTIMAL</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600">{auditData.mangadex.totalChapters} Chapters</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Chapter Gaps:</span>
                    <span className={auditData.mangadex.hasGaps ? "text-red-700 font-bold" : "text-zinc-800"}>
                      {auditData.mangadex.gapDetails}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Combined Chapters:</span>
                    <span className={auditData.mangadex.hasCombinedChapters ? "text-red-700 font-bold" : "text-zinc-800"}>
                      {auditData.mangadex.hasCombinedChapters ? `Detected (${auditData.mangadex.combinedChapterDetails.length})` : "None (Discrete)"}
                    </span>
                  </div>

                  {auditData.mangadex.error && (
                    <div className="text-red-700 text-[11px] pt-1">Error: {auditData.mangadex.error}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
