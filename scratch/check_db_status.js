const http = require('https');

const DB_BASE_URL = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
const DB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(DB_BASE_URL + path, {
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); }
        catch (e) { resolve(b); }
      });
    }).on('error', reject);
  });
}

function requestCount(path) {
  return new Promise((resolve, reject) => {
    const u = new URL(DB_BASE_URL + path);
    const req = http.request(u, {
      method: 'GET',
      headers: {
        'apikey': DB_KEY,
        'Authorization': 'Bearer ' + DB_KEY,
        'Prefer': 'count=exact',
        'Range-Unit': 'items',
        'Range': '0-0'
      }
    }, res => {
      const cr = res.headers['content-range'];
      if (cr) {
        const count = parseInt(cr.split('/')[1], 10);
        resolve(isNaN(count) ? 0 : count);
      } else {
        resolve(0);
      }
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== SENPAI DEN REAL-TIME WORKER & DATABASE STATUS ===\n');

  const [queued, processing, completed, failed] = await Promise.all([
    requestCount('/rest/v1/chapters?job_status=eq.QUEUED&select=id'),
    requestCount('/rest/v1/chapters?job_status=eq.PROCESSING&select=id'),
    requestCount('/rest/v1/chapters?job_status=eq.COMPLETED&select=id'),
    requestCount('/rest/v1/chapters?job_status=eq.FAILED&select=id')
  ]);

  const total = queued + processing + completed + failed;

  console.log('📊 DATABASE OVERALL TOTALS:');
  console.log(`✅ COMPLETED:  ${completed} chapters`);
  console.log(`⚡ PROCESSING: ${processing} chapters`);
  console.log(`⏳ QUEUED:     ${queued} chapters`);
  console.log(`⚠️  FAILED:     ${failed} chapters`);
  console.log(`📚 TOTAL:      ${total} chapters\n`);

  const naruto = await request('/rest/v1/manga?title=eq.Naruto&select=id');
  if (naruto && naruto.length > 0) {
    const mangaId = naruto[0].id;
    const [nQ, nP, nC, nF] = await Promise.all([
      requestCount(`/rest/v1/chapters?manga_id=eq.${mangaId}&job_status=eq.QUEUED&select=id`),
      requestCount(`/rest/v1/chapters?manga_id=eq.${mangaId}&job_status=eq.PROCESSING&select=id`),
      requestCount(`/rest/v1/chapters?manga_id=eq.${mangaId}&job_status=eq.COMPLETED&select=id`),
      requestCount(`/rest/v1/chapters?manga_id=eq.${mangaId}&job_status=eq.FAILED&select=id`)
    ]);

    console.log('🍥 NARUTO CHAPTERS STATUS:');
    console.log(`   - COMPLETED:  ${nC} chapters`);
    console.log(`   - PROCESSING: ${nP} chapters`);
    console.log(`   - QUEUED:     ${nQ} chapters`);
    console.log(`   - FAILED:     ${nF} chapters`);
    console.log(`   - TOTAL:      ${nC + nP + nQ + nF} chapters`);
  }
}

run();
