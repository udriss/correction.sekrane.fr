'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Correction {
  id: number;
  student_name: string;
  experimental_grade: number;
  experimental_points: number;
  theoretical_grade: number;
  theoretical_points: number;
}

interface Group {
  id: number;
  name: string;
  activity_name: string;
  created_at: string;
  description?: string;
}

export default function CorrectionGroupDetailPageFromCorrection() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchGroupDetails() {
      if (!groupId) return;

      try {
        // Récupérer les infos du groupe
        const groupResponse = await fetch(`/api/correction-groups/${groupId}`);

        if (!groupResponse.ok) {
          throw new Error('Erreur lors de la récupération du groupe');
        }

        const groupData = await groupResponse.json();
        setGroup(groupData);

        // Récupérer les corrections associées avec toutes les données nécessaires
        const correctionsResponse = await fetch(`/api/correction-groups/${groupId}/corrections`);

        if (!correctionsResponse.ok) {
          throw new Error('Erreur lors de la récupération des corrections');
        }

        const correctionsData = await correctionsResponse.json();
        
        // S'assurer que les notes sont des nombres valides
        const validatedCorrections = correctionsData.map((correction: any) => ({
          ...correction,
          experimental_grade: parseFloat(correction.experimental_grade) || 0,
          theoretical_grade: parseFloat(correction.theoretical_grade) || 0,
          experimental_points: parseFloat(correction.experimental_points) || 0,
          theoretical_points: parseFloat(correction.theoretical_points) || 0
        }));
        
        setCorrections(validatedCorrections);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchGroupDetails();
  }, [groupId]);

  // Calculer la note finale selon la règle demandée
  const calculateFinalGrade = (grade: number, penalty: number = 0): number => {
    if (grade < 5) {
      // Si la note est inférieure à 5, on garde la note originale
      return grade;
    } else {
      // Sinon, on prend le maximum entre (note-pénalité) et 5
      return Math.max(grade - penalty, 5);
    }
  };

  // Obtenir la note finale à afficher
  const getFinalGrade = (correction: any) => {
    // Si final_grade est déjà défini dans la correction, l'utiliser
    if (correction.final_grade !== undefined && correction.final_grade !== null) {
      return typeof correction.final_grade === 'number' 
        ? correction.final_grade 
        : parseFloat(String(correction.final_grade));
    }
    
    // Sinon, calculer selon la règle
    const grade = (correction.experimental_grade || 0) + (correction.theoretical_grade || 0);
    const penalty = correction.penalty || 0;
    
    return calculateFinalGrade(grade, penalty);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={() => router.push('/corrections/groups')} className="mr-2">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Groupe: {group?.name || 'Détails du groupe'}
        </Typography>
      </Box>

      {error && (
        <Paper className="p-4 mb-4 bg-red-50">
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {group && (
        <>
          <Paper className="p-4 mb-6">
            <Typography variant="h6" className="mb-2">Informations du groupe</Typography>
            <Divider className="mb-3" />
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="subtitle2" className="text-gray-600">Activité</Typography>
                <Typography variant="body1">{group.activity_name || 'N/A'}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" className="text-gray-600">Date de création</Typography>
                <Typography variant="body1">
                  {new Date(group.created_at).toLocaleDateString()}
                </Typography>
              </div>
              {group.description && (
                <div className="md:col-span-2">
                  <Typography variant="subtitle2" className="text-gray-600">Description</Typography>
                  <Typography variant="body1">{group.description}</Typography>
                </div>
              )}
            </Box>
          </Paper>

          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              Corrections ({corrections.length})
            </Typography>

            {corrections.length === 0 ? (
              <Typography className="text-center py-4">Aucune correction dans ce groupe</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Étudiant</TableCell>
                      <TableCell>Note exp.</TableCell>
                      <TableCell>Note théo.</TableCell>
                      <TableCell>Note totale</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {corrections.map((correction) => (
                      <TableRow key={correction.id}>
                        <TableCell>{correction.student_name}</TableCell>
                        <TableCell>
                          {typeof correction.experimental_grade === 'number' 
                            ? correction.experimental_grade.toFixed(1) 
                            : '0.0'} / {correction.experimental_points || 0}
                        </TableCell>
                        <TableCell>
                          {typeof correction.theoretical_grade === 'number' 
                            ? correction.theoretical_grade.toFixed(1) 
                            : '0.0'} / {correction.theoretical_points || 0}
                        </TableCell>
                        <TableCell>
                          <strong>
                            {getFinalGrade(correction).toFixed(1)} /
                            {(correction.experimental_points || 0) + (correction.theoretical_points || 0)}
                          </strong>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/corrections/${correction.id}`)}
                            title="Voir la correction"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </div>
  );
}