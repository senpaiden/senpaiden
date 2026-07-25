import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  let mangaRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${apiUrl}/api/manga?limit=100`);
    if (res.ok) {
      const { data } = await res.json();
      mangaRoutes = (data || []).map((manga: any) => ({
        url: `https://senpaiden.com/manga/${manga.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch (e) {
    // Ignore during static generation if API server is not running
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: 'https://senpaiden.com',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: 'https://senpaiden.com/discover',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://senpaiden.com/search',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://senpaiden.com/library',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://senpaiden.com/history',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...staticRoutes, ...mangaRoutes];
}
