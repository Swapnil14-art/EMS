import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/events', '/calendar'],
        disallow: [
          '/admin/',
          '/associate_dean/',
          '/club_coordinator/',
          '/director/',
          '/student/',
          '/additional/',
          '/profile',
          '/change-password',
          '/complete-profile',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
