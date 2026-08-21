const http = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== 1. Checking MangaDex API for Naruto Series ===');
  const searchUrl = 'https://api.mangadex.org/manga?title=Naruto&limit=10&contentRating[]=safe&contentRating[]=suggestive';
  const mdData = await fetchJson(searchUrl);
  
  if (mdData && mdData.data) {
    for (const m of mdData.data) {
      const id = m.id;
      const title = m.attributes.title.en || Object.values(m.attributes.title)[0];
      
      // Fetch chapter count for English on MangaDex
      const feedUrl = `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&limit=100`;
      const feedData = await fetchJson(feedUrl);
      const totalMdCh = feedData ? (feedData.total || 0) : 0;

      let internalCount = 0;
      let externalCount = 0;
      if (feedData && feedData.data) {
        feedData.data.forEach(ch => {
          if (ch.attributes.externalUrl) externalCount++;
          else internalCount++;
        });
      }

      console.log(`[MangaDex] Title: "${title}" (ID: ${id})`);
      console.log(`           Total EN Chapters on MangaDex: ${totalMdCh} (Sample Batch: ${internalCount} Scrapable / ${externalCount} MangaPlus External)`);
    }
  }

  console.log('\n=== 2. Checking MangaPill for Naruto Series ===');
  const htmlPill = await fetchText('https://mangapill.com/search?q=Naruto');
  const pillMatches = [...htmlPill.matchAll(/<a href="(\/manga\/[^"]+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*font-bold[^"]*"[^>]*>([^<]+)<\/div>/g)];
  for (const match of pillMatches) {
    const pillUrl = 'https://mangapill.com' + match[1];
    const pillTitle = match[2].trim();
    
    // Fetch chapter list for this manga on MangaPill
    const pillMangaHtml = await fetchText(pillUrl);
    const chMatches = [...pillMangaHtml.matchAll(/<a href="\/chapters\/[^"]+"[^>]*>([^<]+)<\/a>/g)];
    console.log(`[MangaPill] Title: "${pillTitle}" -> Total EN Chapters: ${chMatches.length} (${pillUrl})`);
  }

  console.log('\n=== 3. Checking Database (Supabase) for Naruto Series ===');
  const dbBaseUrl = 'https://lsdnqbfiytyonvmzurxj.supabase.co';
  const dbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZG5xYmZpeXR5b252bXp1cnhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg2NTMwNSwiZXhwIjoyMTAwNDQxMzA1fQ.hHV8Iq8mr7edka6SLSa1qRHq_AG6cf5C3tywKNaHfd8';
  
  const mangaRes = await fetchJson(`${dbBaseUrl}/rest/v1/manga?title=ilike.*Naruto*&select=id,title`, {
    headers: { 'apikey': dbKey, 'Authorization': 'Bearer ' + dbKey }
  });

  // Fetch db manga via raw request
  const req = require('https').get(`${dbBaseUrl}/rest/v1/manga?title=ilike.*Naruto*&select=id,title`, {
    headers: { 'apikey': dbKey, 'Authorization': 'Bearer ' + dbKey }
  }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', async () => {
      const dbMangas = JSON.parse(b);
      for (const m of dbMangas) {
        const cReq = require('https').get(`${dbBaseUrl}/rest/v1/chapters?manga_id=eq.${m.id}&select=job_status,source_url`, {
          headers: { 'apikey': dbKey, 'Authorization': 'Bearer ' + dbKey, 'Range': '0-5000' }
        }, cRes => {
          let cb = '';
          cRes.on('data', c => cb += c);
          cRes.on('end', () => {
            const chs = JSON.parse(cb);
            const ready = chs.filter(c => c.job_status === 'READY').length;
            const queued = chs.filter(c => c.job_status === 'QUEUED').length;
            const failed = chs.filter(c => c.job_status === 'FAILED').length;
            console.log(`[Database] Title: "${m.title}" -> Total DB Chapters: ${chs.length} (Ready: ${ready}, Queued: ${queued}, Failed: ${failed})`);
          });
        });
      }
    });
  });
}

run();
