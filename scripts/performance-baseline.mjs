import { performance } from "node:perf_hooks";

const baseUrl = process.env.BASELINE_URL || "http://127.0.0.1:3000";
const paths = (process.env.BASELINE_PATHS || "/,/about,/discover,/search")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);
const sequentialRequests = Number(process.env.BASELINE_SEQUENTIAL_REQUESTS || 25);
const loadRequests = Number(process.env.BASELINE_LOAD_REQUESTS || 200);
const concurrencyLevels = (process.env.BASELINE_CONCURRENCY || "10,50")
  .split(",")
  .map(Number)
  .filter((value) => Number.isInteger(value) && value > 0);

function percentile(sorted, ratio) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function summarize(path, samples, statuses, bytes) {
  const sorted = samples.toSorted((a, b) => a - b);
  return {
    path,
    requests: samples.length,
    statuses,
    averageBytes: Math.round(bytes / samples.length),
    p50Ms: Number(percentile(sorted, 0.5).toFixed(1)),
    p95Ms: Number(percentile(sorted, 0.95).toFixed(1)),
    p99Ms: Number(percentile(sorted, 0.99).toFixed(1)),
    maxMs: Number(sorted.at(-1).toFixed(1)),
  };
}

async function timedRequest(path) {
  const startedAt = performance.now();
  const response = await fetch(new URL(path, baseUrl), {
    headers: { "user-agent": "senpai-den-baseline/1.0" },
  });
  const body = await response.arrayBuffer();
  return {
    duration: performance.now() - startedAt,
    status: response.status,
    bytes: body.byteLength,
  };
}

async function measureRoute(path) {
  const samples = [];
  const statuses = {};
  let bytes = 0;
  for (let index = 0; index < sequentialRequests; index += 1) {
    const result = await timedRequest(path);
    samples.push(result.duration);
    statuses[result.status] = (statuses[result.status] || 0) + 1;
    bytes += result.bytes;
  }
  return summarize(path, samples, statuses, bytes);
}

async function measureLoad(path, concurrency) {
  const samples = [];
  const statuses = {};
  let bytes = 0;
  let nextRequest = 0;
  const startedAt = performance.now();

  async function worker() {
    while (nextRequest < loadRequests) {
      nextRequest += 1;
      try {
        const result = await timedRequest(path);
        samples.push(result.duration);
        statuses[result.status] = (statuses[result.status] || 0) + 1;
        bytes += result.bytes;
      } catch {
        samples.push(0);
        statuses.networkError = (statuses.networkError || 0) + 1;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return {
    ...summarize(path, samples, statuses, bytes),
    concurrency,
    totalMs: Number((performance.now() - startedAt).toFixed(1)),
    requestsPerSecond: Number((loadRequests / ((performance.now() - startedAt) / 1000)).toFixed(1)),
  };
}

const routeResults = [];
for (const path of paths) routeResults.push(await measureRoute(path));

const loadResults = [];
for (const concurrency of concurrencyLevels) {
  loadResults.push(await measureLoad("/", concurrency));
}

console.log(JSON.stringify({
  measuredAt: new Date().toISOString(),
  baseUrl,
  note: "Local production-mode baseline; not an internet/CDN or 10,000-user capacity result.",
  routeResults,
  loadResults,
}, null, 2));
