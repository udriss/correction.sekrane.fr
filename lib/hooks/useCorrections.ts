import { useState, useCallback } from 'react';
import { Correction } from '@/lib/types';
import { ContentItem } from '@/types/correction';
import * as correctionService from '../services/correctionService';
import { useRouter } from 'next/navigation';

// Define the ContentData interface here or import it to ensure consistency
interface ContentData {
  version: string;
  items: ContentItem[];
}

interface LocalCorrection extends Omit<Correction, 'activity_id'> {
  studentName?: string;
  firstName?: string;
  lastName?: string;
  activity_id: number;
  deadline?: string;
  submission_date?: string;
  grade?: number;
  experimental_points_earned?: number;
  theoretical_points_earned?: number;
  penalty?: number;
  student_name?: string;
  student_first_name?: string;
  student_last_name?: string;
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
  const [successMessage, setSuccessMessage] = useState('');
  const [editedName, setEditedName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
    try {
      const response = await fetch(`/api/corrections/${correctionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch correction');
      }
      const data = await response.json();
      
      setCorrection(data);
      // Extract and set student data from the new structure
      if (data.student_data) {
        // Use the dedicated student_data object when available
        setFirstName(data.student_data.first_name || '');
        setLastName(data.student_data.last_name || '');
        // Set the display name using student_data
        const displayName = `${data.student_data.first_name || ''} ${data.student_data.last_name || ''}`.trim();
        setEditedName(displayName || data.student_name || '');
      } else {
        // Fallback to direct properties in the correction object
        setFirstName(data.student_first_name || '');
        setLastName(data.student_last_name || '');
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
      setError('Failed to load correction data.');
    } finally {
      setLoading(false);
    }
  }, [correctionId, setFirstName, setLastName, setEditedName, setContentItems, setCorrection, setError, setLoading]);

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
      setError('Erreur lors de la sauvegarde de la correction');
    } finally {
      setSaving(false);
    }
  }, [correction, contentItems, correctionId]);

  // Save the student name with more robust state handling
  const handleSaveName = useCallback(async (overrideFirstName?: string, overrideLastName?: string) => {
    if (!correction) return;
    
    // Use override values if provided, otherwise use state values
    const firstNameToSend = overrideFirstName !== undefined ? overrideFirstName : firstName;
    const lastNameToSend = overrideLastName !== undefined ? overrideLastName : lastName;

    // Validate before proceeding
    if (!firstNameToSend && !lastNameToSend) {
      setError('Le prénom ou le nom est requis');
      return;
    }
    
    setError('');
    setSaving(true);
    
    try {
      // Direct API call
      const response = await fetch(`/api/corrections/${correctionId}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_first_name: firstNameToSend,
          student_last_name: lastNameToSend
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useCorrections] API Error:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du nom');
      }
      
      const updatedData = await response.json();

      // IMPORTANT: First update local state with the values we just sent
      // This ensures immediate consistency with what user entered
      setFirstName(firstNameToSend);
      setLastName(lastNameToSend);
      
      // Then update the correction object with API response data
      setCorrection(prev => {
        if (!prev) return null;
        
        // Create an updated correction object that includes both local and API data
        const updated = {
          ...prev,
          studentName: updatedData.student_name || `${firstNameToSend} ${lastNameToSend}`.trim(),
          firstName: firstNameToSend, // Use our sent values to ensure consistency
          lastName: lastNameToSend,   // Use our sent values to ensure consistency
          student_name: updatedData.student_name || `${firstNameToSend} ${lastNameToSend}`.trim(),
          student_first_name: firstNameToSend,
          student_last_name: lastNameToSend,
          // Update student_data if it exists
          student_data: prev.student_data ? {
            ...prev.student_data,
            first_name: firstNameToSend,
            last_name: lastNameToSend
          } : undefined
        };        
        return updated;
      });
      
      // Set display name based on what we know for sure (our sent values)
      const combinedName = `${firstNameToSend} ${lastNameToSend}`.trim();
      setEditedName(combinedName);
      
      setIsEditingName(false);
      setSuccessMessage('Nom mis à jour avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('[useCorrections] Error in handleSaveName:', err);
      setError('Erreur lors de la mise à jour du nom');
    } finally {
      setSaving(false);
    }
  }, [correction, correctionId, firstName, lastName]);

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
        throw new Error('Failed to update grade');
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
        throw new Error(errorData.message || 'Failed to save dates');
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
    firstName,        // Add the new state variables
    lastName,
    isEditingName,
    confirmingDelete,
    setContentItems,
    setError,
    setSuccessMessage,
    setEditedName,
    setFirstName,     // Add setters for new state variables
    setLastName,
    updateNameFromParts, // Add the new utility function
    setIsEditingName,
    saveToHistory,
    handleUndo,
    fetchCorrectionData,
    handleSaveCorrection,
    handleSaveName,
    handleDelete,
    handleCancelDelete,
    saveGradeAndPenalty,
    saveDates,
  };
}
