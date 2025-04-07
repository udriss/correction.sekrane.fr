'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Interface pour le contexte de suppression par lots
interface BatchDeleteContextType {
  batchDeleteMode: boolean;
  setBatchDeleteMode: (mode: boolean) => void;
  selectedCorrections: string[];
  setSelectedCorrections: (ids: string[]) => void;
  toggleCorrectionSelection: (id: string) => void;
  deletingCorrections: Set<string>; // Track which corrections are being deleted
  setDeletingCorrection: (correctionId: string, deleting: boolean) => void; // Set deletion status
}

// Création du contexte avec des valeurs par défaut
const BatchDeleteContext = createContext<BatchDeleteContextType | undefined>(undefined);

// Hook pour accéder au contexte
export const useBatchDelete = () => {
  const context = useContext(BatchDeleteContext);
  if (context === undefined) {
    throw new Error('useBatchDelete must be used within a BatchDeleteProvider');
  }
  return context;
};

// Composant provider qui fournira le contexte à l'application
export const BatchDeleteProvider = ({ children }: { children: React.ReactNode }) => {
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);
  const [selectedCorrections, setSelectedCorrections] = useState<string[]>([]);
  const [deletingCorrections, setDeletingCorrections] = useState<Set<string>>(new Set());

  const toggleCorrectionSelection = useCallback((id: string) => {
    setSelectedCorrections(prev => 
      prev.includes(id) 
        ? prev.filter(corrId => corrId !== id) 
        : [...prev, id]
    );
  }, []);

  // Function to update the deleting status of a correction
  const setDeletingCorrection = useCallback((correctionId: string, deleting: boolean) => {
    setDeletingCorrections(prev => {
      const newSet = new Set(prev);
      if (deleting) {
        newSet.add(correctionId);
      } else {
        newSet.delete(correctionId);
      }
      return newSet;
    });
  }, []);

  const value = {
    batchDeleteMode,
    setBatchDeleteMode,
    selectedCorrections,
    setSelectedCorrections,
    toggleCorrectionSelection,
    deletingCorrections,
    setDeletingCorrection
  };
  
  return (
    <BatchDeleteContext.Provider value={value}>
      {children}
    </BatchDeleteContext.Provider>
  );
};

export default BatchDeleteProvider;