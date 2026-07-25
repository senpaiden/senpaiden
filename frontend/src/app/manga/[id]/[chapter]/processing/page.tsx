"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProcessingPage({ params }: { params: Promise<{ id: string, chapter: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [chapterId, setChapterId] = useState<string | null>(null);
  
  // 1. Fetch chapter ID on mount (since this is a client component, we do a quick fetch)
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${apiUrl}/api/manga/${resolvedParams.id}`)
      .then(res => res.json())
      .then(manga => {
        const c = manga.chapters?.find((ch: { chapter_number: number; id: string }) => ch.chapter_number.toString() === resolvedParams.chapter);
        if (c) setChapterId(c.id);
      })
      .catch(() => {});
  }, [resolvedParams.id, resolvedParams.chapter]);

  // 2. Poll the status endpoint every 5 seconds
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  const { data: statusData, error } = useSWR(
    chapterId ? `${apiUrl}/api/chapter/${chapterId}/status` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  // 3. Handle state transitions
  useEffect(() => {
    if (statusData?.job_status === 'READY') {
      router.push(`/manga/${resolvedParams.id}/${resolvedParams.chapter}`);
    }
  }, [statusData, router, resolvedParams.id, resolvedParams.chapter]);

  const isFailed = statusData?.job_status === 'FAILED' || error;
  const elapsed = statusData?.elapsed_seconds || 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={cn(
        "glass-panel max-w-md w-full p-8 rounded-3xl text-center space-y-6 transition-all duration-500 relative overflow-hidden",
        isFailed ? "border-destructive/30 shadow-destructive/20 shadow-2xl" : "border-primary/30 shadow-primary/20 shadow-2xl"
      )}>
        
        {/* Animated background glow */}
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[80px] rounded-full pointer-events-none opacity-20",
          isFailed ? "bg-destructive" : "bg-primary animate-pulse"
        )} />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {isFailed ? (
            <AlertTriangle className="w-16 h-16 text-destructive animate-in zoom-in duration-500" />
          ) : (
            <div className="relative flex items-center justify-center w-16 h-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin absolute" />
              <div className="w-8 h-8 rounded-full bg-primary/20 animate-ping absolute" />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {isFailed ? "Processing Failed" : "Optimizing Images"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isFailed 
                ? "The image processor encountered an error or timed out while formatting this chapter. It has been logged for review."
                : "The Hugging Face worker is currently slicing and converting this chapter to WebP to ensure your browser doesn't crash."}
            </p>
          </div>

          {!isFailed && elapsed > 0 && (
            <div className="text-xs font-mono text-muted-foreground/50">
              Elapsed: {elapsed}s
            </div>
          )}

          <Link 
            href={`/manga/${resolvedParams.id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium w-full mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Manga Details
          </Link>
        </div>
      </div>
    </div>
  );
}
