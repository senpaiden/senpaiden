// ============================================================
// BaseAdapter.test.ts — Unit tests for throttle and rate-cap logic
// Tests the two hardest behaviors to get right: sequential pacing
// and the hard cut-off at MAX_REQUESTS_PER_RUN.
// Run with: npm test
// ============================================================

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Minimal concrete adapter that just records timestamps ─────────────────────
// We extend BaseAdapter with the minimal required overrides so we can call
// throttledFetch directly from tests.
class TestAdapter extends (await import('../BaseAdapter.js')).BaseAdapter {
  readonly providerName = 'test';
  callTimestamps: number[] = [];

  // We override throttledFetch to record the call time without actually
  // hitting the network. The real throttle/queue logic in BaseAdapter
  // still runs — we just mock the final fetch.
  async fetchLatestManga(_page: number) { return []; }
  async fetchChapterPages(_id: string) { return []; }
  async fetchChapterList(_id: string) { return []; }

  // Expose throttledFetch for testing
  async testFetch(url: string): Promise<Response> {
    return this.throttledFetch(url);
  }
}

// ── Mock global fetch ─────────────────────────────────────────────────────────
const mockFetch = jest.fn<() => Promise<Response>>().mockResolvedValue(
  new Response(null, { status: 200 })
);
global.fetch = mockFetch as unknown as typeof fetch;

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('BaseAdapter — throttle and rate-cap', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Reset env to known values before each test
    process.env.REQUEST_DELAY_MS = '50';   // Use 50ms for test speed
    process.env.MAX_REQUESTS_PER_RUN = '3'; // Low cap to test quickly
  });

  it('should enforce a minimum delay between consecutive requests', async () => {
    const adapter = new TestAdapter();
    const times: number[] = [];

    const p1 = adapter.testFetch('http://example.com/1').then(() => times.push(Date.now()));
    const p2 = adapter.testFetch('http://example.com/2').then(() => times.push(Date.now()));
    await Promise.all([p1, p2]);

    // The gap between the two resolved times should be ≥ REQUEST_DELAY_MS (50ms)
    const gap = times[1]! - times[0]!;
    expect(gap).toBeGreaterThanOrEqual(40); // Allow 10ms tolerance
  }, 3000);

  it('should throw once MAX_REQUESTS_PER_RUN is exceeded', async () => {
    const adapter = new TestAdapter();

    // These three succeed
    await adapter.testFetch('http://example.com/1');
    await adapter.testFetch('http://example.com/2');
    await adapter.testFetch('http://example.com/3');

    // The 4th should throw — cap is 3
    await expect(adapter.testFetch('http://example.com/4')).rejects.toThrow(
      /rate limit hit/i
    );
  }, 5000);

  it('should serialize requests (not run concurrently)', async () => {
    const adapter = new TestAdapter();
    const order: number[] = [];

    // Fire all three simultaneously
    const p1 = adapter.testFetch('http://example.com/1').then(() => order.push(1));
    const p2 = adapter.testFetch('http://example.com/2').then(() => order.push(2));
    const p3 = adapter.testFetch('http://example.com/3').then(() => order.push(3));
    await Promise.all([p1, p2, p3]);

    // Despite concurrent start, they must resolve in FIFO order
    expect(order).toEqual([1, 2, 3]);
  }, 5000);

  it('should call fetch with a User-Agent header', async () => {
    const adapter = new TestAdapter();
    await adapter.testFetch('http://example.com/1');

    const callArgs = mockFetch.mock.calls[0] as unknown[] | undefined;
    const options = callArgs?.[1] as RequestInit | undefined;
    const headers = options?.headers as Record<string, string> | undefined;

    expect(headers?.['User-Agent']).toBeTruthy();
    expect(headers?.['User-Agent']).toMatch(/Mozilla/);
  }, 3000);
});
