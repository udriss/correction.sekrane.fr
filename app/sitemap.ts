import { MetadataRoute } from 'next';

// Generate sitemap for improved SEO
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://correction.sekrane.fr';
  
  // Static routes
  const routes = [
    '',
    '/activities',
    '/activities/new',
    '/demo',
    '/corrections',
    // Add more static routes here
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const, // Use literal type to satisfy type constraints
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
