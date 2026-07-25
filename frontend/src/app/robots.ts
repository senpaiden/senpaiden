import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/manga/*/*/processing'],
    },
    sitemap: 'https://senpaiden.com/sitemap.xml',
  }
}
