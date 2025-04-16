import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Slider, Typography, Chip, CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';

interface CorrectionTableViewProps {
  corrections: CorrectionAutreEnriched[];
  getActivityById: (id: number) => ActivityAutre | undefined;
  getStudentFullName: (id: number | null) => string;
  onDelete: (correction: CorrectionAutreEnriched) => Promise<void>;
  onUpdate: (correction: CorrectionAutreEnriched, updates: any) => Promise<void>;
  onToggleStatus: (correctionId: number, status: string) => Promise<void>;
}

export default function CorrectionTableView({
  corrections,
  getActivityById,
  getStudentFullName,
  onDelete,
  onUpdate,
  onToggleStatus
}: CorrectionTableViewProps) {
  const [editingRows, setEditingRows] = useState<Record<number, boolean>>({});
  const [editedPoints, setEditedPoints] = useState<Record<number, number[]>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const handleEditClick = (correction: CorrectionAutreEnriched) => {
    setEditingRows(prev => ({ ...prev, [correction.id]: true }));
    setEditedPoints(prev => ({ 
      ...prev, 
      [correction.id]: correction.points_earned || [] 
    }));
  };

  const handlePointsChange = (correctionId: number, partIndex: number, newValue: number) => {
    setEditedPoints(prev => {
      const points = [...(prev[correctionId] || [])];
      points[partIndex] = newValue;
      return { ...prev, [correctionId]: points };
    });
  };

  const handleSave = async (correction: CorrectionAutreEnriched) => {
    setSaving(prev => ({ ...prev, [correction.id]: true }));
    try {
      await onUpdate(correction, { points_earned: editedPoints[correction.id] });
      setEditingRows(prev => ({ ...prev, [correction.id]: false }));
    } finally {
      setSaving(prev => ({ ...prev, [correction.id]: false }));
    }
  };

  const renderPointsCell = (correction: CorrectionAutreEnriched, activity: ActivityAutre | undefined, partIndex: number) => {
    const isEditing = editingRows[correction.id];
    const points = isEditing ? editedPoints[correction.id] : correction.points_earned;
    const maxPoints = activity?.points?.[partIndex] || 0;
    const currentPoints = points?.[partIndex] || 0;

    if (isEditing) {
      return (
        <Box sx={{ width: '100%', maxWidth: 120, mx: 'auto' }}>
          <Slider
            value={currentPoints}
            onChange={(_, value) => handlePointsChange(correction.id, partIndex, value as number)}
            min={0}
            max={maxPoints}
            step={0.5}
            valueLabelDisplay="auto"
            size="small"
          />
          <Typography variant="caption" align="center" display="block">
            {currentPoints} / {maxPoints}
          </Typography>
        </Box>
      );
    }

    return `${currentPoints} / ${maxPoints}`;
  };

  const getGradeColor = (grade: number) => {
    if (grade < 5) return "error";
    if (grade < 10) return "warning";
    if (grade < 15) return "info";
    return "success";
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Prénom</TableCell>
            <TableCell>Activité</TableCell>
            {corrections[0] && getActivityById(corrections[0].activity_id)?.parts_names?.map((name, idx) => (
              <TableCell key={idx} align="center">{name}</TableCell>
            ))}
            <TableCell align="center">Total</TableCell>
            <TableCell align="center">Note finale</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {corrections.map((correction) => {
            const activity = getActivityById(correction.activity_id);
            const [lastName, firstName] = getStudentFullName(correction.student_id).split(' ');
            const isEditing = editingRows[correction.id];
            const isSaving = saving[correction.id];
            
            // Calculate total and grade
            const points = isEditing ? editedPoints[correction.id] : correction.points_earned || [];
            const totalPoints = points.reduce((sum, p) => sum + (p || 0), 0);
            const maxPoints = (activity?.points || []).reduce((sum, p) => sum + (p || 0), 0);
            const grade = maxPoints > 0 ? (totalPoints / maxPoints) * 20 : 0;
            const finalGrade = correction.penalty ? Math.max(5, grade - correction.penalty) : grade;

            return (
              <TableRow 
                key={correction.id}
                sx={{ 
                  backgroundColor: isEditing ? 'action.hover' : undefined 
                }}
              >
                <TableCell>{lastName}</TableCell>
                <TableCell>{firstName}</TableCell>
                <TableCell>{activity?.name}</TableCell>
                {activity?.parts_names?.map((_, idx) => (
                  <TableCell key={idx} align="center">
                    {renderPointsCell(correction, activity, idx)}
                  </TableCell>
                ))}
                <TableCell align="center">{totalPoints} / {maxPoints}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={`${finalGrade.toFixed(1)} / 20`}
                    color={getGradeColor(finalGrade)}
                    size="small"
                    variant={correction.status === 'DEACTIVATED' ? 'outlined' : 'filled'}
                  />
                </TableCell>
                <TableCell align="center">
                  {isEditing ? (
                    <Box display="flex" gap={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={() => handleSave(correction)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <CircularProgress size={20} />
                        ) : (
                          <SaveIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setEditingRows(prev => ({ ...prev, [correction.id]: false }))}
                        disabled={isSaving}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box display="flex" gap={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(correction)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(correction)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}