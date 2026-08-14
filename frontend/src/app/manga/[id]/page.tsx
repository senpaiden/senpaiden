import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MangaDetailClient } from "./MangaDetailClient";
import { AdSlot } from "@/components/AdSlot";
import { getLocalCatalogue, type CatalogueManga } from "@/lib/local-catalogue";
import { cleanDescription, mangaCanonical, SITE_NAME, absoluteUrl } from "@/lib/seo";

import { getApiUrl } from "@/lib/api";

export const revalidate = 60;

async function getManga(id: string): Promise<CatalogueManga | null> {
  const apiUrl = getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/manga/${id}`, {
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 60 },
    });
    if (response.ok) return await response.json() as CatalogueManga;
  } catch {}
  return (await getLocalCatalogue()).find((item) => item.id === id) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const manga = await getManga(id);
  if (!manga) return { title: "Manga Not Found", robots: { index: false, follow: false } };

  const canonical = mangaCanonical(manga.id);
  const description = cleanDescription(manga.description, `Discover ${manga.title}, chapters, details and similar manga on ${SITE_NAME}.`);
  const title = `Read ${manga.title} Manga Online | ${SITE_NAME}`;
  const image = manga.cover_url || absoluteUrl("/icon.png");

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    keywords: [manga.title, manga.alt_title, ...(manga.genres || []), "manga", "manhwa", "webtoon"].filter(Boolean),
    openGraph: {
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: image, alt: `${manga.title} manga cover` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export default async function MangaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiUrl = getApiUrl();

  let manga = await getManga(id);
  let chapters: Record<string, unknown>[] = [];
  let related: CatalogueManga[] = [];

  if (!manga) notFound();

  try {
    const response = await fetch(`${apiUrl}/api/manga/${id}`, {
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 60 },
    });
    if (response.ok) {
      const data = await response.json() as CatalogueManga & { chapters?: Record<string, unknown>[] };
      manga = data;
      chapters = data.chapters || [];
    }
  } catch {}

  try {
    const recommendations = await fetch(`${apiUrl}/api/manga/${id}/co-binged`, {
      signal: AbortSignal.timeout(1800),
      next: { revalidate: 3600 },
    });
    if (recommendations.ok) {
      const payload = await recommendations.json() as { data?: CatalogueManga[] };
      related = payload.data || [];
    }
    if (!related.length) {
      const fallback = await fetch(`${apiUrl}/api/manga?page=1&limit=6`, {
        signal: AbortSignal.timeout(1800),
        next: { revalidate: 60 },
      });
      if (fallback.ok) {
        const payload = await fallback.json() as { data?: CatalogueManga[] };
        related = (payload.data || []).filter((item) => item.id !== manga.id).slice(0, 4);
      }
    }
  } catch {}

  if (!related.length) {
    related = (await getLocalCatalogue()).filter((item) => item.id !== manga.id).slice(0, 4);
  }

  const canonical = mangaCanonical(manga.id);
  const description = cleanDescription(manga.description, `Discover ${manga.title}, chapters and related manga on ${SITE_NAME}.`, 500);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWorkSeries",
        "@id": `${canonical}#series`,
        name: manga.title,
        alternateName: manga.alt_title || undefined,
        description,
        image: manga.cover_url || undefined,
        url: canonical,
        author: manga.author ? { "@type": "Person", name: manga.author } : undefined,
        genre: manga.genres || [],
        inLanguage: "en",
        isAccessibleForFree: true,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Discover", item: absoluteUrl("/discover") },
          { "@type": "ListItem", position: 3, name: manga.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <MangaDetailClient manga={manga} chapters={chapters} related={related} />
      <div className="mx-auto max-w-6xl px-4 pb-10 md:px-8"><AdSlot placement="manga-detail" /></div>
    </>
  );
}
