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

export function useCorrections(correctionId: string) {
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<ContentItem[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editedName, setEditedName] = useState('');
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
  const fetchCorrectionData = useCallback(async (activityIdCallback: (id: number) => void) => {
    setLoading(true);
    setError('');
    
    try {
      const correctionData = await correctionService.fetchCorrection(correctionId);
      
      // Ensure we have a valid id before setting the correction
      if (correctionData && typeof correctionData.id === 'number') {
        setCorrection(correctionData);
        setEditedName(correctionData.student_name || '');
        
        // Set the initial selected activity ID by calling the callback
        if (correctionData.activity_id) {
          activityIdCallback(correctionData.activity_id);
        }
        
        // Parse the content items
        const items = correctionService.parseContentItems(correctionData);
        setContentItems(items);
      } else {
        throw new Error('Invalid correction data received');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement de la correction');
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
      // Send current contentItems to the server but don't overwrite local state with response
      await correctionService.saveCorrection(
        correctionId,
        correction.student_name || '', // Add empty string fallback for undefined
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

  // Save the student name
  const handleSaveName = useCallback(async () => {
    if (!correction) return;
    
    setError('');
    setSaving(true);
    
    try {
      const updatedData = await correctionService.updateCorrectionName(
        correctionId,
        editedName
      );
      
      // Fix the type issue by using functional state update pattern
      setCorrection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          student_name: updatedData.student_name || '' // Ensure it's never undefined
        };
      });
      
      setIsEditingName(false);
      setSuccessMessage('Nom mis à jour avec succès');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du nom');
    } finally {
      setSaving(false);
    }
  }, [correction, editedName, correctionId]);

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
      
      console.log('Saving grades:', { 
        experimental: expGrade, 
        theoretical: theoGrade,
        total: totalGrade,
        penalty: penaltyValue
      });
      
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
      console.log('Received updated data:', updatedData);
      
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
    isEditingName,
    confirmingDelete,
    setContentItems,
    setError,
    setSuccessMessage,
    setEditedName,
    setIsEditingName,
    saveToHistory,
    handleUndo,
    fetchCorrectionData,
    handleSaveCorrection,
    handleSaveName,
    handleDelete,
    handleCancelDelete,
    saveGradeAndPenalty,
    saveDates, // Add the new method here
  };
}
