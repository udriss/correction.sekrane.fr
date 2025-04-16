'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ClassStudentsManager from '@/components/classes/ClassStudentsManager';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { 
  Button,
  Box,
  Typography, 
  Alert,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface ClassData {
  id: number;
  name: string;
  academic_year: string;
  nbre_subclasses?: number | null;
}

interface ClassStudentsManagerModalProps {
  classId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function ClassStudentsManagerModal({ 
  classId, 
  open, 
  onClose 
}: ClassStudentsManagerModalProps) {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  const [studentStats, setStudentStats] = useState({
    total: 0,
    withCorrections: 0
  });
  
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Extraire la fonction fetchClassData pour qu'elle soit accessible en dehors du useEffect
  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      // Fetch class details
      const classResponse = await fetch(`/api/classes/${classId}`);
      
      if (classResponse.status === 404) {
        setError('Classe non trouvée');
        setErrorDetails({ message: 'La classe demandée n\'existe pas' });
        setLoading(false);
        return;
      }
      
      if (classResponse.status === 401) {
        // Redirection handled by middleware
        return;
      }
      
      if (!classResponse.ok) {
        const errorData = await classResponse.json().catch(() => ({ error: 'Erreur lors du chargement des données de la classe' }));
        // Créer une instance d'Error et y attacher les détails
        const error = new Error('Erreur lors du chargement des données de la classe : ' + (errorData.error || 'Erreur lors du chargement des données de la classe'));
        (error as any).details = errorData.details || {};
        setError(error.message);
        setErrorDetails((error as any).details);
        throw error;
      }
      
      const classDataResponse = await classResponse.json();
      setClassData(classDataResponse);
      
      // Fetch students stats
      const statsResponse = await fetch(`/api/classes/${classId}/stats`);
      
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({ error: 'Erreur lors du chargement des statistiques' }));
        console.warn('Problème lors du chargement des statistiques:', errorData);
        // Ne pas bloquer le chargement de la page, juste logger l'erreur
      } else {
        const statsData = await statsResponse.json();
        setStudentStats({
          total: statsData?.total_students || 0,
          withCorrections: statsData?.students_with_corrections || 0
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Une erreur est survenue lors du chargement des données.');
      
      // Si l'erreur contient des détails (comme c'est le cas pour une réponse d'API avec détails)
      if ((err as any)?.details) {
        setErrorDetails((err as any).details);
      } else if (typeof err === 'object' && err !== null) {
        // Récupérer toutes les informations sur l'erreur pour affichage
        setErrorDetails({
          message: (err as Error).message,
          stack: (err as Error).stack,
          // Pour les erreurs network ou Response, récupérer ce qu'on peut
          status: (err as any).status,
          statusText: (err as any).statusText,
          // Autres propriétés potentielles d'erreur
          code: (err as any).code,
          sqlMessage: (err as any).sqlMessage,
          sql: (err as any).sql
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setClassData(null);
      setError(null);
      setLoading(true);
    }
  }, [open]);

  // Fetch class data when modal opens
  useEffect(() => {
    if (!classId || !open) return;
    fetchClassData();
  }, [classId, open]);

  // Handle errors before rendering content
  if (error) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Erreur</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <ErrorDisplay 
            error={error}
            errorDetails={errorDetails}
            withRefreshButton={true}
            onRefresh={() => {
              setError(null);
              setErrorDetails(null);
              if (classId && open) {
                setLoading(true);
                fetchClassData();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ p: 0 }}>
        {/* Header with gradient and stats */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: '0',
            background: 'linear-gradient(to right, #581c87, rgb(7, 0, 193))'
          }}
        >
          <Box className="p-4 relative">
            {/* Header content */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon fontSize="large" sx={{ color: 'white' }} />
                <Box>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'white' }}>
                    {loading ? 'Chargement...' : classData?.name}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {loading ? '' : `Année ${classData?.academic_year || ''}`}
                  </Typography>
                </Box>
              </Box>
              
              <IconButton 
                onClick={onClose}
                sx={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            {/* Stats bar - only shown when data is loaded */}
            {!loading && classData && (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mt: 2,
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                <Paper sx={{ 
                  p: 1, 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  backdropFilter: 'blur(4px)',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <PersonIcon sx={{ color: '#90caf9' }} />
                  <Typography variant="body2" sx={{ color: '#e3f2fd' }}>
                    {studentStats.total === 0 ? "Aucun étudiant" : 
                    studentStats.total === 1 ? "1 étudiant" : 
                    `${studentStats.total} étudiants`}
                  </Typography>
                </Paper>

                <Paper sx={{ 
                  p: 1, 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  backdropFilter: 'blur(4px)',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <SchoolIcon sx={{ color: '#90caf9' }} />
                  <Typography variant="body2" sx={{ color: '#e3f2fd' }}>
                    {classData?.nbre_subclasses ? 
                      `${classData?.nbre_subclasses} groupe${classData?.nbre_subclasses > 1 ? 's' : ''}` : 
                      "Pas de groupes"}
                  </Typography>
                </Paper>

                <Paper sx={{ 
                  p: 1, 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  backdropFilter: 'blur(4px)',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <AssignmentIcon sx={{ color: '#90caf9' }} />
                  <Typography variant="body2" sx={{ color: '#e3f2fd' }}>
                    {studentStats.withCorrections === 0 ? "Aucun étudiant corrigé" : 
                    studentStats.withCorrections === 1 ? "1 étudiant avec corrections" : 
                    `${studentStats.withCorrections} étudiants avec corrections`}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        </Paper>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 3, pb: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <LoadingSpinner size="md" text="Chargement des données de classe" />
          </Box>
        ) : (
          <ClassStudentsManager 
            classId={classId || 0}
            classData={classData}
            embedded={true}
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
