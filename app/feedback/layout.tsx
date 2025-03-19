import React from 'react';
import { Metadata } from 'next';
import '../globals.css';
import { Inter } from 'next/font/google';

// Initialiser la police Inter
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Correction - Feedback',
  description: 'Visualisation des retours sur les travaux',
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <main className="min-h-screen bg-white">
          {children}
        </main>
      </body>
    </html>
  );
}
