import React from 'react';
import Link from 'next/link';
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  Slider,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GradeIcon from '@mui/icons-material/Grade';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { CorrectionWithShareCode } from '@/lib/types';

type Student = {
  id: number;
  first_name: string;
  last_name: string;
};

type CorrectionsListProps = {
  corrections: Array<CorrectionWithShareCode>;
  updatedCorrections: Array<CorrectionWithShareCode>;
  activity: {
    experimental_points: number;
    theoretical_points: number;
  } | null;
  editMode: boolean;
  savingGrades: boolean;
  setEditMode: (mode: boolean) => void;
  handleEditCorrections: () => void;
  handleCancelEditCorrections: () => void;
  handleSaveGrades: () => void;
  handleStudentNameChange: (index: number, studentId: number | null) => void;
  handleExperimentalGradeChange: (index: number, value: number | number[]) => void;
  handleTheoreticalGradeChange: (index: number, value: number | number[]) => void;
  handleOpenShareModal: (correctionId: string) => void;
  handleRemoveFromGroup: (correctionId: number) => void;
  handleDeleteCorrection: (correctionId: number) => void;
  setAddCorrectionsModalOpen: (open: boolean) => void;
  calculateAverage: () => string;
  formatNumber: (value: number) => string;
  getGradeColor: (grade: number, total: number) => "success" | "info" | "warning" | "error";
  getStudentFullName?: (studentId: number | null) => string; // Ajouter cette propriété
  students?: Student[];
};



