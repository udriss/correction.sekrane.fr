import { useState, useCallback } from 'react';
import { Correction } from '@/lib/types';
import { ContentItem } from '@/types/correction';
import * as correctionService from '../services/correctionService';
import { useRouter } from 'next/navigation';
// Import du composant ErrorDisplay
import ErrorDisplay from '@/components/ui/ErrorDisplay';

// Define the ContentData interface here or import it to ensure consistency
interface ContentData {
  version: string;
  items: ContentItem[];
}

interface LocalCorrection extends Omit<Correction, 'activity_id' | 'class_id'> {
  studentName?: string;
  firstName?: string;
  lastName?: string;
  activity_id: number;
  deadline?: string;
  submission_date?: string;
  grade?: number;
  active?: number; // Ensuring this matches the type in Correction (0 = inactive, 1 = active)
  experimental_points_earned?: number;
  theoretical_points_earned?: number;
  penalty?: number;
  student_name?: string;
  student_first_name?: string;
  student_last_name?: string;
  class_id: number | null; // Removed optional modifier to match the base type
  class_name?: string;
  sub_class?: number;
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

export function useCorrections(correctionId: string) {
  const [correction, setCorrection] = useState<LocalCorrection | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<ContentItem[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [error, setError] = useState('');
  const [correctionNotFound, setCorrectionNotFound] = useState(false); // Nouvel état pour suivre si la correction existe
  const [successMessage, setSuccessMessage] = useState('');
  const [editedName, setEditedName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();


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
    setCorrectionNotFound(false); // Réinitialiser l'état
    try {
      const response = await fetch(`/api/corrections/${correctionId}`);
      
      // Vérifier si la correction existe
      if (response.status === 404) {
        setCorrectionNotFound(true);
        //setError('Correction introuvable');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Échec de récupération de la correction');
      }
      
      const data = await response.json();
      
      // Vérifier si la réponse contient une correction valide
      if (!data || !data.id) {
        setCorrectionNotFound(true);
        //setError('Correction introuvable ou invalide');
        return;
      }
      
      setCorrection(data);
      // Extract and set student data from the new structure
      if (data.student_data) {
        // Use the dedicated student_data object when available
        setFirstName(data.student_data.first_name || '');
        setLastName(data.student_data.last_name || '');
        setEmail(data.student_data.email || ''); // Charger l'email
        // Set the display name using student_data
        const displayName = `${data.student_data.first_name || ''} ${data.student_data.last_name || ''}`.trim();
        setEditedName(displayName || data.student_name || '');
      } else {
        // Fallback to direct properties in the correction object
        setFirstName(data.student_first_name || '');
        setLastName(data.student_last_name || '');
        setEmail(''); // Email vide par défaut si pas de student_data
        setEditedName(data.student_name || '');
      }
      
      // Set content items if available
      if (data.content_data && data.content_data.items) {
        setContentItems(data.content_data.items);
      }
      
      // Call the callback with the activity ID if provided
      if (onActivityIdCallback && data.activity_id) {
        onActivityIdCallback(data.activity_id);
      }
    } catch (error) {
      console.error('Error fetching correction:', error);
      setError('Échec du chargement des données de correction.');
    } finally {
      setLoading(false);
    }
  }, [correctionId, setFirstName, setLastName, setEmail, setEditedName, setContentItems, setCorrection, setError, setLoading]);

  // Save the correction
  const handleSaveCorrection = useCallback(async () => {
    if (!correction) return;
    
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Send current contentItems to the server but don't overwrite local state with response
      await correctionService.saveCorrection(
        correctionId,
        correction.studentName || '', // Add empty string fallback for undefined
        contentItems
      );
      
      // No need to update contentItems from the response since we want to keep local modifications
      // This ensures that the modified content from the UI is preserved
      
      setSuccessMessage('Correction sauvegardée avec succès');
      
      // Clear history after saving
      setHistory([]);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      // Utilisation du composant ErrorDisplay au lieu de setError
      setError('Erreur lors de la sauvegarde de la correction');
    } finally {
      setSaving(false);
    }
  }, [correction, contentItems, correctionId]);

