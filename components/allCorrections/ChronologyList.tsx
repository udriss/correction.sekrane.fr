import React, { useState, useEffect } from 'react';
import {
  Box, Alert, Paper, Typography, Button, Card, CardContent, Chip, Divider, IconButton, Tooltip
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineContent, TimelineSeparator, 
  TimelineDot, TimelineConnector, TimelineOppositeContent
} from '@mui/lab';

import CancelIcon from '@mui/icons-material/Cancel';
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';
import dayjs from 'dayjs';
import 'dayjs/locale/fr'; // Importer explicitement la locale française
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { alpha } from '@mui/material/styles';
import { getBatchShareCodes } from '@/lib/services/shareService';
import ShareModal from '@/app/components/ShareModal';

interface ChronologyListProps {
  filteredCorrections: ProviderCorrection[];
  error: string | null;
  activeFilters: string[];
  handleClearAllFilters: () => void;
  getGradeColor: (grade: number) => string;
  highlightedIds?: string[];
  recentFilter?: boolean; // Nouvel ajout pour supporter le filtre recent
}

const ChronologyList: React.FC<ChronologyListProps> = ({
  filteredCorrections,
  error,
  activeFilters,
  handleClearAllFilters,
  getGradeColor,
  highlightedIds = [],
  recentFilter = false // Valeur par défaut false
}) => {
  const [shareCodesMap, setShareCodesMap] = useState<Map<string, string>>(new Map());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string | null>(null);
  const [shareCodes, setShareCodes] = useState<Record<string, string>>({});
  
  // Chargement en masse des codes de partage quand les corrections changent
  useEffect(() => {
    const loadShareCodes = async () => {
      if (filteredCorrections.length > 0) {
        const correctionIds = filteredCorrections.map(c => c.id.toString());
        const shareCodesMap = await getBatchShareCodes(correctionIds);
        setShareCodesMap(shareCodesMap);
      } else {
        setShareCodesMap(new Map());
      }
    };
    
    loadShareCodes();
  }, [filteredCorrections]);
  
  // Gérer l'ouverture du modal de partage
  const handleOpenShareModal = (correctionId: string) => {
    setSelectedCorrectionId(correctionId);
    setShareModalOpen(true);
  };
  
  // Gérer la fermeture du modal de partage
  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedCorrectionId(null);
  };
  
  // Gérer le succès du partage
  const handleShareSuccess = (code: string) => {
    if (selectedCorrectionId) {
      setShareCodes({
        ...shareCodes,
        [selectedCorrectionId]: code
      });
      
      // Également mettre à jour le Map pour la cohérence
      const newMap = new Map(shareCodesMap);
      newMap.set(selectedCorrectionId, code);
      setShareCodesMap(newMap);
    }
  };

  // Trier les corrections par date (plus récent en premier)
  const sortedCorrections = [...filteredCorrections].sort((a, b) => 
    new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
  );

  // Grouper par mois/année pour une meilleure organisation
  const groupedByMonth: Record<string, ProviderCorrection[]> = {};
  
  sortedCorrections.forEach(correction => {
    const date = dayjs(correction.submission_date);
    const monthKey = date.format('YYYY-MM');
    const monthDisplay = date.format('MMMM YYYY');
    
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }
    
    groupedByMonth[monthKey].push(correction);
  });

  // Fonction pour déterminer si une correction doit être mise en évidence
  const shouldHighlight = (correction: ProviderCorrection) => {
    // Si l'ID est explicitement dans la liste des IDs à mettre en évidence
    if (highlightedIds.includes(correction.id.toString())) {
      return true;
    }
    
    // Si le filtre "recent" est actif, vérifier si c'est une correction récente (24h)
    if (recentFilter) {
      const recentDate = dayjs().subtract(24, 'hour');
      const correctionDate = dayjs(correction.created_at || correction.submission_date);
      return correctionDate.isAfter(recentDate);
    }
    
    return false;
  };

  return (
    <Box>
      {error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            p: 0,
            border: 1,
            borderColor: 'error.main',
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {error}
        </Alert>
      ) : filteredCorrections.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Aucune correction trouvée</Typography>
          <Typography variant="body2" color="text.secondary">
            Ajustez vos filtres ou ajoutez des corrections
          </Typography>
          {activeFilters.length > 0 && (
            <Button 
              variant="outlined" 
              onClick={handleClearAllFilters} 
              startIcon={<CancelIcon />}
              sx={{ mt: 2 }}
            >
              Effacer tous les filtres
            </Button>
          )}
        </Paper>
      ) : (
        <Box>
          {Object.entries(groupedByMonth).map(([monthKey, monthCorrections]) => (
            <Box key={monthKey} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                {dayjs(monthKey).locale('fr').format('MMMM YYYY')}
              </Typography>
              <Timeline position="alternate" sx={{ p: 0 }}>
                {monthCorrections.map((correction, index) => {
                  // Vérifier si cette correction doit être mise en évidence
                  const isHighlighted = shouldHighlight(correction);
                  // Déterminer si c'est une carte à gauche ou à droite (pair = gauche, impair = droite)
                  const isRightSide = index % 2 === 1;
                  
                  return (
                    <TimelineItem key={correction.id}>
                      <TimelineOppositeContent sx={{ color: 'text.secondary' }}>
                        {dayjs(correction.submission_date).locale('fr').format('DD MMMM YYYY')}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getGradeColor(correction.grade) as "success" | "error" | "info" | "warning" | "primary" | "secondary" | "grey" | undefined}>
                          <AssignmentIcon />
                        </TimelineDot>
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            mt: 1, 
                            mb: 3,
                            // Styles spécifiques pour les corrections mises en évidence
                            border: isHighlighted ? '2px solid' : '1px solid',
                            borderColor: isHighlighted ? 'secondary.main' : 'divider',
                            boxShadow: isHighlighted ? (theme) => `0 0 15px ${alpha(theme.palette.secondary.main, 0.5)}` : 'none',
                            position: 'relative'
                          }}
                        >
                          {/* Badge "Nouveau" pour les corrections mises en évidence - position adaptée selon le côté */}
                          {isHighlighted && (
                            <Chip
                              label="Nouveau"
                              color="secondary"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 10,
                                // Si la carte est à droite, positionner le badge à gauche et vice versa
                                right: isRightSide ? 'auto' : 10,
                                left: isRightSide ? 10 : 'auto',
                                zIndex: 1,
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                          
                          <CardContent>
                            <Link href={`/corrections/${correction.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <Typography variant="h6" component="div">
                                {correction.activity_name}
                              </Typography>
                            </Link>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {correction.student_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <SchoolIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {correction.class_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                              <Chip 
                                size="small" 
                                color={getGradeColor(correction.grade) as "success" | "error" | "info" | "warning" | "primary" | "secondary" | "default"} 
                                label={`${correction.grade} / 20`}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {/* Bouton de partage ou de visualisation selon la disponibilité du code */}
                                {shareCodesMap.get(correction.id.toString()) ? (
                                  <Tooltip title="Voir le feedback">
                                    <IconButton 
                                      component={Link} 
                                      href={`/feedback/${shareCodesMap.get(correction.id.toString())}`}
                                      color="primary"
                                      size="small"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Partager la correction">
                                    <IconButton 
                                      onClick={() => handleOpenShareModal(correction.id.toString())}
                                      color="primary"
                                      size="small"
                                    >
                                      <ShareIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Modifier">
                                  <IconButton 
                                    component={Link} 
                                    href={`/corrections/${correction.id}`}
                                    color="secondary"
                                    size="small"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Corrigé le {dayjs(correction.updated_at).locale('fr').format('DD/MM/YYYY à HH:mm')}
                            </Typography>
                          </CardContent>
                        </Card>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ChronologyList;
