import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-lg w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Page non trouvée</h2>
        <p className="text-gray-600 mb-6">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
