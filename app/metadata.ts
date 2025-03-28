import { Metadata } from 'next';

// Base metadata configuration for the entire application
export const metadata: Metadata = {
  title: {
    default: 'Système de corrections d\'activités',
    template: '%s | Système de Corrections d\'Activités',
  },
  description: 'Plateforme de gestion des corrections et évaluations pédagogiques',
  keywords: ['corrections', 'évaluation', 'éducation', 'enseignement', 'apprentissage', 'notation', 'activités pédagogiques'],
  authors: [{ name: 'Votre nom', url: 'https://correction.sekrane.fr' }],
  creator: 'Votre nom ou société',
  publisher: 'Votre nom ou société',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://correction.sekrane.fr'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/fr-FR',
      'en-US': '/en-US',
    },
  },
  openGraph: {
    title: 'Système de Corrections d\'Activités',
    description: 'Plateforme de gestion des corrections et évaluations pédagogiques',
    url: 'https://correction.sekrane.fr',
    siteName: 'Système de Corrections d\'Activités',
    images: [
      {
        url: 'https://correction.sekrane.fr/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Système de Corrections d\'Activités',
      },
      {
        url: 'https://correction.sekrane.fr/images/og-wide.jpg',
        width: 1600,
        height: 900,
        alt: 'Plateforme d\'évaluation pédagogique',
      },
      {
        url: 'https://correction.sekrane.fr/images/og-square.jpg',
        width: 1080,
        height: 1080,
        alt: 'Système de Corrections d\'Activités - Aperçu',
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Système de corrections d\'activités',
    description: 'Plateforme de gestion des corrections et évaluations pédagogiques',
    creator: '@votrecompte',
    images: [
      'https://correction.sekrane.fr/images/twitter-large.jpg',
      'https://correction.sekrane.fr/images/twitter-small.jpg'
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon-precomposed.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
  applicationName: 'Système de corrections d\'activités',
  category: 'education',
};
