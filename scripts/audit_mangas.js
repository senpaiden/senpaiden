const fs = require('fs');
const path = require('path');

const titles = [
  "One Piece", "Naruto", "Attack on Titan", "Dragon Ball", "Bleach", "Death Note", "Fullmetal Alchemist", 
  "Demon Slayer", "Jujutsu Kaisen", "My Hero Academia", "Berserk", "Vinland Saga", "Tokyo Ghoul", 
  "Hunter x Hunter", "One Punch Man", "Chainsaw Man", "Slam Dunk", "Vagabond", "Monster", "Vagrant Queen", 
  "Spy x Family", "Haikyuu!!", "Fairy Tail", "Black Clover", "Fire Force", "Dr. Stone", "The Promised Neverland", 
  "Mob Psycho 100", "Kingdom", "Blue Lock", "Rurouni Kenshin", "Yu Yu Hakusho", "Inuyasha", "D.Gray-man", 
  "Blue Exorcist", "Assassination Classroom", "The Seven Deadly Sins", "Beastars", "Golden Kamuy", 
  "20th Century Boys", "Akira", "Gantz", "Parasyte", "Vinland Saga: Book of Vinland", "Grand Blue", 
  "Made in Abyss", "The Fable", "Oyasumi Punpun", "Kaiju No. 8", "Solo Leveling", "Tower of God", 
  "The God of High School", "Noblesse", "The Beginning After the End", "Omniscient Reader's Viewpoint", 
  "Nano Machine", "The Boxer", "Lookism", "True Beauty", "Sweet Home", "Hardcore Leveling Warrior", 
  "SSS-Class Suicide Hunter", "Return of the Mount Hua Sect", "Reawakening of the Stone Genius", 
  "The Legendary Moonlight Sculptor", "Weak Hero", "Wind Breaker", "Eleceed", "Bastard", "Days of Hana", 
  "The Remarried Empress", "Who Made Me a Princess", "Villains Are Destined to Die", "Second Life Ranker", 
  "A Returner's Magic Should Be Special", "Level Up With the Gods", "Jinx", "Painter of the Night", 
  "Battle Through the Heavens", "The King's Avatar", "Soul Land (Douluo Dalu)", "Tales of Demons and Gods", 
  "Martial Peak", "The Great Ruler", "Apotheosis", "Against the Gods", "Coiling Dragon", 
  "The Legend of the Northern Blade", "Renegade Immortal", "I Alone Level Grinding", "The Book Eating Magician", 
  "Doupo Cangqiong", "Full-Time Magister", "Spirit Sword Sovereign", "Skeleton Soldier Couldn't Protect the Dungeon", 
  "Trash of the Count's Family", "Volcanic Age", "Berserk of Gluttony", "Under the Oak Tree", "Sadan's Circle"
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const results = [];
  console.log(`Starting audit of ${titles.length} mangas...`);

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    try {
      console.log(`[${i+1}/${titles.length}] Searching for "${title}"...`);
      const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=10&order[followedCount]=desc`);
      
      if (!searchRes.ok) {
        console.warn(`  ! Failed search response for ${title}`);
        results.push({ title, available: false, chapters: 0, languages: [] });
        await sleep(400); // rate limit
        continue;
      }
      
      const searchData = await searchRes.json();
      if (!searchData.data || searchData.data.length === 0) {
        results.push({ title, available: false, chapters: 0, languages: [] });
        await sleep(400);
        continue;
      }

      // Find the exact title match to avoid grabbing spin-offs (e.g. Boruto instead of Naruto)
      let targetManga = searchData.data[0];
      for (const manga of searchData.data) {
        const titleValues = Object.values(manga.attributes.title || {}).map(t => typeof t === 'string' ? t.toLowerCase() : '');
        const altTitles = (manga.attributes.altTitles || []).map(at => {
          const val = Object.values(at)[0];
          return typeof val === 'string' ? val.toLowerCase() : '';
        });
        
        if (titleValues.includes(title.toLowerCase()) || altTitles.includes(title.toLowerCase())) {
          targetManga = manga;
          break; // Found exact match
        }
      }

      const mangaId = targetManga.id;
      const mangaLangs = targetManga.attributes.availableTranslatedLanguages || [];
      
      // We use the feed endpoint to get the absolute highest chapter number available, 
      // which includes external links that the aggregate endpoint sometimes misses.
      const feedRes = await fetch(`https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&limit=1&order[chapter]=desc`);
      if (!feedRes.ok) {
        results.push({ title, available: true, chapters: 0, languages: mangaLangs.filter(Boolean) });
        await sleep(400);
        continue;
      }

      const feedData = await feedRes.json();
      let totalChapters = 0;
      if (feedData.data && feedData.data.length > 0) {
        const highestChapter = feedData.data[0].attributes.chapter;
        if (highestChapter) {
          totalChapters = parseFloat(highestChapter) || 0;
        }
      }

      results.push({ 
        title, 
        available: true, 
        chapters: totalChapters, 
        languages: mangaLangs.filter(Boolean) 
      });

    } catch (e) {
      console.error(`  ! Error processing ${title}:`, e);
      results.push({ title, available: false, chapters: 0, languages: [] });
    }
    
    await sleep(300);
  }

  // Generate Markdown
  let md = `# Manga Availability Audit\n\n`;
  md += `| Title | Available | Total Chapters (approx) | Languages (MangaDex Codes) |\n`;
  md += `|---|---|---|---|\n`;

  results.forEach(r => {
    const avail = r.available ? '✅ Yes' : '❌ No';
    const langs = r.languages.length > 0 ? r.languages.join(', ') : '-';
    md += `| ${r.title} | ${avail} | ${r.chapters} | ${langs} |\n`;
  });

  const mdPath = path.join(__dirname, 'manga_audit_results.md');
  fs.writeFileSync(mdPath, md);
  console.log(`\nDone! Results saved to ${mdPath}`);
}

run();
