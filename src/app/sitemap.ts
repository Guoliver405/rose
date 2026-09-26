import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/** Nur die öffentlichen Seiten — Portale und Haus-Routen bleiben draußen (siehe robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const lastModified = new Date('2026-09-05')
  return [
    { url: `${base}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/registrieren`, lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/simulator`, lastModified: new Date('2026-09-26'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/simulator/registrieren`, lastModified: new Date('2026-09-26'), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/login`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/impressum`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/datenschutz`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/agb`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/simulator-nutzung`, lastModified: new Date('2026-09-26'), changeFrequency: 'yearly', priority: 0.2 },
  ]
}
