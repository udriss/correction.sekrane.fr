'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-lg w-full text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Une erreur est survenue</h2>
        <p className="text-gray-600 mb-6">
          Nous sommes désolés, mais une erreur s'est produite lors du traitement de votre demande.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
