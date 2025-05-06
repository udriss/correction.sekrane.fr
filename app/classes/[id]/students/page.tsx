'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  Container,
  Box,
  alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import UploadIcon from '@mui/icons-material/Upload';
import LockIcon from '@mui/icons-material/Lock';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClassStudentsManager from '@/components/classes/ClassStudentsManager';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';
import StudentPasswordManager from '@/components/students/StudentPasswordManager';
import StudentsCsvImport from '@/components/students/StudentsCsvImport';
import Dialog from '@mui/material/Dialog';

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
  const [importCSVMode, setImportCSVMode] = useState(false);

  // Fonction pour ouvrir le formulaire d'importation CSV
  const handleImportCSVClick = () => {
    setImportCSVMode(true);
  };
  
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
      {/* Header avec les composants GradientBackground et PatternBackground */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <GradientBackground variant="primary">
          <PatternBackground
            pattern="dots"
            opacity={0.05}
            sx={{ p: 4, borderRadius: 0 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    p: 1.5,
                    borderRadius: '50%',
                    display: 'flex',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 50, color: (theme) => theme.palette.text.primary }} />
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight={700} color="text.primary">
                    Gestion des étudiants
                  </Typography>
                  {classData && (
                    <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                      Classe: {classData.name} | Année: {classData.academic_year}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  component={Link}
                  href={`/classes/${classId}`}
                  sx={{ alignSelf: 'flex-start',
                    color: (theme) => alpha(theme.palette.text.primary,1),
                    fontWeight: 700,
                   }}
                >
                  Retour
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<UploadIcon />}
                  sx={{ alignSelf: 'flex-start',
                    fontWeight: 700,
                   }}
                  onClick={handleImportCSVClick}
                >
                  Importer CSV
                </Button>
              </Box>
            </Box>
          </PatternBackground>
        </GradientBackground>
      </Paper>

      {/* Modale d'import CSV */}
      <Dialog open={importCSVMode} onClose={() => setImportCSVMode(false)} maxWidth="md" fullWidth>
        <StudentsCsvImport
          onClose={() => setImportCSVMode(false)}
          onError={(msg) => setError(msg)}
          onSuccess={() => {
            setImportCSVMode(false);
            // Optionnel: rafraîchir la liste d'étudiants si besoin
            // window.location.reload();
          }}
        />
      </Dialog>

      {/* Use the ClassStudentsManager component */}
      <ClassStudentsManager 
        classId={classId} 
        classData={classData}
        initialActiveTab={0}
        showBatchFormInitially={false}
        onBatchFormClosed={() => {}}
      />

      {/* Modal de gestion des mots de passe - nous le définissons ici mais il sera contrôlé par le ClassStudentsManager */}
      <ClassPasswordManagerWrapper classId={classId} className={classData?.name || ''} />
    </Container>
  );
}

// Composant wrapper pour gérer l'état du modal de mots de passe
function ClassPasswordManagerWrapper({ classId, className }: { classId: number, className: string }) {
  const [passwordManagerOpen, setPasswordManagerOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);

  // Exposer les méthodes pour contrôler le modal des mots de passe
  // Cette fonction sera accessible via une référence globale
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Créer une référence globale pour permettre l'ouverture du modal depuis le ClassStudentsManager
      window.openClassPasswordManager = (students: any[]) => {
        setSelectedStudents(students);
        setPasswordManagerOpen(true);
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore - Nettoyer la référence à la fermeture du composant
        delete window.openClassPasswordManager;
      }
    };
  }, []);

  return (
    <StudentPasswordManager
      open={passwordManagerOpen}
      onClose={() => setPasswordManagerOpen(false)}
      students={selectedStudents}
      context="multiple"
      classId={classId}
      title={`Gestion des mots de passe - ${className}`}
    />
  );
}
