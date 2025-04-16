import { useState, useCallback, useRef } from 'react';
import { CorrectionAutre, ActivityAutre, Student } from '@/lib/types';
import { ContentItem } from '@/types/correction';
import { useRouter } from 'next/navigation';

// Define the ContentData interface here or import it to ensure consistency
interface ContentData {
  version: string;
  items: ContentItem[];
}

interface LocalCorrectionAutre extends Omit<CorrectionAutre, 'activity_id' | 'class_id'> {
  activity_id: number;
  class_id: number | null;
  student_name?: string;
  activity_name?: string;
  class_name?: string;
  score_percentage?: number;
  student_id: number | null;
  points_earned: number[]; // Array of points for each part
  status?: string;
  student_data?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any; // Allow for additional properties
  };
}

export function useCorrectionsAutres(correctionId: string) {
  const [correction, setCorrection] = useState<LocalCorrectionAutre | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<ContentItem[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [correctionNotFound, setCorrectionNotFound] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editedName, setEditedName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState<boolean>(false);
  const [correctionStatus, setCorrectionStatus] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const router = useRouter();

  // Référence pour stocker le timeout de mise à jour des points
  const updatePointsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev, [...contentItems]]);
  }, [contentItems]);

  // Undo last change
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    const previousState = history[history.length - 1];
    setContentItems(previousState);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  // Load the correction and its content
  const fetchCorrectionData = useCallback(async (onActivityIdCallback?: (activityId: number) => void) => {
    setLoading(true);
    setCorrectionNotFound(false);
    
    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}`);
      
      if (response.status === 404) {
        setCorrectionNotFound(true);
        return;
      }
      
      if (!response.ok) {
        // Récupérer les détails de l'erreur depuis la réponse
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.message || `Statut HTTP: ${response.status}`;
        } catch (parseError) {
          errorDetail = `Statut HTTP: ${response.status}`;
        }
        throw new Error(`Échec de récupération de la correction: ${errorDetail}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.id) {
        setCorrectionNotFound(true);
        return;
      }
      
      setCorrection(data);
      setCorrectionStatus(data.status);
      // Extract and set student data
      if (data.student_data) {
        setFirstName(data.student_data.first_name || '');
        setLastName(data.student_data.last_name || '');
        setEmail(data.student_data.email || '');
        const displayName = `${data.student_data.first_name || ''} ${data.student_data.last_name || ''}`.trim();
        setEditedName(displayName || data.student_name || '');
      } else {
        setFirstName('');
        setLastName('');
        setEmail('');
        setEditedName(data.student_name || '');
      }
      
      // Set content items if available
      if (data.content_data && data.content_data.items) {
        setContentItems(data.content_data.items);
      }
      
      // Fetch activity data to get parts_names and points
      if (data.activity_id) {
        const activityResponse = await fetch(`/api/activities_autres/${data.activity_id}`);
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivity(activityData);
        }
        
        // Call the callback with the activity ID if provided
        if (onActivityIdCallback) {
          onActivityIdCallback(data.activity_id);
        }
      }
    } catch (error) {
      console.error('Error fetching correction:', error);
      // Transmettre l'objet d'erreur complet au lieu d'un simple message
      setError(error instanceof Error ? error.message : `Échec du chargement: ${String(error)}`);
    } finally {
      setLoading(false);
    }
    
  }, [correctionId]);

  // Save the correction
  const handleSaveCorrection = useCallback(async () => {
    if (!correction) return;
    
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Extract formatted text from content items
      const formattedContent = contentItems.map(item => {
        if (item.type === 'text') {
          return item.content;
        } else if (item.type === 'image') {
          return `[IMAGE: ${item.src}]`;
        }
        return '';
      }).join('\n\n');
      
      // Save correction with current content items
      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formattedContent,
          content_data: { version: '1.0', items: contentItems }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Échec de sauvegarde de la correction');
      }
      
      setSuccessMessage('Correction sauvegardée avec succès');
      
      // Clear history after saving
      setHistory([]);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      return true; // Return success for chaining
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la sauvegarde de la correction');
      setTimeout(() => {
        setError('');
      }, 3000);
      return false; // Return failure for chaining
    } finally {
      setSaving(false);
    }
  }, [correction, contentItems, correctionId]);

  // Save the student name
  const handleSaveName = useCallback(async (
    overrideFirstName?: string, 
    overrideLastName?: string, 
    overrideEmail?: string
  ) => {
    if (!correction) return;
    
    // Use override values if provided, otherwise use state values
    const firstNameToSend = overrideFirstName !== undefined ? overrideFirstName : firstName;
    const lastNameToSend = overrideLastName !== undefined ? overrideLastName : lastName;
    const emailToSend = overrideEmail !== undefined ? overrideEmail : email;

    // Validate before proceeding
    if (!firstNameToSend && !lastNameToSend) {
      setError('Le prénom ou le nom est requis');
      return;
    }
    
    // Validate email format if provided
    if (emailToSend && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend)) {
      setError('Format d\'email invalide');
      return;
    }
    
    setError('');
    setSaving(true);
    
    try {
      // Direct API call with email added to the payload
      const response = await fetch(`/api/corrections_autres/${correctionId}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_first_name: firstNameToSend,
          student_last_name: lastNameToSend,
          student_email: emailToSend
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du nom');
      }
      
      const updatedData = await response.json();

      // Update local state with the values we just sent
      setFirstName(firstNameToSend);
      setLastName(lastNameToSend);
      setEmail(emailToSend);
      
      // Update the correction object with API response data
      setCorrection(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          student_name: updatedData.student_name || `${firstNameToSend} ${lastNameToSend}`.trim(),
          student_data: prev.student_data ? {
            ...prev.student_data,
            first_name: firstNameToSend,
            last_name: lastNameToSend,
            email: emailToSend
          } : {
            first_name: firstNameToSend,
            last_name: lastNameToSend,
            email: emailToSend
          }
        };        
      });
      
      // Set display name
      const combinedName = `${firstNameToSend} ${lastNameToSend}`.trim();
      setEditedName(combinedName);
      
      setIsEditingName(false);
      setSuccessMessage('Informations de l\'étudiant mises à jour avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error in handleSaveName:', err);
      setError('Erreur lors de la mise à jour des informations de l\'étudiant');
    } finally {
      setSaving(false);
    }
  }, [correction, correctionId, firstName, lastName, email]);

  // Update points earned for a specific part with debounce
  const updatePointsEarned = useCallback(async (pointsEarned: number[]) => {
    if (!correction) return false;
    
    // Mettre à jour l'état local immédiatement pour une UI réactive
    setCorrection(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points_earned: pointsEarned
      };
    });
    
    // Annuler tout timeout existant
    if (updatePointsTimeoutRef.current) {
      clearTimeout(updatePointsTimeoutRef.current);
    }
    
    // Créer un nouveau timeout pour retarder l'appel API
    updatePointsTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      
      try {
        // Calculer la note totale
        const totalEarned = pointsEarned.reduce((sum, points) => sum + points, 0);
        // Récupérer la pénalité actuelle
        const penaltyValue = correction.penalty || 0;
        // Calculer la note finale selon les règles
        let finalGrade;
        if (totalEarned < 5) {
          // Si note < 5, on garde cette note
          finalGrade = totalEarned;
        } else {
          // Sinon on prend max(note-pénalité, 5)
          finalGrade = Math.max(totalEarned - penaltyValue, 5);
        }
        
        const response = await fetch(`/api/corrections_autres/${correctionId}/grade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            points_earned: pointsEarned,
            grade: totalEarned,
            final_grade: finalGrade,
            penalty: penaltyValue
          }),
        });
        
        if (!response.ok) {
          throw new Error('Échec de mise à jour des points');
        }
        
        const updatedData = await response.json();
        
        // Mettre à jour l'état local avec toutes les données reçues du serveur
        setCorrection(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            points_earned: updatedData.points_earned,
            grade: updatedData.grade,
            final_grade: updatedData.final_grade,
            penalty: updatedData.penalty
          };
        });
        
        setSuccessMessage('Points mis à jour');
        setTimeout(() => {
          setSuccessMessage('');
        }, 1500);
        
        return true;
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors de la mise à jour des points');
        setTimeout(() => {
          setError('');
        }, 3000);
        return false;
      } finally {
        setSaving(false);
        updatePointsTimeoutRef.current = null;
      }
    }, 1000); // 1 seconde de délai
    
    return true; // Retourne true pour signifier que l'action a été prise en compte
  }, [correction, correctionId]);

  // Save dates (deadline and submission date)
  const saveDates = async (
    deadline: string | null,
    submissionDate: string | null
  ) => {
    try {
      setError('');
      setSaving(true);
      
      const response = await fetch(`/api/corrections_autres/${correctionId}/dates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadline: deadline,
          submission_date: submissionDate,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de sauvegarde des dates');
      }
  
      const updatedCorrection = await response.json();
      
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          deadline: updatedCorrection.deadline,
          submission_date: updatedCorrection.submission_date
        };
      });
  
      setSuccessMessage('Dates sauvegardées avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
      return true;
    } catch (err: any) {
      setError(`Erreur lors de la sauvegarde des dates: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete the correction
  const handleDelete = useCallback(async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    try {
      const response = await fetch(`/api/corrections_autres/${correctionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Échec de suppression de la correction');
      }

      // Navigate back to activity page
      if (correction?.activity_id) {
        router.push(`/activities_autres/${correction.activity_id}`);
      } else {
        router.push('/activities_autres');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression de la correction');
    }
  }, [confirmingDelete, correction, router, correctionId]);

  // Toggle active status for a correction
  const handleToggleActive = useCallback(async () => {
    if (!correction) return;
    
    setSaving(true);
    setError('');
    
    try {
      const isCurrentlyActive = correction.status 
        ? correction.status === 'ACTIVE' 
        : correction.active === 1;
      
      const newActiveState = !isCurrentlyActive;

      const response = await fetch(`/api/corrections_autres/${correctionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: newActiveState ? 1 : 0,
          status: correction.status
        }),
      });
      
      if (!response.ok) {
        throw new Error('Échec de modification du statut');
      }
      
      const result = await response.json();
      
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          active: result.active,
          status: result.status
        };
      });
      
      setSuccessMessage(`Correction ${newActiveState ? 'activée' : 'désactivée'} avec succès`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur lors de la modification du statut:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erreur lors de la modification du statut de la correction');
      }
    } finally {
      setSaving(false);
    }
  }, [correction, correctionId]);

  // Change correction status (ACTIVE, DEACTIVATED, ABSENT, NON_RENDU, NON_NOTE)
  const handleChangeStatus = useCallback(async (newStatus: string) => {
    if (!correction || !correction.id) return;
    
    // If clicking on current status, toggle back to ACTIVE
    if (correctionStatus === newStatus) {
      newStatus = 'ACTIVE';
    }
    
    setIsStatusChanging(true);
    try {
      // Utiliser la fonction utilitaire du service
      await fetch(`/api/corrections_autres/${correction.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Map status to readable name for the toast message
      const statusNames: Record<string, string> = {
        'ACTIVE': 'activée',
        'DEACTIVATED': 'désactivée',
        'ABSENT': 'marquée comme absent',
        'NON_RENDU': 'marquée comme non rendue',
        'NON_NOTE': 'marquée comme non notée'
      };
      
      // Show success message
      setSuccessMessage(`Correction ${statusNames[newStatus] || 'mise à jour'} avec succès`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setCorrectionStatus(newStatus);
      
      // Also update the active state for backward compatibility
      setIsActive(newStatus === 'ACTIVE');
      
      // Update correction object
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          active: newStatus === 'ACTIVE' ? 1 : 0
        };
      });
      
    } catch (error) {
      console.error('Error changing correction status:', error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Échec de la mise à jour'}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsStatusChanging(false);
    }
  }, [correction, correctionStatus]);

  // Cancel delete confirmation
  const handleCancelDelete = useCallback(() => {
    setConfirmingDelete(false);
  }, []);

  // Fonction pour effacer l'erreur
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    correctionStatus,
    correction,
    contentItems,
    history,
    loading,
    saving,
    error,
    successMessage,
    editedName,
    firstName,
    lastName,
    email,
    isEditingName,
    confirmingDelete,
    correctionNotFound,
    activity,
    setContentItems,
    setError,
    setSuccessMessage,
    setEditedName,
    setFirstName,
    setLastName,
    setEmail,
    setIsEditingName,
    setCorrection,
    saveToHistory,
    handleUndo,
    fetchCorrectionData,
    handleSaveCorrection,
    handleSaveName,
    handleDelete,
    handleToggleActive,
    handleChangeStatus,
    handleCancelDelete,
    updatePointsEarned,
    saveDates,
    clearError,
    setSaving,
  };
}