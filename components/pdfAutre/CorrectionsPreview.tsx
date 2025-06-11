// CorrectionsPreview.tsx - Composant d'aperçu des corrections
import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Chip,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import { formatGrade } from './exportUtils/formatUtils';
import { ActivityAutre, CorrectionAutreEnriched, Student } from '@/lib/types';

interface CorrectionsPreviewProps {
  corrections: CorrectionAutreEnriched[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
  classesMap: Map<number | null, any>;
  loading: boolean;
}

const CorrectionsPreview: React.FC<CorrectionsPreviewProps> = ({
  corrections,
  getActivityById,
  getStudentById,
  classesMap,
  loading
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Gérer le changement de page dans la prévisualisation
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ p: 2 }} elevation={1}>
      <Typography variant="h6" gutterBottom>
        Aperçu ({corrections.length} corrections)
      </Typography>

      {loading ? (
        <Typography>Chargement...</Typography>
      ) : corrections.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Étudiant</TableCell>
                <TableCell>Classe</TableCell>
                <TableCell>Activité</TableCell>
                <TableCell>Points par partie</TableCell>
                <TableCell align="center">Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {corrections
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(correction => {
                  const activity = getActivityById(correction.activity_id);
                  const student = getStudentById(correction.student_id);
                  const className = classesMap.get(correction.class_id)?.name || 
                                  `Classe ${correction.class_id}`;
                  
                  return (
                    <TableRow key={correction.id}>
                      <TableCell>{student ? `${student.first_name} ${student.last_name}` : 'N/A'}</TableCell>
                      <TableCell>{className}</TableCell>
                      <TableCell>{activity?.name}</TableCell>
                      <TableCell>
                        {(() => {
                          if (!Array.isArray(correction.points_earned)) {
                            return 'N/A';
                          }
                          
                          // Calculer les parties désactivées
                          const disabledParts = correction.disabled_parts && Array.isArray(correction.disabled_parts) 
                            ? correction.disabled_parts 
                            : null;
                          
                          // Créer l'affichage des points avec indicateurs
                          const pointsDisplay = correction.points_earned.map((point, index) => {
                            if (disabledParts && disabledParts[index]) {
                              return `${point} (désactivée)`;
                            }
                            return point.toString();
                          }).join(' ; ');
                          
                          return `[${pointsDisplay}]`;
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={(() => {
                            // Utiliser percentage_grade en priorité
                            if (correction.percentage_grade !== null && correction.percentage_grade !== undefined) {
                              const normalizedGrade = (correction.percentage_grade / 100) * 20;
                              const originalGrade = correction.grade || 0;
                              const activity = getActivityById(correction.activity_id);
                              
                              // Calculer le barème original en tenant compte des parties désactivées
                              let originalTotal = 20; // Fallback à 20 si pas de barème défini
                              if (activity && activity.points) {
                                // Parser les parties désactivées
                                const disabledParts = correction.disabled_parts && Array.isArray(correction.disabled_parts) 
                                  ? correction.disabled_parts 
                                  : null;
                                
                                // Calculer le total en excluant les parties désactivées
                                originalTotal = activity.points.reduce((sum: number, points: number, index: number) => {
                                  // Exclure les parties désactivées du calcul du barème original
                                  if (disabledParts && disabledParts[index]) {
                                    return sum;
                                  }
                                  return sum + points;
                                }, 0);
                                
                                // Si toutes les parties sont désactivées, utiliser le fallback
                                if (originalTotal === 0) {
                                  originalTotal = 20;
                                }
                              }
                              
                              return `${formatGrade(normalizedGrade)} / 20 [${formatGrade(originalGrade)} / ${originalTotal}]`;
                            } else if (correction.grade !== null && correction.grade !== undefined) {
                              return `${formatGrade(correction.grade)} / 20`;
                            }
                            return 'Non noté';
                          })()}
                          color={(() => {
                            let gradeToDisplay = 0;
                            if (correction.percentage_grade !== null && correction.percentage_grade !== undefined) {
                              gradeToDisplay = (correction.percentage_grade / 100) * 20;
                            } else if (correction.grade !== null && correction.grade !== undefined) {
                              gradeToDisplay = correction.grade;
                            }
                            return gradeToDisplay >= 10 ? 'success' : 'error';
                          })()}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={corrections.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      ) : (
        <Alert severity="info">
          Aucune correction ne correspond aux critères sélectionnés
        </Alert>
      )}
    </Paper>
  );
};

export default CorrectionsPreview;