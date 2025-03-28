import React from 'react';
import { Metadata } from 'next';
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
  // Pour un layout imbriqué, ne pas inclure les balises html et body
  return (
    <div className={`${inter.className} min-h-screen bg-white`}>
      <main>
        {children}
      </main>
    </div>
  );
}