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
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ 
  correction, 
  getGradeColor,
  highlighted = false
}) => {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Check for existing share code on component mount
  useEffect(() => {
    const checkExistingShareCode = async () => {
      try {
        const response = await shareService.getExistingShareCode(correction.id.toString());
        if (response.exists && response.code) {
          setShareCode(response.code);
        }
      } catch (error) {
        console.error('Error checking share code:', error);
      }
    };
    
    checkExistingShareCode();
  }, [correction.id]);
  
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
    ? format(new Date(correction.submission_date), 'PPP', { locale: fr })
    : 'Date inconnue';
    
  // Calculate normalized grade (0-20)
  const normalizedGrade = correction.experimental_points && correction.theoretical_points
    ? (correction.grade / (correction.theoretical_points + correction.experimental_points) * 20)
    : correction.grade;
  
  const gradeColor = getGradeColor(normalizedGrade);

  return (
    <Card 
      elevation={highlighted ? 2 : 1} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          boxShadow: 3,
        },
        border: highlighted ? 2 : 20,
        borderColor: highlighted ? 'success.main' : 'transparent',
      }}
    >
      {highlighted && (
        <Chip
          label="Nouvelle correction"
          color="success"
          size="small"
          sx={{ 
            position: 'absolute', 
            top: -12, 
            right: 16, 
            fontWeight: 'bold',
            zIndex: 1
          }}
        />
      )}
      
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          bgcolor: `${gradeColor}.main`,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {correction.grade.toFixed(1)}
          </Typography>
            <Typography variant="body2" sx={{ ml: 1, opacity: 0.9 }}>
            / {correction.experimental_points !== undefined && correction.theoretical_points !== undefined 
              ? (correction.experimental_points + correction.theoretical_points).toFixed(1)
              : '-'}
            </Typography>
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 500, opacity: 0.9 }}>
          {formattedDate}
        </Typography>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Typography variant="h6" gutterBottom noWrap title={correction.activity_name}>
          {correction.activity_name || 'Activité sans nom'}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
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
            {correction.experimental_points !== undefined && (
              <Chip 
                size="small" 
                label={`Exp: ${correction.experimental_points.toFixed(1)}`} 
                color="info"
                variant="outlined"
              />
            )}
            {correction.theoretical_points !== undefined && (
              <Chip 
                size="small" 
                label={`Theo: ${correction.theoretical_points.toFixed(1)}`} 
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
        {shareCode ? (
          <Tooltip title="Voir la correction">
            <IconButton 
              component={Link} 
              href={`/feedback/${shareCode}`}
              color="primary"
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Partager la correction">
            <IconButton 
              onClick={handleOpenShareModal}
              color="primary"
              size="small"
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Modifier">
          <IconButton 
            component={Link} 
            href={`/corrections/${correction.id}`}
            color="secondary"
            size="small"
          >
            <EditIcon />
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