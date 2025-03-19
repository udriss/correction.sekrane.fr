'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import { Paper, Typography, Box, Alert, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <Typography variant="h4" component="h1" className="font-bold text-blue-800 mb-2">
            Nouvelle activité
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600">
            Créez une nouvelle activité à corriger pour vos élèves
          </Typography>
        </div>
        
        <Paper 
          elevation={2} 
          className="rounded-lg overflow-hidden shadow-md"
        >
          {/* En-tête du formulaire */}
          <Box className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AddCircleIcon />
              <Typography variant="h6">
                Formulaire de création
              </Typography>
            </div>
            <IconButton 
              component={Link}
              href="/"
              size="small"
              className="text-white"
              aria-label="retour à l'accueil"
            >
              <HomeIcon />
            </IconButton>
          </Box>
          
          <Box className="p-6">
            {error && (
              <Alert severity="error" className="mb-6" variant="outlined">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Nom de l'activité
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Ex: TP sur les circuits électriques"
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
                  placeholder="Description détaillée de l'activité..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </div>

              {/* Grading Scale Section - version améliorée */}
              <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-4">
                  <BarChartIcon className="mr-2 text-blue-600" fontSize="medium" />
                  <Typography variant="h6" className="font-bold text-blue-800">
                    Barème de notation
                  </Typography>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <label htmlFor="experimentalPoints" className="block text-gray-700 font-semibold mb-3">
                      Points partie expérimentale
                    </label>
                    <input
                      type="number"
                      id="experimentalPoints"
                      min="0"
                      max="20"
                      step="0.5"
                      value={experimentalPoints}
                      onChange={(e) => handlePointsChange(e, setExperimentalPoints, true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <label htmlFor="theoreticalPoints" className="block text-gray-700 font-semibold mb-3">
                      Points partie théorique
                    </label>
                    <input
                      type="number"
                      id="theoreticalPoints"
                      min="0"
                      max="20"
                      step="0.5"
                      value={theoreticalPoints}
                      onChange={(e) => handlePointsChange(e, setTheoreticalPoints, false)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-2">
                  <Typography variant="body2" className="text-gray-600 italic">
                    Le total des points doit être égal à 20. Les valeurs sont ajustées automatiquement.
                  </Typography>
                  
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-center">
                    <Typography variant="subtitle2">Total</Typography>
                    <Typography variant="h6" className="font-bold">
                      {experimentalPoints + theoreticalPoints} / 20
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<ArrowBackIcon />}
                  component={Link}
                  href="/"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Retour à l'accueil
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <SaveIcon />
                  {isSubmitting ? 'Création en cours...' : ''}
                </Button>
              </div>
            </form>
          </Box>
        </Paper>
      </div>
    </div>
  );
}
