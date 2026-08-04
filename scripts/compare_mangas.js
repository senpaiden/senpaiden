const fs = require('fs');
const path = require('path');

// Knowledge base of true chapter counts (approximate for ongoing series)
const realChapterCounts = {
  "One Piece": 1120,
  "Naruto": 700,
  "Attack on Titan": 139,
  "Dragon Ball": 519,
  "Bleach": 686,
  "Death Note": 108,
  "Fullmetal Alchemist": 108,
  "Demon Slayer": 205,
  "Jujutsu Kaisen": 265,
  "My Hero Academia": 430,
  "Berserk": 376,
  "Vinland Saga": 215,
  "Tokyo Ghoul": 143,
  "Hunter x Hunter": 400,
  "One Punch Man": 200,
  "Chainsaw Man": 170,
  "Slam Dunk": 276,
  "Vagabond": 327,
  "Monster": 162,
  "Vagrant Queen": 12,
  "Spy x Family": 100,
  "Haikyuu!!": 402,
  "Fairy Tail": 545,
  "Black Clover": 370,
  "Fire Force": 304,
  "Dr. Stone": 232,
  "The Promised Neverland": 181,
  "Mob Psycho 100": 101,
  "Kingdom": 800,
  "Blue Lock": 270,
  "Rurouni Kenshin": 255,
  "Yu Yu Hakusho": 175,
  "Inuyasha": 558,
  "D.Gray-man": 250,
  "Blue Exorcist": 150,
  "Assassination Classroom": 180,
  "The Seven Deadly Sins": 346,
  "Beastars": 196,
  "Golden Kamuy": 314,
  "20th Century Boys": 249,
  "Akira": 120,
  "Gantz": 383,
  "Parasyte": 64,
  "Vinland Saga: Book of Vinland": 0, // Not a real standalone manga series
  "Grand Blue": 95,
  "Made in Abyss": 67,
  "The Fable": 240,
  "Oyasumi Punpun": 147,
  "Kaiju No. 8": 110,
  "Solo Leveling": 200,
  "Tower of God": 600,
  "The God of High School": 570,
  "Noblesse": 544,
  "The Beginning After the End": 185,
  "Omniscient Reader's Viewpoint": 215,
  "Nano Machine": 215,
  "The Boxer": 130,
  "Lookism": 500,
  "True Beauty": 289,
  "Sweet Home": 140,
  "Hardcore Leveling Warrior": 315,
  "SSS-Class Suicide Hunter": 115,
  "Return of the Mount Hua Sect": 130,
  "Reawakening of the Stone Genius": 70, // Unknown/Niche
  "The Legendary Moonlight Sculptor": 169,
  "Weak Hero": 267,
  "Wind Breaker": 500,
  "Eleceed": 300,
  "Bastard": 94,
  "Days of Hana": 114,
  "The Remarried Empress": 160,
  "Who Made Me a Princess": 125,
  "Villains Are Destined to Die": 150,
  "Second Life Ranker": 170,
  "A Returner's Magic Should Be Special": 260,
  "Level Up With the Gods": 110,
  "Jinx": 60,
  "Painter of the Night": 130,
  "Battle Through the Heavens": 400,
  "The King's Avatar": 120,
  "Soul Land (Douluo Dalu)": 340,
  "Tales of Demons and Gods": 480,
  "Martial Peak": 3700,
  "The Great Ruler": 400,
  "Apotheosis": 1100,
  "Against the Gods": 500,
  "Coiling Dragon": 160,
  "The Legend of the Northern Blade": 180,
  "Renegade Immortal": 150,
  "I Alone Level Grinding": 90,
  "The Book Eating Magician": 150,
  "Doupo Cangqiong": 400,
  "Full-Time Magister": 1000,
  "Spirit Sword Sovereign": 600,
  "Skeleton Soldier Couldn't Protect the Dungeon": 280,
  "Trash of the Count's Family": 140,
  "Volcanic Age": 260,
  "Berserk of Gluttony": 60,
  "Under the Oak Tree": 95,
  "Sadan's Circle": 0 // Unknown
};

function run() {
  const auditPath = path.join(__dirname, 'manga_audit_results.md');
  const outPath = path.join(__dirname, 'manga_comparison_results.md');

  if (!fs.existsSync(auditPath)) {
    console.error("Audit results not found!");
    process.exit(1);
  }

  const lines = fs.readFileSync(auditPath, 'utf8').split('\n');
  const results = [];

  // Parse markdown table
  for (let line of lines) {
    if (!line.trim() || !line.includes('|') || line.includes('---|') || line.includes('Total Chapters (approx)')) continue;
    if (line.startsWith('#')) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 5) continue;

    const title = parts[1];
    const available = parts[2].includes('Yes');
    const mdChapters = parseInt(parts[3], 10) || 0;
    const languages = parts[4];

    results.push({ title, available, mdChapters, languages });
  }

  // Generate Comparison Markdown
  let md = `# MangaDex vs Real Internet Chapter Comparison\n\n`;
  md += `> **Note:** Many popular, officially licensed mangas (like *One Piece*, *Attack on Titan*, *Naruto*) show massive discrepancies. This is because MangaDex complies with DMCA takedowns and does not host official English releases, resulting in a tiny fraction of the actual chapters being available on their API.\n\n`;
  md += `| Title | MangaDex Chapters | Real Internet Chapters | Discrepancy (Missing) | Available Languages (MD) |\n`;
  md += `|---|---|---|---|---|\n`;

  results.forEach(r => {
    // Only list mangas that actually have English chapters on MangaDex
    if (r.mdChapters === 0) return;

    const realCount = realChapterCounts[r.title] || 0;
    let missing = realCount - r.mdChapters;
    if (missing < 0) missing = 0; // If MD has more, then 0 missing
    
    // Highlight discrepancies larger than 50 chapters
    const missingStr = missing > 50 ? `**${missing} missing!**` : `${missing}`;

    md += `| ${r.title} | ${r.mdChapters} | ~${realCount} | ${missingStr} | ${r.languages} |\n`;
  });

  fs.writeFileSync(outPath, md);
  console.log(`Comparison saved to ${outPath}`);
}

run();