const CorrectionsList: React.FC<CorrectionsListProps> = ({
  corrections,
  updatedCorrections,
  activity,
  editMode,
  savingGrades,
  setEditMode,
  handleEditCorrections,
  handleCancelEditCorrections,
  handleSaveGrades,
  handleStudentNameChange,
  handleExperimentalGradeChange,
  handleTheoreticalGradeChange,
  handleOpenShareModal,
  handleRemoveFromGroup,
  handleDeleteCorrection,
  setAddCorrectionsModalOpen,
  calculateAverage,
  formatNumber,
  getGradeColor,
  getStudentFullName = (studentId) => "Sans nom", // Valeur par défaut
  students = []
}) => {
  
  // Classes de style pour l'alternance des lignes du tableau
  const getRowClass = (index: number) => {
    return index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50';
  };
  
  const totalPossiblePoints = (activity?.experimental_points || 5) + (activity?.theoretical_points || 15);
  
  return (
    <Box>
      <Box sx={{ 
        bgcolor: 'seondary', 
        color: 'black', 
        px: 1, 
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" fontWeight="bold">
          Liste des corrections
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {corrections.length > 0 && (
            <Chip 
              label={`Moyenne: ${calculateAverage()} / ${activity ? activity.experimental_points + activity.theoretical_points : 20}`} 
              color="default"
              sx={{ bgcolor: 'white', fontWeight: 'bold', mr: 1 }}
            />
          )}

          <Box sx={{ width: '200px', display: 'flex', justifyContent: 'space-around' }}>
            {editMode ? (
              <>
                <Button 
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={handleSaveGrades}
                  disabled={savingGrades}
                  startIcon={savingGrades ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {savingGrades ? 'Enregistrement ...' : <SaveIcon />}
                </Button>
                <Button 
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleCancelEditCorrections}
                  disabled={savingGrades}
                >
                  <CloseIcon />
                </Button>
              </>
            ) : (
              <Button 
                size="small"
                variant="outlined"
                color="info"
                onClick={handleEditCorrections}
                startIcon={<GradeIcon />}
                disabled={corrections.length === 0}
                sx={{ width: '200px' }}
              >
                Éditer les notes
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      
      {corrections.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Aucune correction dans ce groupe
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddCorrectionsModalOpen(true)}
            startIcon={<PersonAddAltIcon />}
          >
            Ajouter des corrections
          </Button>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Étudiant</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Note exp.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Note théo.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '120px' }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(editMode ? updatedCorrections : corrections).map((correction, index) => {
                const expGrade = correction.experimental_points_earned || 0;
                const theoGrade = correction.theoretical_points_earned || 0;
                const totalGrade = expGrade + theoGrade;
                const totalPoints = (activity?.experimental_points || 5) + (activity?.theoretical_points || 15);
                const gradeColor = getGradeColor(totalGrade, totalPoints);
                
                return (
                  <TableRow key={correction.id} className={getRowClass(index)}>
                    <TableCell>
                      {editMode ? (
                        <StudentSelector
                          students={students || []}
                          value={correction.student_id}
                          onChange={(newStudentId) => handleStudentNameChange(index, newStudentId || null)}
                          disabled={false}
                        />
                      ) : (
                        <Typography fontWeight="medium">
                          {getStudentFullName(correction.student_id)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {editMode ? (
                        <Box sx={{ width: '100%', px: 1 }}>
                          <Slider
                            value={expGrade}
                            onChange={(_, value) => handleExperimentalGradeChange(index, value)}
                            min={0}
                            max={activity?.experimental_points || 5}
                            step={0.5}
                            valueLabelDisplay="auto"
                            size="small"
                          />
                          <Typography variant="caption" display="block" textAlign="center">
                            {formatNumber(expGrade)} / {formatNumber(activity?.experimental_points || 5)}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip 
                          size="small" 
                          label={`${formatNumber(expGrade)} / ${formatNumber(activity?.experimental_points || 5)}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {editMode ? (
                        <Box sx={{ width: '100%', px: 1 }}>
                          <Slider
                            value={theoGrade}
                            onChange={(_, value) => handleTheoreticalGradeChange(index, value)}
                            min={0}
                            max={activity?.theoretical_points || 15}
                            step={0.5}
                            valueLabelDisplay="auto"
                            size="small"
                          />
                          <Typography variant="caption" display="block" textAlign="center">
                            {formatNumber(theoGrade)} / {formatNumber(activity?.theoretical_points || 15)}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip 
                          size="small" 
                          label={`${formatNumber(theoGrade)} / ${formatNumber(activity?.theoretical_points || 15)}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${formatNumber(totalGrade)} / ${formatNumber(totalPoints)}`}
                        color={gradeColor}
                        variant='outlined'
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Voir la correction">
                          <IconButton
                            size="small"
                            color="primary"
                            target="_blank"
                            rel="noopener noreferrer"
                            component={Link}
                            href={`/corrections/${correction.id}`}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Partager">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenShareModal(String(correction.id))}
                          >
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Afficher l'icône de lien externe si un code de partage existe */}
                        {correction.shareCode && (
                          <Tooltip title="Voir le feedback partagé">
                            <IconButton
                              size="small"
                              component={Link}
                              href={`/feedback/${correction.shareCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: 'primary.main' }}
                            >
                              <OpenInNewIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Bouton pour retirer du groupe */}
                        <Tooltip title="Retirer du groupe">
                          <IconButton 
                            onClick={() => handleRemoveFromGroup(correction.id)} 
                            color="warning" 
                            size="small"
                          >
                            <RemoveCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>
                        {/* Bouton pour supprimer définitivement */}
                        <Tooltip title="Supprimer définitivement">
                          <IconButton 
                            onClick={() => handleDeleteCorrection(correction.id)} 
                            color="error" 
                            size="small"
                          >
                            <DeleteForeverIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// Composant StudentSelector intégré directement pour simplifier
interface StudentSelectorProps {
  students: Student[];
  value: number | null;
  onChange: (studentId: number | null) => void;
  disabled: boolean;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({ 
  students, 
  value, 
  onChange, 
  disabled 
}) => {
  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel>Étudiant</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        label="Étudiant"
      >
        <MenuItem value="">
          <em>Aucun</em>
        </MenuItem>
        {students.map((student) => (
          <MenuItem key={student.id} value={student.id}>
            {student.first_name} {student.last_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CorrectionsList;
