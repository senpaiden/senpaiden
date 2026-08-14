export default function Loading() {
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8" role="status" aria-label="Loading page">
    <div className="h-4 w-28 animate-pulse rounded bg-primary/30" />
    <div className="mt-4 h-10 w-64 max-w-full animate-pulse rounded-xl bg-white/10" />
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => <div key={index} className="aspect-[2/3] animate-pulse rounded-2xl border border-white/5 bg-white/[0.06]" />)}
    </div>
  </div>;
}
