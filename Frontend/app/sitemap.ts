import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const publicPages = ['', '/about', '/events', '/calendar'];

  return publicPages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/events' ? 'daily' : 'monthly',
    priority: path === '' ? 1 : path === '/events' ? 0.9 : 0.7,
  }));
}
