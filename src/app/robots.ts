import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * Suchmaschinen dürfen die Marketing- und Rechtsseiten lesen — nicht die
 * Portale. Die Portale sind ohnehin nur mit Sitzung erreichbar, aber die
 * Anmeldeseiten je Haus (`/h/<slug>/…`) würden sonst ein Kunden-Verzeichnis
 * im Suchindex ergeben, das die Anwendung bewusst nirgends anbietet.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/impressum', '/datenschutz', '/agb', '/login', '/registrieren'],
      disallow: ['/admin', '/h/', '/guest', '/service', '/auth/', '/passwort-neu', '/passwort-vergessen'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
