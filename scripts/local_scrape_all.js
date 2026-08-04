const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'mangas');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 100 Manga titles list
const titles = [
  "One Piece", "Naruto", "Attack on Titan", "Dragon Ball", "Bleach",
  "Death Note", "Fullmetal Alchemist", "Demon Slayer", "Jujutsu Kaisen", "My Hero Academia",
  "Berserk", "Vinland Saga", "Tokyo Ghoul", "Hunter x Hunter", "One Punch Man",
  "Chainsaw Man", "Slam Dunk", "Vagabond", "Monster", "Vagrant Queen",
  "Spy x Family", "Haikyuu!!", "Fairy Tail", "Black Clover", "Fire Force",
  "Dr. Stone", "The Promised Neverland", "Mob Psycho 100", "Kingdom", "Blue Lock",
  "Boruto", "JoJo's Bizarre Adventure", "Yu Yu Hakusho", "Inuyasha", "Rurouni Kenshin",
  "Soul Eater", "The Seven Deadly Sins", "Beastars", "Golden Kamuy", "20th Century Boys",
  "Akira", "Gantz", "Parasyte", "Vinland Saga: Book of Vinland", "Grand Blue",
  "Made in Abyss", "The Fable", "Oyasumi Punpun", "Kaiju No. 8", "Solo Leveling",
  "Tower of God", "The God of High School", "Noblesse", "The Beginning After the End", "Omniscient Reader's Viewpoint",
  "Nano Machine", "The Boxer", "Lookism", "True Beauty", "Sweet Home",
  "Hardcore Leveling Warrior", "SSS-Class Suicide Hunter", "Wind Breaker", "Gosu", "Bastard",
  "Overgeared", "Mercenary Enrollment", "Tomb Raider King", "Weak Hero", "Eleceed",
  "Days of Hana", "Who Made Me a Princess", "Villains Are Destined to Die", "Remarried Empress", "Lore Olympus",
  "Level Up With the Gods", "Jinx", "Painter of the Night", "Battle Through the Heavens", "The King's Avatar",
  "Soul Land (Douluo Dalu)", "Tales of Demons and Gods", "Martial Peak", "The Great Ruler", "Apotheosis",
  "Against the Gods", "Coiling Dragon", "The Legend of the Northern Blade", "Renegade Immortal", "I Alone Level Grinding",
  "The Book Eating Magician", "Doupo Cangqiong", "Full-Time Magister", "Spirit Sword Sovereign", "Skeleton Soldier Couldn't Protect the Dungeon",
  "Trash of the Count's Family", "Volcanic Age", "Berserk of Gluttony", "Under the Oak Tree", "Sadan's Circle"
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function scrapeManga(title) {
  const slug = slugify(title);
  const filePath = path.join(OUTPUT_DIR, `${slug}.json`);

  if (fs.existsSync(filePath)) {
    console.log(`  [SKIP] ${title} already scraped locally.`);
    return;
  }

  console.log(`  [SCRAPING] ${title}...`);

  try {
    // 1. Search MangaDex for title match
    const searchRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=10&order[followedCount]=desc`);
    if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status} on search`);

    const searchData = await searchRes.json();
    if (!searchData.data || searchData.data.length === 0) {
      console.warn(`  ! No search results for "${title}"`);
      return;
    }

    // Match exact title
    let targetManga = searchData.data[0];
    for (const manga of searchData.data) {
      const titleValues = Object.values(manga.attributes.title || {}).map(t => typeof t === 'string' ? t.toLowerCase() : '');
      const altTitles = (manga.attributes.altTitles || []).map(at => {
        const val = Object.values(at)[0];
        return typeof val === 'string' ? val.toLowerCase() : '';
      });
      if (titleValues.includes(title.toLowerCase()) || altTitles.includes(title.toLowerCase())) {
        targetManga = manga;
        break;
      }
    }

    const mangaId = targetManga.id;
    const coverRel = targetManga.relationships.find(r => r.type === 'cover_art');
    let coverFileName = '';
    if (coverRel) {
      const coverRes = await fetch(`https://api.mangadex.org/cover/${coverRel.id}`);
      if (coverRes.ok) {
        const coverData = await coverRes.json();
        coverFileName = coverData.data?.attributes?.fileName || '';
      }
    }

    const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}.256.jpg` : '';

    // Fetch chapters feed
    const feedRes = await fetch(`https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&limit=100&order[chapter]=asc`);
    let chapters = [];
    if (feedRes.ok) {
      const feedData = await feedRes.json();
      if (feedData.data) {
        chapters = feedData.data.map(ch => ({
          chapterId: ch.id,
          chapterNumber: parseFloat(ch.attributes.chapter) || 0,
          title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
          externalUrl: ch.attributes.externalUrl || null
        }));
      }
    }

    const record = {
      title,
      slug,
      mangaId,
      coverUrl,
      description: targetManga.attributes.description?.en || '',
      status: targetManga.attributes.status || 'ongoing',
      totalChapters: chapters.length,
      chapters,
      scrapedAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
    console.log(`  [SAVED] ${title} (${chapters.length} chapters) -> ${slug}.json`);
  } catch (err) {
    console.error(`  [ERROR] Failed to scrape ${title}:`, err.message);
  }
}

async function run() {
  console.log(`====================================================`);
  console.log(`Starting Local Scraping for ${titles.length} Mangas`);
  console.log(`Target Folder: ${OUTPUT_DIR}`);
  console.log(`====================================================\n`);

  for (let i = 0; i < titles.length; i++) {
    console.log(`[${i + 1}/${titles.length}] ${titles[i]}`);
    await scrapeManga(titles[i]);
    await sleep(350); // Respect API rate limit
  }

  console.log(`\n====================================================`);
  console.log(`Local Scraping Complete! All JSON files stored in:`);
  console.log(`${OUTPUT_DIR}`);
  console.log(`====================================================`);
}

run();
