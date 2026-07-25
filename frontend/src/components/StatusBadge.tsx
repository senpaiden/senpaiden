import type { ChapterStatus } from "@/lib/manga-data";

export function StatusBadge({ status }: { status: ChapterStatus }) {
  const map: Record<ChapterStatus, { label: string; cls: string }> = {
    ready: { label: "Ready", cls: "bg-[#22C55E]/15 text-[#4ade80] border-[#22C55E]/30" },
    processing: { label: "Processing", cls: "bg-[#F59E0B]/15 text-[#fbbf24] border-[#F59E0B]/30" },
    failed: { label: "Failed", cls: "bg-[#EF4444]/15 text-[#f87171] border-[#EF4444]/30" },
    retrying: { label: "Retrying", cls: "bg-[#8B5CF6]/15 text-[#a78bfa] border-[#8B5CF6]/30" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
