import React, { useState } from 'react';
import { 
  Typography, 
  Paper, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip, 
  Alert,
  TablePagination
} from '@mui/material';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { getStatusLabel } from './types';

interface CorrectionsPreviewProps {
  corrections: ProviderCorrection[];
  getActivityById: (activityId: number) => any;
  getStudentById: (studentId: number | null) => any;
}

const CorrectionsPreview: React.FC<CorrectionsPreviewProps> = ({
  corrections,
  getActivityById,
  getStudentById
}) => {
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Gestionnaires d'événements pour la pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculer les corrections à afficher pour la page actuelle
  const displayedCorrections = corrections.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ p: 2 }} elevation={1}>
      <Typography variant="h6" gutterBottom>
        Aperçu des corrections ({corrections.length})
      </Typography>
      
      {corrections.length > 0 ? (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Activité</TableCell>
                  <TableCell align="right">Note Exp.</TableCell>
                  <TableCell align="right">Note Théo.</TableCell>
                  <TableCell align="center">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedCorrections.map(correction => {
                  const activity = getActivityById(correction.activity_id);
                  const student = getStudentById(correction.student_id);
                  return (
                    <TableRow key={correction.id}>
                      <TableCell>{student?.first_name} {student?.last_name}</TableCell>
                      <TableCell>{activity?.name}</TableCell>
                      <TableCell align="right">
                        {correction.experimental_points_earned} / {activity?.experimental_points}
                      </TableCell>
                      <TableCell align="right">
                        {correction.theoretical_points_earned} / {activity?.theoretical_points}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={getStatusLabel(correction)}
                          variant={correction.status === 'DEACTIVATED' || (correction.status === undefined && correction.active === 0) ? "outlined" : "filled"}
                          sx={correction.status === 'DEACTIVATED' || (correction.status === undefined && correction.active === 0) ? { 
                            borderStyle: 'dashed', 
                            opacity: 0.5,
                            color: 'text.disabled' 
                          } : 
                          {
                            fontWeight: 700,
                            color: theme => theme.palette.text.primary,
                            backgroundColor:
                              (correction.grade || 0) < 8 ? theme => theme.palette.error.light :
                              (correction.grade || 0) < 10 ? theme => theme.palette.warning.light :
                              (correction.grade || 0) < 12 ? theme => theme.palette.primary.light :
                              (correction.grade || 0) < 16 ? theme => theme.palette.info.light :
                              theme => theme.palette.success.light, 
                          }
                        }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {displayedCorrections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucune correction à afficher
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={corrections.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </>
      ) : (
        <Alert severity="info">
          Aucune correction correspondant aux critères sélectionnés
        </Alert>
      )}
    </Paper>
  );
};

export default CorrectionsPreview;