import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import ClientLayout from '@/components/layout/ClientLayout';
import '@/styles/editor.css';

// Initialiser la police Inter
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Correction Sekrane',
  description: 'Plateforme de gestion des corrections et évaluations pédagogiques',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="author" content="Idriss SEKRANE" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}