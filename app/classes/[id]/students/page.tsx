'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  Container,
  Box
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import UploadIcon from '@mui/icons-material/Upload';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClassStudentsManager from '@/components/classes/ClassStudentsManager';

interface Class {
  id: number;
  name: string;
  academic_year: string;
}

export default function ClassStudentsPage({ params }: { params: Promise<{ id: string }> }) {

  
  const [classId, setClassId] = useState<number | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Extract and validate the class ID from params
  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        
        if (isNaN(id)) {
          setError('ID de classe invalide');
          setLoading(false);
          return;
        }
        
        setClassId(id);
      } catch (err) {
        console.error('Error resolving params:', err);
        setError('Erreur lors de la lecture des paramètres');
        setLoading(false);
      }
    }
    
    resolveParams();
  }, [params]);

  // Fetch class details after classId is available
  useEffect(() => {
    if (classId === null) return;
    
    async function fetchClassData() {
      try {
        // Fetch class details
        const classResponse = await fetch(`/api/classes/${classId}`);
        if (!classResponse.ok) throw new Error('Erreur lors du chargement de la classe');
        const classData = await classResponse.json();
        setClassData(classData);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClassData();
  }, [classId]);

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données" />
      </div>
    );
  }

  if (error || !classId) {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            border: 1,
            borderColor: 'error.main',
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {error || 'Une erreur est survenue'}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          component={Link} 
          href="/classes"
        >
          Retour à la liste des classes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      {/* Header with gradient */}
      <Paper 
        elevation={3}
        className="mb-8 rounded-lg overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800"
      >
        <div className="p-6 text-white relative">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10" 
               style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}
          ></div>
          
          {/* Header content */}
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <SchoolIcon fontSize="large" />
              <div>
                <Typography variant="h4" component="h1" className="font-bold text-black mb-1">
                  Gestion des étudiants
                </Typography>
                {classData && (
                  <Typography variant="subtitle1">
                    Classe: {classData.name} | Année: {classData.academic_year}
                  </Typography>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outlined" 
                color="secondary" 
                startIcon={<ArrowBackIcon />} 
                component={Link} 
                href={`/classes/${classId}`}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<UploadIcon />}
              >
                Importer CSV
              </Button>
            </div>
          </div>
        </div>
      </Paper>

      {/* Use the ClassStudentsManager component */}
      <ClassStudentsManager 
        classId={classId} 
        classData={classData}
      />
    </Container>
  );
}
