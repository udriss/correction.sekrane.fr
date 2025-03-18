'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { BarChart as BarChartIcon } from '@mui/icons-material';

export default function NewActivity() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [experimentalPoints, setExperimentalPoints] = useState(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Le nom de l\'activité est requis');
      return;
    }

    // Ensure the total is 20 points
    const totalPoints = Number(experimentalPoints) + Number(theoreticalPoints);
    if (totalPoints !== 20) {
      setError('Le total des points doit être égal à 20');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          content,
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'activité');
      }

      const data = await response.json();
      router.push(`/activities/${data.id}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la création de l\'activité');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePointsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    isExperimental: boolean
  ) => {
    const value = Number(e.target.value);
    setter(value);
    
    // Auto-adjust the other field to maintain a sum of 20
    if (isExperimental) {
      setTheoreticalPoints(20 - value);
    } else {
      setExperimentalPoints(20 - value);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nouvelle activité</h1>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
            Nom de l'activité
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
            Contenu (facultatif)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Grading Scale Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <BarChartIcon className="mr-2 text-blue-500" />
            <h2 className="text-lg font-semibold">Barème de notation</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="experimentalPoints" className="block text-gray-700 font-medium mb-2">
                Points partie expérimentale
              </label>
              <input
                type="number"
                id="experimentalPoints"
                min="0"
                max="20"
                value={experimentalPoints}
                onChange={(e) => handlePointsChange(e, setExperimentalPoints, true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="theoreticalPoints" className="block text-gray-700 font-medium mb-2">
                Points partie théorique
              </label>
              <input
                type="number"
                id="theoreticalPoints"
                min="0"
                max="20"
                value={theoreticalPoints}
                onChange={(e) => handlePointsChange(e, setTheoreticalPoints, false)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-500 mt-2">
            Note: Le total des points doit être égal à 20. Les valeurs sont ajustées automatiquement.
          </div>
          
          <div className="text-right mt-3">
            <p className="text-gray-700">
              <span className="font-medium">Total:</span>{" "}
              <span className="font-bold">{experimentalPoints + theoreticalPoints} points</span>
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Création en cours...' : 'Créer l\'activité'}
        </button>
      </form>
    </div>
  );
}
