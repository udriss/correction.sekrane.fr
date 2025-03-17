'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from '@/lib/fragment';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditFragment({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const fragmentId = id;
  
  const [content, setContent] = useState('');
  const [fragment, setFragment] = useState<Fragment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchFragment = async () => {
      try {
        const response = await fetch(`/api/fragments/${fragmentId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement du fragment');
        const data = await response.json();
        setFragment(data);
        setContent(data.content);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement du fragment');
      } finally {
        setLoading(false);
      }
    };

    fetchFragment();
  }, [fragmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Le contenu du fragment ne peut pas être vide');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/fragments/${fragmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du fragment');
      }

      // Redirect back to the activity fragments page
      if (fragment?.activity_id) {
        router.push(`/activities/${fragment.activity_id}/fragments`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du fragment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner text="Chargement du fragment" />
      </div>
    );
  }

  if (!fragment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Fragment non trouvé
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Modifier le fragment</h1>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-6">
          <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
            Contenu du fragment
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          
          <Link
            href={`/activities/${fragment.activity_id}/fragments`}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