  // Save the student name with more robust state handling
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
      const response = await fetch(`/api/corrections/${correctionId}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_first_name: firstNameToSend,
          student_last_name: lastNameToSend,
          student_email: emailToSend // Ajout du champ email
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCorrections] API Error:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du nom');
      }
      
      const updatedData = await response.json();

      // Update local state with the values we just sent
      setFirstName(firstNameToSend);
      setLastName(lastNameToSend);
      setEmail(emailToSend);
      
      // Then update the correction object with API response data
      setCorrection(prev => {
        if (!prev) return null;
        
        // Create an updated correction object that includes both local and API data
        const updated = {
          ...prev,
          studentName: updatedData.student_name || `${firstNameToSend} ${lastNameToSend}`.trim(),
          firstName: firstNameToSend,
          lastName: lastNameToSend,
          student_name: updatedData.student_name || `${firstNameToSend} ${lastNameToSend}`.trim(),
          student_first_name: firstNameToSend,
          student_last_name: lastNameToSend,
          // Update student_data if it exists
          student_data: prev.student_data ? {
            ...prev.student_data,
            first_name: firstNameToSend,
            last_name: lastNameToSend,
            email: emailToSend // Mise à jour de l'email dans student_data
          } : {
            // Create student_data if it doesn't exist
            first_name: firstNameToSend,
            last_name: lastNameToSend,
            email: emailToSend
          }
        };        
        return updated;
      });
      
      // Set display name based on what we know for sure (our sent values)
      const combinedName = `${firstNameToSend} ${lastNameToSend}`.trim();
      setEditedName(combinedName);
      
      setIsEditingName(false);
      setSuccessMessage('Informations de l\'étudiant mises à jour avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('[useCorrections] Error in handleSaveName:', err);
      setError('Erreur lors de la mise à jour des informations de l\'étudiant');
    } finally {
      setSaving(false);
    }
  }, [correction, correctionId, firstName, lastName, email]);

  // Save the grade and penalty
  const saveGradeAndPenalty = useCallback(async (
    experimentalGrade: number, 
    theoreticalGrade: number, 
    penalty: number
  ) => {
    if (!correction) return;
    
    setSavingGrade(true);
    
    try {
      // S'assurer que les valeurs sont des nombres valides
      const expGrade = isNaN(experimentalGrade) ? 0 : experimentalGrade;
      const theoGrade = isNaN(theoreticalGrade) ? 0 : theoreticalGrade;
      const penaltyValue = isNaN(penalty) ? 0 : penalty;

      // Calculate total grade
      const totalGrade = expGrade + theoGrade;

      
      const response = await fetch(`/api/corrections/${correctionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          grade: totalGrade,
          experimental_points_earned: expGrade,
          theoretical_points_earned: theoGrade,
          penalty: penaltyValue
        }),
      });
      
      if (!response.ok) {
        throw new Error('Échec de mise à jour de la note');
      }
      
      const updatedData = await response.json();
      
      // Use functional update to ensure proper typing
      setCorrection(prevCorrection => {
        if (!prevCorrection) return null;
        
        return {
          ...prevCorrection,
          grade: updatedData.grade,
          experimental_points_earned: updatedData.experimental_points_earned,
          theoretical_points_earned: updatedData.theoretical_points_earned,
          penalty: updatedData.penalty
        };
      });
      
      setSuccessMessage('Note mise à jour');
      setTimeout(() => {
        setSuccessMessage('');
      }, 1500);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour de la note');
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setSavingGrade(false);
    }
  }, [correction, correctionId, setError, setSuccessMessage]);

  // Fix this method to use correct field names matching the database schema
  const saveDates = async (
    deadline: string | null,      // Changed parameter name
    submissionDate: string | null
  ) => {
    try {
      setError('');
      setSaving(true);
      
      const response = await fetch(`/api/corrections/${correctionId}/dates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadline: deadline,       // Changed to use deadline instead of due_date
          submission_date: submissionDate,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de sauvegarde des dates');
      }
  
      const updatedCorrection = await response.json();
      
      // Fix the type issue by using functional state update
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          deadline: updatedCorrection.deadline,           // Changed to use deadline
          submission_date: updatedCorrection.submission_date
        };
      });
  
      setSuccessMessage('Dates sauvegardées avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(`Erreur lors de la sauvegarde des dates: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete the correction
  const handleDelete = useCallback(async () => {
    // First click only shows confirmation buttons
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    try {
      await correctionService.deleteCorrection(correctionId);

      // Navigate back to activity page
      if (correction?.activity_id) {
        router.push(`/activities/${correction.activity_id}`);
      } else {
        router.push('/');
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
      // Correction : éviter la comparaison avec true (boolean) puisque active est un number
      const isCurrentlyActive = correction.active === 1;
      const newActiveState = !isCurrentlyActive;
      
      const response = await fetch(`/api/corrections/${correctionId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: newActiveState }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification du statut');
      }
      
      const updatedCorrection = await response.json();
      
      // Mettre à jour la correction locale avec le nouveau statut
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          active: newActiveState ? 1 : 0
        };
      });
      
      setSuccessMessage(`Correction ${newActiveState ? 'activée' : 'désactivée'} avec succès`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la modification du statut de la correction');
    } finally {
      setSaving(false);
    }
  }, [correction, correctionId]);

  // Cancel delete confirmation
  const handleCancelDelete = useCallback(() => {
    setConfirmingDelete(false);
  }, []);

  // Update editedName when first or last name changes
  const updateNameFromParts = useCallback((first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    setEditedName(`${first} ${last}`.trim());
  }, []);

  // Fonction pour effacer l'erreur (nécessaire pour ErrorDisplay)
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    correction,
    contentItems,
    history,
    loading,
    saving,
    savingGrade,
    error,
    successMessage,
    editedName,
    firstName,
    lastName,
    email,
    isEditingName,
    confirmingDelete,
    correctionNotFound, // Exposer le nouvel état
    setContentItems,
    setError,
    setSuccessMessage,
    setEditedName,
    setFirstName,
    setLastName,
    setEmail,
    updateNameFromParts,
    setIsEditingName,
    saveToHistory,
    handleUndo,
    fetchCorrectionData,
    handleSaveCorrection,
    handleSaveName,
    handleDelete,
    handleToggleActive,
    handleCancelDelete,
    saveGradeAndPenalty,
    saveDates,
    clearError, // Ajout de la fonction clearError
  };
}
