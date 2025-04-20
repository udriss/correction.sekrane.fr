'use client';


import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Paper,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import LoadingSpinner from '@/components/LoadingSpinner';
import ShareModal from '@/app/components/ShareModal';
import * as shareService from '@/lib/services/shareService';
import AddCorrectionToGroupModal from '@/components/AddCorrectionToGroupModal';
import { useSnackbar } from 'notistack';
import { Correction as OriginalCorrection, CorrectionWithShareCode as OriginalCorrectionWithShareCode, Student } from '@/lib/types';

// Create modified types that allow null student_id
interface Correction extends Omit<OriginalCorrection, 'student_id'> {
  student_id: number | null;
}

interface CorrectionWithShareCode extends Omit<OriginalCorrectionWithShareCode, 'student_id'> {
  student_id: number | null;
  shareCode: string | null;
}

// Import des composants modulaires
import GroupHeader from '@/components/groups/GroupHeader';
import GroupEditForm from '@/components/groups/GroupEditForm';
import InfoCards from '@/components/groups/InfoCards';
import CorrectionsList from '@/components/groups/CorrectionsList';
import GroupDialogs from '@/components/groups/GroupDialogs';

interface Group {
  id: number;
  name: string;
  activity_name: string;
  activity_id: number;
  created_at: string;
  description?: string;
}

interface Activity {
  id: number;
  name: string;
  experimental_points: number;
  theoretical_points: number;
}

// Removed local Student interface in favor of the one imported from '@/lib/types'

