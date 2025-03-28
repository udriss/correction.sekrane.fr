import { MetadataRoute } from 'next';

// Generate robots.txt file for improved SEO
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/private/',
      ],
    },
    sitemap: 'https://correction.sekrane.fr/sitemap.xml',
  };
}
