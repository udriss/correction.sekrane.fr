'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from '@/lib/activity';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RateReviewIcon from '@mui/icons-material/RateReview';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 text-blue-800">Corrections d'activités</h1>
          <p className="text-xl text-gray-600">Plateforme de gestion des activités pédagogiques</p>
        </header>
        
        <div className="flex justify-center mb-8">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/activities/new"
            size="large"
            className="py-2 px-4"
          >
            Nouvelle activité
          </Button>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner text="Chargement des activités" />
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white border rounded-xl p-6 shadow-md hover:shadow-lg transition">
                <h2 className="text-2xl font-semibold mb-3 text-gray-800">{activity.name}</h2>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    href={`/activities/${activity.id}`} 
                    component={Link}
                    startIcon={<VisibilityIcon />}
                  >
                    Voir détails
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    href={`/activities/${activity.id}/corrections/new`} 
                    component={Link}
                    startIcon={<RateReviewIcon />}
                  >
                    Nouvelle correction
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Floating action button for mobile */}
{/*       <Fab 
        color="primary" 
        aria-label="add" 
        className="fixed bottom-6 right-6 z-10 shadow-lg"
        component={Link}
        href="/activities/new"
      >
        <AddIcon />
      </Fab> */}
    </div>
  );
}
