import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/requests', '/quotes', '/invoices', '/services', '/settings'],
      },
    ],
    sitemap: 'https://brickquote.app/sitemap.xml',
  }
}
