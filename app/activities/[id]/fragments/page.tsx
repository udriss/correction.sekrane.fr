'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity } from '@/lib/activity';
import { Fragment } from '@/lib/fragment';

export default function ActivityFragments({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [newFragmentContent, setNewFragmentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities/${activityId}`);
        if (!activityResponse.ok) {
          throw new Error('Erreur lors du chargement de l\'activité');
        }
        const activityData = await activityResponse.json();
        setActivity(activityData);

        // Fetch fragments
        const fragmentsResponse = await fetch(`/api/activities/${activityId}/fragments`);
        if (!fragmentsResponse.ok) {
          throw new Error('Erreur lors du chargement des fragments');
        }
        const fragmentsData = await fragmentsResponse.json();
        setFragments(fragmentsData);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activityId]);

  const handleAddFragment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFragmentContent.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/fragments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: activityId,
          content: newFragmentContent.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du fragment');
      }

      const newFragment = await response.json();
      setFragments([...fragments, newFragment]);
      setNewFragmentContent('');
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout du fragment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFragment = async (fragmentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fragment ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/fragments/${fragmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du fragment');
      }

      setFragments(fragments.filter(fragment => fragment.id !== fragmentId));
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du fragment');
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  }

  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Activité non trouvée
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fragments pour {activity.name}</h1>
          <p className="text-gray-600">
            <Link href={`/activities/${activityId}`} className="text-blue-600 hover:underline">
              Retour à l'activité
            </Link>
          </p>
        </div>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Ajouter un fragment</h2>
        <form onSubmit={handleAddFragment} className="mb-6">
          <div className="mb-3">
            <textarea
              value={newFragmentContent}
              onChange={(e) => setNewFragmentContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="Contenu du fragment..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newFragmentContent.trim()}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-300"
          >
            {submitting ? 'Ajout en cours...' : 'Ajouter le fragment'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Fragments existants</h2>
        {fragments.length === 0 ? (
          <p className="text-gray-600">Aucun fragment pour cette activité.</p>
        ) : (
          <div className="space-y-4">
            {fragments.map((fragment) => (
              <div key={fragment.id} className="bg-white border rounded-lg p-4 shadow">
                <div className="whitespace-pre-wrap mb-3">{fragment.content}</div>
                <div className="flex justify-end space-x-2">
                  <Link
                    href={`/fragments/${fragment.id}/edit`}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => fragment.id && handleDeleteFragment(fragment.id)}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