export default function CorrectionGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;
  const activityId = params?.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [corrections, setCorrections] = useState<CorrectionWithShareCode[]>([]);
  const [updatedCorrections, setUpdatedCorrections] = useState<CorrectionWithShareCode[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  const [addCorrectionsModalOpen, setAddCorrectionsModalOpen] = useState(false);

  const [correctionToDelete, setCorrectionToDelete] = useState<number | null>(null);
  const [groupDeleteDialogOpen, setGroupDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [correctionToRemove, setCorrectionToRemove] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]); // Ajouter un état pour stocker les étudiants

  // Fonction pour obtenir le nom complet d'un étudiant à partir de son ID
  const getStudentFullName = (studentId: number | null): string => {
    if (!studentId) return 'Sans nom';
    const student = students.find(s => s.id === studentId);
    if (!student) return 'Sans nom';
    return `${student.first_name} ${student.last_name}`;
  };

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

        // Fetch the activity data
        if (activityId) {
          const activityResponse = await fetch(`/api/activities/${activityId}`);
          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            setActivity(activityData);
          }
        }

        // Récupérer les étudiants avec la nouvelle structure
        const studentsResponse = await fetch('/api/students');
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData);
        }

        // Récupérer les corrections associées avec toutes les données nécessaires
        const correctionsResponse = await fetch(`/api/correction-groups/${groupId}/corrections`);

        if (!correctionsResponse.ok) {
          throw new Error('Erreur lors de la récupération des corrections');
        }

        const correctionsData = await correctionsResponse.json();
        
        // S'assurer que les notes sont des nombres valides et ajouter shareCode comme null
        const validatedCorrections: CorrectionWithShareCode[] = correctionsData.map((correction: Correction) => ({
          ...correction,
          experimental_points_earned: parseFloat(correction.experimental_points_earned as any) || 0,
          theoretical_points_earned: parseFloat(correction.theoretical_points_earned as any) || 0,
          grade: parseFloat(correction.grade as any) || 0,
          shareCode: null
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
  }, [groupId, activityId]);

  // Ajouter un effet pour récupérer les codes de partage existants au chargement
  useEffect(() => {
    async function fetchShareCodes() {
      if (!corrections || corrections.length === 0) return;
      
      try {
        const updatedCorrections = [...corrections];
        let foundShareCodes = 0;
        
        for (let i = 0; i < corrections.length; i++) {
          const correction = corrections[i];
          
          try {
            // Utiliser l'API share-code-status pour obtenir le code de partage
            const shareResponse = await fetch(`/api/corrections/${correction.id}/share-code-status`);
            if (shareResponse.ok) {
              const shareData = await shareResponse.json();
              
              if (shareData.exists && shareData.code) {
                updatedCorrections[i].shareCode = shareData.code;
                foundShareCodes++;
              }
            }
          } catch (shareErr) {
            console.error(`Erreur lors de la récupération du code de partage pour la correction ${correction.id}:`, shareErr);
          }
        }
        
        if (foundShareCodes > 0) {
          
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

  // Fonctions de gestion pour retirer une correction d'un groupe
  const handleRemoveFromGroup = (correctionId: number) => {
    setCorrectionToRemove(correctionId);
  };

  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };

  const confirmRemoveFromGroup = async () => {
    if (!correctionToRemove) return;
    
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/correction-groups/${groupId}/corrections/${correctionToRemove}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du retrait de la correction du groupe');
      }
      
      // Mise à jour de l'état local
      setCorrections(corrections.filter(c => c.id !== correctionToRemove));
      setNotification({
        open: true,
        message: 'Correction retirée du groupe avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        open: true,
        message: `Erreur: ${(error as Error).message}`,
        severity: 'error'
      });
    } finally {
      setCorrectionToRemove(null);
      setIsProcessing(false);
    }
  };

  // Fonctions de gestion pour supprimer complètement une correction
  const handleDeleteCorrection = (correctionId: number) => {
    setCorrectionToDelete(correctionId);
  };

  const confirmDeleteCorrection = async () => {
    if (!correctionToDelete) return;
    
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/corrections/${correctionToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la correction');
      }
      
      // Mise à jour de l'état local
      setCorrections(corrections.filter(c => c.id !== correctionToDelete));
      setNotification({
        open: true,
        message: 'Correction supprimée définitivement avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        open: true,
        message: `Erreur: ${(error as Error).message}`,
        severity: 'error'
      });
    } finally {
      setCorrectionToDelete(null);
      setIsProcessing(false);
    }
  };

  // Initier la suppression du groupe entier
  const handleInitiateGroupDelete = () => {
    setGroupDeleteDialogOpen(true);
  };



  // Fonctions pour la gestion de l'édition des notes
  const handleEditCorrections = () => {
    setEditMode(true);
  };

  const handleCancelEditCorrections = () => {
    setEditMode(false);
    setUpdatedCorrections(JSON.parse(JSON.stringify(corrections)));
  };

  // Fonction pour gérer la modification de l'étudiant d'une correction
  // Cette fonction doit être modifiée pour utiliser un système de sélection d'étudiant par ID au lieu du nom
  const handleStudentIdChange = (index: number, newStudentId: number | null) => {
    const updated = [...updatedCorrections];
    updated[index].student_id = newStudentId;
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
        return correction.student_id !== original.student_id ||
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
              // Utiliser uniquement l'ID de l'étudiant
              student_id: correction.student_id,
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

  // Confirmer la suppression du groupe entier
  const handleDeleteGroup = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/correction-groups/${groupId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du groupe');
      }
      
      enqueueSnackbar('Groupe supprimé avec succès', { 
        variant: 'success',
        autoHideDuration: 5000
      });
      router.push(`/activities/${activityId}`);
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur: ${(error as Error).message}`, { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setGroupDeleteDialogOpen(false);
      setIsDeleting(false);
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
    
    // If a correction ID was selected, check if a share code was generated
    if (selectedCorrectionId) {
      try {
        // Use the API to get the current share code status
        const shareResponse = await fetch(`/api/corrections/${selectedCorrectionId}/share-code-status`);
        if (shareResponse.ok) {
          const shareData = await shareResponse.json();
          
          if (shareData.exists && shareData.code) {
            // Find the correction and update its share code
            const updatedCorrections = [...corrections];
            const index = updatedCorrections.findIndex(c => String(c.id) === selectedCorrectionId);
            
            if (index !== -1) {
              updatedCorrections[index].shareCode = shareData.code;
              setCorrections(updatedCorrections);
              setUpdatedCorrections(JSON.parse(JSON.stringify(updatedCorrections)));
            }
          }
        }
      } catch (err) {
        console.error('Error checking share code after modal close:', err);
      }
    }
    
    setSelectedCorrectionId('');
  };

  const calculateAverage = () => {
    if (corrections.length === 0) return "0";
    
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

  // Fonction pour déterminer la couleur de la note
  const getGradeColor = (grade: number, total: number) => {
    const percentage = (grade / total) * 100;
    if (percentage >= 85) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const handleCorrectionsAdded = async (correctionIds: string[]) => {
    // Refresh corrections list after new ones are added
    try {
      const correctionsResponse = await fetch(`/api/correction-groups/${groupId}/corrections`);
      if (correctionsResponse.ok) {
        const correctionsData = await correctionsResponse.json();
        
        // Validate corrections data
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
        
        setNotification({
          open: true,
          message: `${correctionIds.length} correction(s) ajoutée(s) avec succès`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error refreshing corrections:', err);
    }
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
      {/* En-tête du groupe */}
      <GroupHeader 
        group={group}
        activityId={activityId}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        setGroupDeleteDialogOpen={setGroupDeleteDialogOpen}
      />

      {/* Zone d'édition du groupe */}
      {isEditing && (
        <GroupEditForm 
          editedName={editedName}
          setEditedName={setEditedName}
          editedDescription={editedDescription}
          setEditedDescription={setEditedDescription}
          handleSaveChanges={handleSaveChanges}
          handleCancelEdit={handleCancelEdit}
          isSaving={isSaving}
        />
      )}



      {/* Liste des corrections */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <CorrectionsList 
          corrections={corrections}
          updatedCorrections={updatedCorrections}
          activity={activity}
          editMode={editMode}
          savingGrades={savingGrades}
          setEditMode={setEditMode}
          handleEditCorrections={handleEditCorrections}
          handleCancelEditCorrections={handleCancelEditCorrections}
          handleSaveGrades={handleSaveGrades}
          handleStudentNameChange={handleStudentIdChange} // Renommé mais requiert aussi un changement dans CorrectionsList
          handleExperimentalGradeChange={handleExperimentalGradeChange}
          handleTheoreticalGradeChange={handleTheoreticalGradeChange}
          handleOpenShareModal={handleOpenShareModal}
          handleRemoveFromGroup={handleRemoveFromGroup}
          handleDeleteCorrection={handleDeleteCorrection}
          setAddCorrectionsModalOpen={setAddCorrectionsModalOpen}
          calculateAverage={calculateAverage}
          formatNumber={formatNumber}
          getGradeColor={getGradeColor}
          getStudentFullName={getStudentFullName}
        />
      </Paper>

      {/* Dialogues et modals */}
      <GroupDialogs 
        correctionToRemove={correctionToRemove}
        setCorrectionToRemove={setCorrectionToRemove}
        confirmRemoveFromGroup={confirmRemoveFromGroup}
        isProcessing={isProcessing}
        correctionToDelete={correctionToDelete}
        setCorrectionToDelete={setCorrectionToDelete}
        confirmDeleteCorrection={confirmDeleteCorrection}
        groupDeleteDialogOpen={groupDeleteDialogOpen}
        setGroupDeleteDialogOpen={setGroupDeleteDialogOpen}
        handleDeleteGroup={handleDeleteGroup}
        isDeleting={isDeleting}
        group={group}
      />

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

      {/* Modal d'ajout de corrections */}
      <AddCorrectionToGroupModal
        open={addCorrectionsModalOpen}
        onClose={() => setAddCorrectionsModalOpen(false)}
        activityId={activityId}
        groupId={groupId}
        onSuccess={handleCorrectionsAdded}
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