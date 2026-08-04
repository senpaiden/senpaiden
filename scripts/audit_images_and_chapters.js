const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'mangas');
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function checkChapterImages(chapterId) {
  try {
    const res = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
    if (!res.ok) return { status: 'error', pages: 0 };
    const data = await res.json();
    const pages = data.chapter?.data?.length || 0;
    return { status: 'hosted', pages };
  } catch (e) {
    return { status: 'error', pages: 0 };
  }
}

async function run() {
  console.log(`Auditing ${files.length} manga files for chapter & page image availability...\n`);
  const results = [];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const manga = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const title = manga.title;
    const totalChapters = manga.chapters ? manga.chapters.length : 0;

    if (totalChapters === 0) {
      results.push({
        title,
        chapters: 0,
        imageType: 'N/A (No Chapters)',
        samplePageCount: 0
      });
      continue;
    }

    // Check sample chapter (first chapter)
    const sampleCh = manga.chapters[0];
    if (sampleCh.externalUrl) {
      results.push({
        title,
        chapters: totalChapters,
        imageType: 'External Link (MangaPlus/Kodansha)',
        samplePageCount: 0
      });
    } else {
      const imgCheck = await checkChapterImages(sampleCh.chapterId);
      results.push({
        title,
        chapters: totalChapters,
        imageType: imgCheck.status === 'hosted' ? 'Hosted Images Available' : 'Error Fetching Pages',
        samplePageCount: imgCheck.pages
      });
      await sleep(250); // Rate limit
    }
  }

  console.log(`========================================================================`);
  console.log(`MANGA CHAPTER & IMAGE AVAILABILITY AUDIT REPORT`);
  console.log(`========================================================================`);
  console.table(results);

  // Save audit report to markdown
  let mdContent = `# Manga Chapter & Image Availability Audit Report\n\n`;
  mdContent += `| Title | Available Chapters | Image Type / Availability | Sample Page Count |\n`;
  mdContent += `|---|---|---|---|\n`;

  for (const r of results) {
    mdContent += `| ${r.title} | ${r.chapters} | ${r.imageType} | ${r.samplePageCount} |\n`;
  }

  const reportPath = path.join(DATA_DIR, '..', 'chapter_images_audit_report.md');
  fs.writeFileSync(reportPath, mdContent);
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

run();
