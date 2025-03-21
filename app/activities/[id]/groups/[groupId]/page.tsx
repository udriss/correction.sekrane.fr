'use client';


import { generateQRCodePDF } from '@/utils/qrGeneratorPDF';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  Divider,
  Tooltip,
  Chip,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  Slider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Domain as DomainIcon,
  Groups as GroupsIcon,
  CalendarToday as CalendarTodayIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  Download as DownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Grade as GradeIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import LoadingSpinner from '@/components/LoadingSpinner';
import ShareModal from '@/app/components/ShareModal';
import * as shareService from '@/lib/services/shareService';

interface Correction {
  id: number;
  activity_id: number;
  student_name?: string;
  experimental_points_earned?: number;
  experimental_points?: number;
  theoretical_points_earned?: number;
  theoretical_points?: number;
  grade?: number;
  shareCode?: string;
}

interface Group {
  id: number;
  name: string;
  activity_name: string;
  activity_id: number;
  created_at: string;
  description?: string;
}

export default function CorrectionGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;
  const activityId = params?.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [updatedCorrections, setUpdatedCorrections] = useState<Correction[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [correctionToDelete, setCorrectionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  const [generatePdfLoading, setGeneratePdfLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

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
        setEditedName(groupData.name || '');
        setEditedDescription(groupData.description || '');

        // Récupérer les corrections associées avec toutes les données nécessaires
        const correctionsResponse = await fetch(`/api/correction-groups/${groupId}/corrections`);

        if (!correctionsResponse.ok) {
          throw new Error('Erreur lors de la récupération des corrections');
        }

        const correctionsData = await correctionsResponse.json();
        
        // S'assurer que les notes sont des nombres valides
        const validatedCorrections = correctionsData.map((correction: any) => ({
          ...correction,
          student_name: correction.student_name || "",
          experimental_points_earned: parseFloat(correction.experimental_points_earned) || 0,
          theoretical_points_earned: parseFloat(correction.theoretical_points_earned) || 0,
          experimental_points: parseFloat(correction.experimental_points) || 0,
          theoretical_points: parseFloat(correction.theoretical_points) || 0,
          grade: parseFloat(correction.grade) || 0
        }));
        
        setCorrections(validatedCorrections);
        setUpdatedCorrections(JSON.parse(JSON.stringify(validatedCorrections)));
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchGroupDetails();
  }, [groupId]);

  // Ajouter un effet pour récupérer les codes de partage existants au chargement
  useEffect(() => {
    async function fetchShareCodes() {
      if (!corrections || corrections.length === 0) return;
      
      try {
        const updatedCorrections = [...corrections];
        let foundShareCodes = 0;
        
        for (let i = 0; i < corrections.length; i++) {
          const correction = corrections[i];
          
          // Vérifier s'il existe un code de partage
          const existingShareCheck = await shareService.getExistingShareCode(String(correction.id));
          
          if (existingShareCheck.exists && existingShareCheck.code) {
            updatedCorrections[i].shareCode = existingShareCheck.code;
            foundShareCodes++;
          }
        }
        
        if (foundShareCodes > 0) {
          console.log(`Trouvé ${foundShareCodes} codes de partage existants`);
          setCorrections(updatedCorrections);
          setUpdatedCorrections(JSON.parse(JSON.stringify(updatedCorrections)));
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des codes de partage:', err);
      }
    }

    if (corrections.length > 0) {
      fetchShareCodes();
    }
  }, [corrections.length]);

  const handleDeleteCorrection = (correctionId: number) => {
    setCorrectionToDelete(correctionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (correctionToDelete === null) return;
    
    setIsDeleting(true);
    try {
      // Supprimer seulement l'association, pas la correction elle-même
      const response = await fetch(`/api/correction-groups/${groupId}/corrections/${correctionToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      // Mettre à jour la liste des corrections
      setCorrections(corrections.filter(c => c.id !== correctionToDelete));
      setUpdatedCorrections(updatedCorrections.filter(c => c.id !== correctionToDelete));
      
      setNotification({
        open: true,
        message: 'Correction supprimée du groupe avec succès',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erreur:', err);
      setNotification({
        open: true,
        message: 'Erreur lors de la suppression',
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCorrectionToDelete(null);
    }
  };

  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };


const handleGeneratePdfReport = async () => {
  setGeneratePdfLoading(true);
  try {
    const fileName = await generateQRCodePDF({
      corrections,
      group,
      generateShareCode: shareService.generateShareCode,
      getExistingShareCode: shareService.getExistingShareCode,
      onSuccess: (updatedCorrections: Correction[]) => {
        // Mettre à jour l'état des corrections avec les nouveaux codes de partage
        setCorrections(updatedCorrections);
        setUpdatedCorrections(JSON.parse(JSON.stringify(updatedCorrections)));
      }
    });
    
    if (fileName) {
      setNotification({
        open: true,
        message: `Rapport PDF "${fileName}" généré avec succès`,
        severity: 'success'
      });
    } else {
      throw new Error('Échec de génération du PDF');
    }
  } catch (err) {
    console.error('Erreur lors de la génération du PDF:', err);
    setNotification({
      open: true,
      message: 'Erreur lors de la génération du PDF',
      severity: 'error'
    });
  } finally {
    setGeneratePdfLoading(false);
  }
};

  // Fonctions pour la gestion de l'édition des notes
  const handleEditCorrections = () => {
    setEditMode(true);
  };

  const handleCancelEditCorrections = () => {
    setEditMode(false);
    setUpdatedCorrections(JSON.parse(JSON.stringify(corrections)));
  };

  // Fonction pour modifier le nom d'un étudiant
  const handleStudentNameChange = (index: number, newName: string) => {
    const updated = [...updatedCorrections];
    updated[index].student_name = newName;
    setUpdatedCorrections(updated);
  };

  // Fonction pour changer la note expérimentale avec le slider
  const handleExperimentalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    const updated = [...updatedCorrections];
    updated[index].experimental_points_earned = newValue;
    setUpdatedCorrections(updated);
  };

  // Fonction pour changer la note théorique avec le slider
  const handleTheoreticalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    const updated = [...updatedCorrections];
    updated[index].theoretical_points_earned = newValue;
    setUpdatedCorrections(updated);
  };

  // Fonction pour sauvegarder les corrections modifiées
  const handleSaveGrades = async () => {
    setSavingGrades(true);
    try {
      // Comparer les corrections originales avec les updatedCorrections pour déterminer lesquelles ont changé
      const changedCorrections = updatedCorrections.filter((correction, index) => {
        const original = corrections[index];
        return correction.student_name !== original.student_name ||
               correction.experimental_points_earned !== original.experimental_points_earned ||
               correction.theoretical_points_earned !== original.theoretical_points_earned;
      });

      if (changedCorrections.length === 0) {
        setNotification({
          open: true,
          message: 'Aucune modification détectée',
          severity: 'info'
        });
        setEditMode(false);
        setSavingGrades(false);
        return;
      }

      // Mettre à jour chaque correction modifiée
      let successCount = 0;
      for (const correction of changedCorrections) {
        try {
          const response = await fetch(`/api/corrections/${correction.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              student_name: correction.student_name,
              experimental_points_earned: correction.experimental_points_earned,
              theoretical_points_earned: correction.theoretical_points_earned
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            console.error(`Échec de mise à jour pour correction ID ${correction.id}`);
          }
        } catch (err) {
          console.error(`Erreur lors de la mise à jour de correction ID ${correction.id}:`, err);
        }
      }

      // Mettre à jour la liste des corrections
      if (successCount > 0) {
        setCorrections(JSON.parse(JSON.stringify(updatedCorrections)));
        setNotification({
          open: true,
          message: `${successCount} correction(s) mise(s) à jour avec succès`,
          severity: 'success'
        });
        setEditMode(false);
      } else {
        setNotification({
          open: true,
          message: 'Échec de la mise à jour des corrections',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des corrections:', err);
      setNotification({
        open: true,
        message: 'Erreur lors de la mise à jour des corrections',
        severity: 'error'
      });
    } finally {
      setSavingGrades(false);
    }
  };

  // Fonction pour gérer la suppression du groupe
  const handleDeleteGroup = async () => {
    if (!groupId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/correction-groups/${groupId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du groupe');
      }
      
      setNotification({
        open: true,
        message: 'Groupe supprimé avec succès',
        severity: 'success'
      });
      
      // Redirection vers la liste des groupes après suppression
      setTimeout(() => {
        router.push(`/activities/${activityId}/groups`);
      }, 1500);
    } catch (err) {
      console.error('Erreur:', err);
      setNotification({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression',
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Fonction pour enregistrer les modifications du groupe
  const handleSaveChanges = async () => {
    if (!groupId || !editedName.trim()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/correction-groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du groupe');
      }
      
      // Mettre à jour le groupe local
      if (group) {
        setGroup({
          ...group,
          name: editedName,
          description: editedDescription
        });
      }
      
      setNotification({
        open: true,
        message: 'Groupe mis à jour avec succès',
        severity: 'success'
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur:', err);
      setNotification({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction pour annuler l'édition
  const handleCancelEdit = () => {
    if (group) {
      setEditedName(group.name || '');
      setEditedDescription(group.description || '');
    }
    setIsEditing(false);
  };

  // Gestion des modals de partage
  const handleOpenShareModal = (correctionId: string) => {
    setSelectedCorrectionId(correctionId);
    setShareModalOpen(true);
  };

  const handleShareCorrections = async () => {
    if (corrections.length === 0) {
      setNotification({
        open: true,
        message: 'Aucune correction disponible à partager',
        severity: 'error'
      });
      return;
    }
    
    setIsSharing(true);
    setError('');
    
    try {
      const updatedCorrections = [...corrections];
      let sharedCount = 0;
      
      for (let i = 0; i < corrections.length; i++) {
        const correction = corrections[i];
        
        // Vérifier d'abord si un code de partage existe déjà
        const existingShareCheck = await shareService.getExistingShareCode(String(correction.id));
        
        if (existingShareCheck.exists && existingShareCheck.code) {
          updatedCorrections[i].shareCode = existingShareCheck.code;
          sharedCount++;
        } else {
          // Sinon, générer un nouveau code
          const shareResult = await shareService.generateShareCode(String(correction.id));
          if (shareResult.code) {
            updatedCorrections[i].shareCode = shareResult.code;
            sharedCount++;
          }
        }
      }
      
      setCorrections(updatedCorrections);
      setUpdatedCorrections(JSON.parse(JSON.stringify(updatedCorrections)));
      
      setNotification({
        open: true,
        message: `${sharedCount} correction(s) partagée(s) avec succès`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Erreur lors du partage des corrections:', err);
      setNotification({
        open: true,
        message: 'Erreur lors du partage des corrections',
        severity: 'error'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCloseShareModal = async () => {
    setShareModalOpen(false);
    
    // Si un ID de correction a été sélectionné, vérifier si un code a été généré
    if (selectedCorrectionId) {
      try {
        const existingShareCheck = await shareService.getExistingShareCode(selectedCorrectionId);
        
        if (existingShareCheck.exists && existingShareCheck.code) {
          // Trouver l'index de la correction correspondante
          const index = corrections.findIndex(c => String(c.id) === selectedCorrectionId);
          
          if (index !== -1) {
            const updatedCorrections = [...corrections];
            updatedCorrections[index].shareCode = existingShareCheck.code;
            setCorrections(updatedCorrections);
            setUpdatedCorrections(JSON.parse(JSON.stringify(updatedCorrections)));
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du code de partage après fermeture du modal:', err);
      }
    }
    
    // Réinitialiser l'ID de correction sélectionnée
    setSelectedCorrectionId('');
  };

  const calculateAverage = () => {
    if (corrections.length === 0) return 0;
    
    const total = corrections.reduce((sum, correction) => {
      const total = (correction.experimental_points_earned || 0) + (correction.theoretical_points_earned || 0);
      return sum + total;
    }, 0);
    
    return (total / corrections.length).toFixed(1);
  };
  

  // Formater les nombres pour l'affichage
  const formatNumber = (value: number): string => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(1);
  };

  // Classes de style pour l'alternance des lignes du tableau
  const getRowClass = (index: number) => {
    return index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50';
  };

  // Fonction pour déterminer la couleur de la note
  const getGradeColor = (grade: number, total: number) => {
    const percentage = (grade / total) * 100;
    if (percentage >= 85) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
          <div className="py-10 flex justify-center max-w-[400px] mx-auto">
            <LoadingSpinner text="Chargement des données du groupe " />
          </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* En-tête avec bannière stylisée */}
      <Paper 
  elevation={3} 
  sx={{ 
    borderRadius: '10px', 
    overflow: 'hidden',
    marginBottom: '24px',
    background: 'linear-gradient(90deg,rgb(10, 68, 125) 0%, #2c387e 100%)' // Dégradé bleu plus distinct
  }}
>
  <Box 
    className="p-6 relative" 
    sx={{
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    {/* Motif de fond décoratif avec opacité augmentée */}
    <Box 
      sx={{ 
        position: 'absolute', 
        inset: 0, 
        opacity: 0.15, // Opacité légèrement augmentée pour meilleure visibilité
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '60px 60px'
      }}
    />
    
    {/* Contenu de l'en-tête */}
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <GroupsIcon sx={{ fontSize: 32, color: '#f0f4ff' }} /> {/* Bleu très clair pour l'icône */}
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#f0f4ff' }}> {/* Bleu très clair pour le titre */}
          {group?.name || "Groupe sans nom"}
        </Typography>
        
        {/* IconButtons pour les actions principales */}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          {!isEditing && (
            <>
              <IconButton
                sx={{ 
                  color: '#f0f4ff', // Bleu très clair pour l'icône
                  bgcolor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent pour le fond
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.25)',  // Plus visible au survol
                    boxShadow: '0 0 5px rgba(255,255,255,0.3)' // Effet de lueur
                  }
                }}
                onClick={() => setIsEditing(true)}
                title="Modifier le groupe"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                sx={{ 
                  color: '#ffdddd', // Rouge pâle pour indiquer une action de suppression
                  bgcolor: 'rgba(255, 100, 100, 0.35)', // Fond légèrement rouge
                  '&:hover': { 
                    bgcolor: 'rgba(255, 100, 100, 0.55)',  // Plus rouge au survol
                    boxShadow: '0 0 5px rgba(255,150,150,0.8)' // Effet de lueur rouge
                  }
                }}
                onClick={() => setDeleteDialogOpen(true)}
                title="Supprimer le groupe"
              >
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
      
      <Typography variant="subtitle1" sx={{ color: '#d0e3ff', opacity: 0.95, mb: 2 }}> {/* Bleu clair pour le sous-titre */}
        {group?.activity_name || "Activité non spécifiée"}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3 }}>
        <Button
          component={Link}
          href={`/activities/${activityId}/groups`}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          size="small"
          sx={{ 
            color: '#f0f4ff', // Bleu très clair
            borderColor: 'rgba(240,244,255,0.6)',
            '&:hover': { 
              borderColor: '#f0f4ff',
              backgroundColor: 'rgba(240,244,255,0.15)'
            }
          }}
        >
          Retour aux groupes
        </Button>
        
        <Button
          component={Link}
          href={`/activities/${activityId}`}
          variant="outlined"
          size="small"
          sx={{ 
            color: '#ddecff', // Bleu très clair légèrement différent
            borderColor: 'rgba(221,236,255,0.4)',
            '&:hover': { 
              borderColor: '#ddecff',
              backgroundColor: 'rgba(221,236,255,0.1)'
            }
          }}
        >
          Activité
        </Button>
      </Box>
    </Box>
  </Box>
</Paper>

      {/* Zone d'édition du groupe */}
      {isEditing && (
        <Paper className="p-4 mb-6">
          <div className="space-y-4">
            <Typography variant="h6" className="mb-2">Modifier le groupe</Typography>
            <Divider className="mb-3" />
            
            <TextField
              label="Nom du groupe"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              fullWidth
              margin="normal"
              required
              error={!editedName.trim()}
              helperText={!editedName.trim() && "Le nom du groupe est requis"}
            />
            
            <TextField
              label="Description (optionnelle)"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CloseIcon />}
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
                disabled={isSaving || !editedName.trim()}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </Box>
          </div>
        </Paper>
      )}

      {/* Cartes d'informations et statistiques */}
      {!isEditing && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr' }, gap: 3, mb: 4 }}>
          {/* Carte des infos du groupe */}
          <Card sx={{ 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column',
            borderTop: '4px solid #3f51b5'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DomainIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Informations
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CalendarTodayIcon fontSize="small" color="action" />
                <Typography variant="body1">
                  {group ? new Date(group.created_at).toLocaleDateString() : '-'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <DescriptionIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Description:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {group?.description || "Aucune description disponible"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Carte des statistiques */}
          <Card sx={{ 
            height: '100%',
            borderTop: '4px solid #4caf50'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GroupsIcon color="success" />
                <Typography variant="h6" fontWeight="bold">
                  Statistiques
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {corrections.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {corrections.length > 1 ? 'Corrections' : 'Correction'}
                </Typography>
              </Box>
              
              {corrections.length > 0 && (
                <Box sx={{ textAlign: 'center', mt: 2, py: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Note moyenne
                  </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mt: '4px' }}>
                    {calculateAverage()} / {(corrections[0]?.experimental_points || 0) + (corrections[0]?.theoretical_points || 0)}
                    </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Carte des actions */}
          <Card sx={{ 
            height: '100%',
            borderTop: '4px solid #ff9800'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EventIcon color="warning" />
                <Typography variant="h6" fontWeight="bold">
                  Actions
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ShareIcon />}
                  onClick={handleShareCorrections}
                  disabled={isSharing || corrections.length === 0}
                  fullWidth
                >
                  {isSharing ? 'Partage en cours...' : 'Partager tout'}
                </Button>
                
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleGeneratePdfReport}
                  disabled={generatePdfLoading || corrections.length === 0}
                  fullWidth
                >
                  {generatePdfLoading ? 'Génération...' : 'Rapport PDF'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  endIcon={<ArrowForwardIcon />}
                  component={Link}
                  href={`/corrections/multiples?activityId=${activityId}`}
                  fullWidth
                >
                  Nouvelles correction
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Section des corrections avec barre d'outils pour l'édition */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
            Liste des corrections {/*({corrections.length})*/}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {corrections.length > 0 && (
              <Chip 
                label={`Moyenne: ${calculateAverage()} / 20`} 
                color="default"
                sx={{ bgcolor: 'white', fontWeight: 'bold', mr: 1 }}
              />
            )}

            {editMode ? (
              <>
                <Button 
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={handleSaveGrades}
                  disabled={savingGrades}
                  startIcon={savingGrades ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {savingGrades ? 'Sauvegarde...' : 'Enregistrer'}
                </Button>

                <Button 
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleCancelEditCorrections}
                  disabled={savingGrades}
                  startIcon={<CloseIcon />}
                >
                  Annuler
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
              >
                Éditer les notes
              </Button>
            )}
          </Box>
        </Box>
        
        {corrections.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Aucune correction dans ce groupe
            </Typography>
            <Button
              component={Link}
              href={`/corrections/multiples?activityId=${activityId}`}
              variant="contained"
              color="primary"
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
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(editMode ? updatedCorrections : corrections).map((correction, index) => {
                  const expGrade = correction.experimental_points_earned || 0;
                  const theoGrade = correction.theoretical_points_earned || 0;
                  const totalGrade = expGrade + theoGrade;
                  const totalPoints = (correction.experimental_points || 0) + (correction.theoretical_points || 0);
                  const gradeColor = getGradeColor(totalGrade, totalPoints);
                  
                  return (
                    <TableRow key={correction.id} className={getRowClass(index)}>
                      <TableCell>
                        {editMode ? (
                          <TextField
                            value={correction.student_name}
                            onChange={(e) => handleStudentNameChange(index, e.target.value)}
                            variant="standard"
                            size="small"
                            fullWidth
                          />
                        ) : (
                          <Typography fontWeight="medium">
                            {correction.student_name || 'Sans nom'}
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
                              max={correction.experimental_points || 5}
                              step={0.5}
                              valueLabelDisplay="auto"
                              size="small"
                            />
                            <Typography variant="caption" display="block" textAlign="center">
                              {formatNumber(expGrade)} / {formatNumber(correction.experimental_points || 0)}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip 
                            size="small" 
                            label={`${formatNumber(expGrade)} / ${formatNumber(correction.experimental_points || 0)}`}
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
                              max={correction.theoretical_points || 15}
                              step={0.5}
                              valueLabelDisplay="auto"
                              size="small"
                            />
                            <Typography variant="caption" display="block" textAlign="center">
                              {formatNumber(theoGrade)} / {formatNumber(correction.theoretical_points || 0)}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip 
                            size="small" 
                            label={`${formatNumber(theoGrade)} / ${formatNumber(correction.theoretical_points || 0)}`}
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
                          
                          <Tooltip title="Retirer du groupe">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCorrection(correction.id)}
                            >
                              <DeleteIcon />
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
      </Paper>

{/* Modal de confirmation de suppression */}
<Dialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  slotProps={{
    paper: {
      elevation: 3,
      sx: { 
        borderRadius: 2,
        maxWidth: '750px',  // Définir la largeur maximale ici
        width: '100%'       // Assurer qu'il prend 100% jusqu'à maxWidth
      }
    }
  }}
>
  <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', py: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <DeleteIcon color="error" />
      <Typography variant="h6">Confirmation de suppression</Typography>
    </Box>
  </DialogTitle>
  <DialogContent sx={{ pt: 3 }}>
    <DialogContentText>
      <br />
      Êtes-vous sûr de vouloir supprimer le groupe 
      <Typography variant="body1" color="secondary" component="span" sx={{ fontWeight: 'bold' }}>
        {group?.name} 
      </Typography> ? <strong>Cette action est irréversible</strong>.
    </DialogContentText>
    
    {/* Ajouter un espace entre le texte et l'alerte */}
    <Box sx={{ mt: 2, mb: 2 }}></Box>
    
    {/* L'alerte est maintenant à l'extérieur du DialogContentText */}
    <Alert severity="warning">
      Attention : cela supprimera uniquement le groupe, pas les corrections individuelles.
    </Alert>
  </DialogContent>
  <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f0f0f0' }}>
    <Button 
      onClick={() => setDeleteDialogOpen(false)} 
      variant="outlined"
      disabled={isDeleting}
    >
      Annuler
    </Button>
    <Button 
      onClick={handleDeleteGroup} 
      color="error" 
      variant="contained"
      disabled={isDeleting}
      startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
    >
      {isDeleting ? "Suppression..." : "Supprimer"}
    </Button>
  </DialogActions>
</Dialog>

      {/* Modal de partage */}
      <ShareModal 
        open={shareModalOpen}
        onClose={handleCloseShareModal}
        correctionId={selectedCorrectionId}
        onShareSuccess={(code) => {
          // Cette fonction sera appelée si la modal de partage réussit à générer un code
          const index = corrections.findIndex(c => String(c.id) === selectedCorrectionId);
          if (index !== -1) {
            const updatedCorrections = [...corrections];
            updatedCorrections[index].shareCode = code;
            setCorrections(updatedCorrections);
            setUpdatedCorrections(JSON.parse(JSON.stringify(updatedCorrections)));
          }
        }}
      />

      {/* Notifications */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          elevation={6}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
}