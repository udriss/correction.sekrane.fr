import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logs système - Correction Sekrane',
  description: 'Consultez les logs du système pour suivre les actions importantes effectuées dans l\'application',
};

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}