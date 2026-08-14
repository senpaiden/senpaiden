import { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/history', '/library', '/login', '/notifications', '/search', '/manga/*/*/processing'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
