import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface StatusMessagesProps {
  successMessage: string;
  copiedMessage: string;
  error: string;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({
  successMessage: propSuccessMessage,
  copiedMessage,
  error: propError
}) => {
  // États locaux pour gérer les messages déclenchés par les événements personnalisés
  const [localSuccessMessage, setLocalSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  
  // Utilisation des messages des props ou des messages locaux (pour les événements)
  const successMessage = propSuccessMessage || localSuccessMessage;
  const error = propError || localError;

  // Écouteurs d'événements pour les mises à jour de notes
  useEffect(() => {
    // Gestionnaire pour l'événement de mise à jour de note réussie
    const handleGradeUpdated = (event: CustomEvent) => {
      setLocalSuccessMessage(event.detail?.message || 'Note mise à jour');
      // Effacer le message après quelques secondes
      setTimeout(() => setLocalSuccessMessage(''), 3000);
    };
    
    // Gestionnaire pour l'événement d'erreur de mise à jour de note
    const handleGradeError = (event: CustomEvent) => {
      setLocalError(event.detail?.message || 'Erreur lors de la mise à jour de la note');
      // Effacer le message d'erreur après quelques secondes
      setTimeout(() => setLocalError(''), 5000);
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('gradeUpdated', handleGradeUpdated as EventListener);
    window.addEventListener('gradeError', handleGradeError as EventListener);
    
    // Nettoyage des écouteurs lors du démontage du composant
    return () => {
      window.removeEventListener('gradeUpdated', handleGradeUpdated as EventListener);
      window.removeEventListener('gradeError', handleGradeError as EventListener);
    };
  }, []);

  if (!successMessage && !copiedMessage && !error) return null;
  
  return (
    <>
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => {}}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!copiedMessage} 
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => {}}>
          {copiedMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => {}}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default StatusMessages;
