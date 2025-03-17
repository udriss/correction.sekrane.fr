// Copier le contenu au presse-papiers
export const copyToClipboard = (
  text: string,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
): void => {
  try {
    // Utiliser l'API moderne du presse-papiers si disponible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          onSuccess('Contenu copié dans le presse-papiers !');
        })
        .catch(err => {
          console.error('Erreur lors de la copie:', err);
          onError('Erreur lors de la copie dans le presse-papiers');
        });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';  // Éviter de perturber la mise en page
      document.body.appendChild(textarea);
      textarea.select();
      
      // Essayer de copier avec document.execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        onSuccess('Contenu copié dans le presse-papiers !');
      } else {
        onError('Votre navigateur ne permet pas la copie automatique');
      }
    }
  } catch (err) {
    console.error('Erreur lors de la copie:', err);
    onError('Erreur lors de la copie du contenu');
  }
};

