'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@/lib/activity';

export default function NewCorrection({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [studentName, setStudentName] = useState('');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement de l\'activité');
        const data = await response.json();
        setActivity(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement de l\'activité');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/activities/${activityId}/corrections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          student_name: studentName.trim() || null,
          content: '' 
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la correction');
      }

      const data = await response.json();
      router.push(`/corrections/${data.id}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la création de la correction');
    } finally {
      setIsSubmitting(false);
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
      <h1 className="text-3xl font-bold mb-6">Nouvelle correction pour {activity.name}</h1>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-6">
          <label htmlFor="studentName" className="block text-gray-700 font-medium mb-2">
            Nom de l'étudiant (facultatif)
          </label>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`${activity.name} - [horodatage sera ajouté automatiquement]`}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:bg-purple-300"
        >
          {isSubmitting ? 'Création en cours...' : 'Créer la correction'}
        </button>
      </form>
    </div>
  );
}
