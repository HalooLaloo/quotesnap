import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/requests', '/quotes', '/invoices', '/services', '/settings', '/subscribe', '/checkout-complete', '/ix'],
      },
    ],
    sitemap: 'https://brickquote.app/sitemap.xml',
  }
}
