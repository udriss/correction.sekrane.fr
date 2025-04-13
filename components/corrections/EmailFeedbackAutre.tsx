import React, { useState } from 'react';
import { 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Paper
} from '@mui/material';
import { EmailOutlined } from '@mui/icons-material';
import { Student } from '@/lib/types';

interface EmailFeedbackAutreProps {
  correctionId: string;
  student: Student | null;
  points_earned?: number[];
  activityName?: string;
  activity_parts_names?: string[];
  activity_points?: number[];
  penalty?: string;
}

export default function EmailFeedbackAutre({
  correctionId,
  student,
  points_earned = [],
  activityName = '',
  activity_parts_names = [],
  activity_points = [],
  penalty
}: EmailFeedbackAutreProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Calculate total points
  const totalPointsEarned = points_earned.reduce((sum, points) => sum + points, 0);
  const totalPossiblePoints = activity_points.reduce((sum, points) => sum + points, 0);
  
  // Calculate percentage and final grade
  const percentage = totalPossiblePoints > 0 ? (totalPointsEarned / totalPossiblePoints) * 100 : 0;
  const finalGrade = penalty ? Math.max(0, totalPointsEarned - parseFloat(penalty)) : totalPointsEarned;

  const generateEmailContent = () => {
    // Utiliser la formule de salutation appropriée selon le genre
    let salutation = 'Bonjour';
    if (student) {
      if (student.gender === 'M') salutation = 'Cher';
      else if (student.gender === 'F') salutation = 'Chère';
    }
    
    const studentName = student 
      ? `${salutation} ${student.first_name} ${student.last_name}`
      : 'Bonjour,';

    let content = `${studentName},\n\n`;
    content += `Voici le détail de votre correction pour l'activité "${activityName}" :\n\n`;

    // Add details for each part
    activity_parts_names.forEach((partName, index) => {
      const pointsEarned = points_earned[index] || 0;
      const maxPoints = activity_points[index] || 0;
      content += `${partName} : ${pointsEarned}/${maxPoints} points\n`;
    });

    content += `\nTotal : ${totalPointsEarned}/${totalPossiblePoints} points`;
    
    if (penalty && parseFloat(penalty) > 0) {
      content += `\nPénalité : -${penalty} points`;
      content += `\nNote finale : ${finalGrade}/${totalPossiblePoints} points`;
    }

    content += `\n\nPourcentage de réussite : ${percentage.toFixed(1)}%`;

    content += '\n\nCordialement,\nVotre enseignant';

    return content;
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<EmailOutlined />}
        onClick={handleOpen}
        size="small"
      >
        Aperçu email
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Aperçu de l'email pour {student?.first_name} {student?.last_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Email de l'étudiant : {student?.email || 'Non renseigné'}
            </Typography>
          </Box>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2,
              whiteSpace: 'pre-line',
              fontFamily: 'monospace',
              bgcolor: 'grey.50'
            }}
          >
            {generateEmailContent()}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}