'use client';

import React, { useState, useRef } from 'react';
import { Button, CircularProgress, IconButton } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';

interface ImageUploaderProps {
  activityId: number;
  correctionId?: string; // Added correctionId parameter
  onImageUploaded: (imageUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ activityId, correctionId, onImageUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('activityId', activityId.toString());
      
      // Add correctionId to the form data if available
      if (correctionId) {
        formData.append('correctionId', correctionId);
      } else {
        formData.append('correctionId', 'temp'); // Use a temporary ID if not available
      }

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      onImageUploaded(data.url);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <IconButton
        onClick={triggerFileInput}
        color="primary"
        size="medium"
        disabled={uploading}
        title="Ajouter une image"
        sx={{ height: 'fit-content', alignSelf: 'center' }}
      >
        {uploading ? (
          <CircularProgress size={20} />
        ) : (
          <ImageIcon fontSize='medium' />
        )}
      </IconButton>
      {error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </>
  );
};

export default ImageUploader;
