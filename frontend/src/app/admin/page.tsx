import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { AlertTriangle, CheckCircle, RotateCcw, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

// Server Action to trigger a retry for a DLQ item
export async function retryDlqItem(formData: FormData) {
  "use server";
  
  const id = formData.get("id") as string;
  const chapterId = formData.get("chapterId") as string;
  if (!id || !chapterId) return;

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch current DLQ record
  const { data: dlqItem } = await supabase
    .from('dead_letter_queue')
    .select('retry_count, max_retries')
    .eq('id', id)
    .single();

  const attempts = (dlqItem?.retry_count || 0) + 1;
  const maxRetries = dlqItem?.max_retries || 3;

  if (attempts > maxRetries) {
    // Mark permanently unresolved / abandoned
    await supabase
      .from('dead_letter_queue')
      .update({ error_detail: `Exceeded max retries (${maxRetries}). Abandoned.` })
      .eq('id', id);
    revalidatePath("/admin");
    return;
  }

  // 2. Mark chapter back to QUEUED
  await supabase
    .from('chapters')
    .update({ job_status: 'QUEUED', updated_at: new Date().toISOString() })
    .eq('id', chapterId);

  // 3. Increment retry counter & mark resolved
  await supabase
    .from('dead_letter_queue')
    .update({ retry_count: attempts, resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath("/admin");
}

export default async function AdminDashboard() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-panel p-8 rounded-2xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Admin Configuration Missing</h2>
          <p className="text-muted-foreground text-sm">
            Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment variables to access the DLQ.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch Unresolved DLQ Items
  const { data: dlqItems } = await supabase
    .from('dead_letter_queue')
    .select('*, chapters(title, manga(title))')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  // Fetch System Stats
  const { count: queuedCount } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('job_status', 'QUEUED');

  const { count: failedCount } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('job_status', 'FAILED');

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12 md:px-8 space-y-12">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Admin Control Center</h1>
        <p className="text-muted-foreground">Monitor system health and manage the Dead Letter Queue.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-blue-500">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><RotateCcw className="w-6 h-6 animate-spin-slow" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Currently Queued</p>
            <p className="text-3xl font-bold font-display">{queuedCount || 0}</p>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-destructive">
          <div className="p-3 bg-destructive/10 rounded-xl text-destructive"><XCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Failed Chapters</p>
            <p className="text-3xl font-bold font-display">{failedCount || 0}</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-yellow-500">
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Unresolved DLQ</p>
            <p className="text-3xl font-bold font-display">{dlqItems?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* DLQ Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/5 bg-card/40">
          <h2 className="font-display text-xl font-semibold">Dead Letter Queue (Action Required)</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-card/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium">Error Type</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Retries</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {dlqItems?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                    System is healthy. No unresolved items in DLQ.
                  </td>
                </tr>
              ) : (
                dlqItems?.map((item: any) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{item.chapters?.manga?.title || 'Unknown Manga'}</div>
                      <div className="text-xs text-muted-foreground mt-1">Ch: {item.chapters?.title || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/20 text-destructive border border-destructive/30 uppercase tracking-wider">
                        {item.error_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={item.error_detail}>
                      {item.error_detail}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {item.retry_count} / {item.max_retries}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={retryDlqItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="chapterId" value={item.chapter_id} />
                        <button 
                          type="submit"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Force Retry
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
