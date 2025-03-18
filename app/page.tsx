'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from '@/lib/activity';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@mui/material';
export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities');
        if (!response.ok) throw new Error('Erreur lors du chargement des activités');
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Corrections d'activités</h1>
      
      <Link
        href="/activities/new"
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-6 inline-block"
      >
        Nouvelle activité
      </Link>

      {loading ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner text="Chargement des activités" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="border rounded-lg p-4 shadow hover:shadow-md transition">
              <h2 className="text-xl font-semibold mb-2">{activity.name}</h2>
                <div className="flex space-x-2 mt-4">
                <Button variant="outlined" color="success" href={`/activities/${activity.id}`} component={Link}>
                  Voir détails
                </Button>
                <Button variant="outlined" color="secondary" href={`/activities/${activity.id}/corrections/new`} component={Link}>
                  Nouvelle correction
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
