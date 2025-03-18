'use client';

import './globals.css';
import React from 'react';
import MainNavbar from './components/MainNavbar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MainNavbar />
          <main className="pt-4">{children}</main>

          <footer className="bg-gray-100 py-4 mt-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>&copy; {new Date().getFullYear()} - Système de corrections d'activités</p>
            </div>
          </footer>
        </LocalizationProvider>
      </body>
    </html>
  );
}
