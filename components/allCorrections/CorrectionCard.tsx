import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  CardActions, 
  IconButton,
  Tooltip
} from '@mui/material';
import Link from 'next/link';
import { Correction } from '@/app/components/CorrectionsDataProvider';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import ShareIcon from '@mui/icons-material/Share';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ShareModal from '@/app/components/ShareModal';
import * as shareService from '@/lib/services/shareService';

interface CorrectionCardProps {
  correction: Correction;
  getGradeColor: (grade: number) => string;
  highlighted?: boolean;
  preloadedShareCode?: string; // Nouveau prop pour recevoir un code de partage pré-chargé
}



const CorrectionCard: React.FC<CorrectionCardProps> = ({ 
  correction, 
  getGradeColor,
  highlighted = false,
  preloadedShareCode,
}) => {
  // Utiliser useEffect pour s'assurer que shareCode est mis à jour quand preloadedShareCode change
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  console.log('CorrectionCard props:', { correction });
  // S'assurer que shareCode est mis à jour lorsque preloadedShareCode change
  useEffect(() => {
    if (preloadedShareCode) {
      setShareCode(preloadedShareCode);
    }
  }, [preloadedShareCode]);
  
  // Handle share modal events
  const handleOpenShareModal = () => {
    setShareModalOpen(true);
  };
  
  const handleCloseShareModal = () => {
    setShareModalOpen(false);
  };
  
  const handleShareSuccess = (code: string) => {
    setShareCode(code);
  };
  
  const formattedDate = correction.submission_date 
    ? format(
        new Date(correction.submission_date), 
        new Date(correction.submission_date).getHours() === 0 && new Date(correction.submission_date).getMinutes() === 0
          ? 'PPP'
          : 'PPP à HH:mm',
        { locale: fr }
      )
    : 'Date inconnue';
    
  // Calculate normalized grade (0-20)
  // Vérifier s'il y a une pénalité à appliquer
  const hasPenalty = correction.penality !== undefined && correction.penality !== null;
  
  // Calculer la note avec la pénalité si elle existe
  const gradeWithPenalty = hasPenalty && correction.penality !== undefined && correction.penality !== null
    ? Math.max(0, correction.grade - correction.penality) 
    : correction.grade;
    
  // Normaliser la note sur 20
  const normalizedGrade = correction.experimental_points && correction.theoretical_points
    ? (gradeWithPenalty / (correction.theoretical_points + correction.experimental_points) * 20)
    : gradeWithPenalty;
  
  const gradeColor = getGradeColor(normalizedGrade);


  return (
    <Card 
      elevation={highlighted ? 2 : 1} 
      sx={{ 
      padding: 1,
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative',
      overflow: 'visible',
        '&:hover': {
          boxShadow: 3,
        },
        border: highlighted ? 4 : 0,
        borderColor: highlighted ? 'secondary.main' : 'transparent',
      }}
    >

      
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          color: 'text.primary',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
           bgcolor: `${gradeColor}.main`, 
           p: 1, borderRadius: 2, 
           color: 'white' }}>
          <Typography variant="h5" component="div" fontWeight="bold">
        {gradeWithPenalty.toFixed(1)}
          </Typography>
        <Typography variant="body2" sx={{ ml: 1, opacity: 0.9 }}>
        / {correction.experimental_points !== undefined && correction.theoretical_points !== undefined 
          ? (correction.experimental_points + correction.theoretical_points).toFixed(1)
          : '-'}
        </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          flexGrow: 1,
          flexDirection: 'column',
        }}
          >
        <Typography variant="caption" sx={{ fontWeight: 500, opacity: 0.9 }}>
          {formattedDate}
        </Typography>
        {highlighted && (
        <Chip
          label="Nouveau"
          color="secondary"
          size="small"
          sx={{ 
            fontWeight: 'bold',
            zIndex: 1,
            maxWidth: 'auto',
            mt: 0.5
          }}
        />
            )}
            </Box>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p:0, pt:1 }}>
        <Typography variant="h6" gutterBottom noWrap title={correction.activity_name}>
          {correction.activity_name || 'Activité sans nom'}
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column' }}>
          {correction.student_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" noWrap title={correction.student_name}>
                {correction.student_name}
              </Typography>
            </Box>
          )}
          
          {correction.class_name && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" noWrap title={correction.class_name}>
                {correction.class_name}
                {correction.sub_class && ` (Groupe ${correction.sub_class})`}
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Display experimental vs theoretical grades if available */}
        {(correction.experimental_points !== undefined || correction.theoretical_points !== undefined) && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {correction.penality !== undefined && correction.penality !== null && correction.penality > 0 && (
              <Chip 
                size="small" 
                label={
                  <>
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                  Pénalité :&nbsp;
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.primary' }}>
                    {correction.penality.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                  &nbsp;pts
                </Typography>
                </>
                } 
                color="error"
                variant="outlined"
              />
            )}
            
            {correction.experimental_points !== undefined && (
              <Chip 
                size="small" 
                label={
                  <>
                  <Typography variant="caption" sx={{ color: 'primary.dark' }}>
                     Exp :&nbsp;
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.primary' }}>
                    {correction.experimental_points_earned.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'primary.dark' }}>
                  &nbsp;/ {correction.experimental_points.toFixed(1)}
                </Typography>
                </>
                }
                color="info"
                variant="outlined"
              />
            )}
            {correction.theoretical_points !== undefined && (
              <Chip 
                size="small" 
                label={
                  <>
                  <Typography variant="caption" sx={{ color: 'secondary.dark' }}>
                  Théo :&nbsp;
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.primary' }}>
                    {correction.theoretical_points_earned.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'secondary.dark' }}>
                  &nbsp;/ {correction.theoretical_points.toFixed(1)}
                </Typography>
                </>
                } 
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ p: 0, justifyContent: 'flex-end' }}>
        {shareCode ? (
          <Tooltip title="Voir le feedback">
            <IconButton 
              component={Link} 
              href={`/feedback/${shareCode}`}
              color="primary"
              size="medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <VisibilityIcon fontSize='medium' />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Partager la correction">
            <IconButton 
              onClick={handleOpenShareModal}
              color="primary"
              size="medium"
            >
              <ShareIcon fontSize='medium' />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Modifier">
          <IconButton 
            component={Link} 
            href={`/corrections/${correction.id}`}
            color="secondary"
            size="medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            <EditIcon fontSize='medium' />
          </IconButton>
        </Tooltip>
      </CardActions>
      
      {/* ShareModal component */}
      <ShareModal 
        open={shareModalOpen}
        onClose={handleCloseShareModal}
        correctionId={correction.id.toString()}
        onShareSuccess={handleShareSuccess}
      />
    </Card>
  );
};

export default CorrectionCard;