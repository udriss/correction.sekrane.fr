const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'correction.sekrane.fr',
  ],
  reactStrictMode: true,
  // Supprime les avertissements React liés à useLayoutEffect pendant le SSR
  eslint: {
    // Désactiver l'ESLint pendant le build pour ignorer ces avertissements
    ignoreDuringBuilds: true,
  },
  onDemandEntries: {
    // période en ms où les pages compilées en mémoire
    maxInactiveAge: 25 * 1000,
    // nombre de pages à maintenir en mémoire
    pagesBufferLength: 2,
  },
  compiler: {
    // Supprime les propriétés propres à React mais non utilisées des éléments DOM
    // pour réduire la taille du HTML envoyé au client
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    serverActions: {},
    // Optimisation du chargement des modules
    optimizeCss: true,
  },
  // Activer la compression statique pour réduire la taille des fichiers
  compress: true,
  // Désactiver les sourceMap en production pour réduire la taille des fichiers
  productionBrowserSourceMaps: false,
  // Configuration des images (déplacée hors de experimental)
  images: { 
    formats: ['image/webp'] 
  },
  webpack: (config) => {
    // Resolve Node.js native modules
    // necessary webpack configuration to handle Node.js native modules like 'net' and 'tls' that the mysql2 package requires.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
      dns: false,
      child_process: false,
      http2: false,
    };
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  }
};

module.exports = process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;
