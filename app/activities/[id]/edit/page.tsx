'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity } from '@/lib/activity';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@mui/material';
import { FaSave, FaTimes } from 'react-icons/fa';



export default function EditActivity({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the Promise for params using React.use
  const { id } = React.use(params);
  const activityId = id;
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement de l\'activité');
        const activity = await response.json();
        setName(activity.name);
        setContent(activity.content || '');
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
    
    if (!name.trim()) {
      setError('Le nom de l\'activité est requis');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, content }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'activité');
      }

      router.push(`/activities/${activityId}`);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour de l\'activité');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement de l'activité" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Modifier l'activité</h1>

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

        <div className="flex space-x-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="contained"
            color="primary"
          >
            <FaSave style={{marginRight: "4px"}} />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          
          <Button
            component={Link}
            href={`/activities/${activityId}`}
            variant="contained"
            color="inherit"
          >
            <FaTimes style={{marginRight: "4px"}} />
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
