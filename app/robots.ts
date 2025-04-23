import { MetadataRoute } from 'next';

/**
 * Génère le fichier robots.txt pour le site
 * Cette fonction utilise l'API de métadonnées de Next.js pour créer un fichier robots.txt
 * qui indique aux moteurs de recherche quelles pages peuvent être indexées
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://correction.sekrane.fr';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/logs/',
          '/test/',
          '/components/',
          '/lib/',
          '/hooks/',
          '/utils/',
        ],
      },
      {
        // Règles spécifiques pour Googlebot
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
