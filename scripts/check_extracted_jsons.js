const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'mangas');

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Error: ${DATA_DIR} directory does not exist!`);
  process.exit(1);
}

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

let totalManga = files.length;
let totalChapters = 0;
let zeroChapterManga = [];
let validManga = [];

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const chCount = Array.isArray(data.chapters) ? data.chapters.length : 0;
    totalChapters += chCount;

    if (chCount === 0) {
      zeroChapterManga.push(data.title || file);
    } else {
      validManga.push({
        title: data.title,
        chapters: chCount,
        cover: !!data.coverUrl,
        hasExternal: data.chapters.some(c => !!c.externalUrl)
      });
    }
  } catch (e) {
    console.error(`Failed to parse ${file}:`, e.message);
  }
}

validManga.sort((a, b) => b.chapters - a.chapters);

console.log(`====================================================`);
console.log(`LOCAL JSON EXTRACTION AUDIT REPORT`);
console.log(`====================================================`);
console.log(`Total Manga Files Extracted: ${totalManga}`);
console.log(`Total Chapters Extracted:    ${totalChapters}`);
console.log(`Manga with >0 Chapters:      ${validManga.length}`);
console.log(`Manga with 0 Chapters:       ${zeroChapterManga.length}`);
console.log(`====================================================\n`);

console.log(`TOP 15 EXTRACTED MANGA BY CHAPTER COUNT:`);
console.table(validManga.slice(0, 15));

if (zeroChapterManga.length > 0) {
  console.log(`\nMANGA WITH 0 CHAPTERS (MangaDex Gaps):`);
  console.log(zeroChapterManga.join(', '));
}
