/**
 * Utility functions to track and retrieve recently added corrections
 * This allows for persistent filtering across page navigation
 */

// Store a correction ID in session storage as recently added
export const addRecentCorrection = (correctionId: number | string) => {
  if (typeof window !== 'undefined') {
    // Get existing recent corrections
    const storedIds = sessionStorage.getItem('recentCorrections');
    let recentIds: number[] = storedIds ? JSON.parse(storedIds) : [];
    
    // Add the new ID if not already present
    if (!recentIds.includes(Number(correctionId))) {
      recentIds.push(Number(correctionId));
      // Keep only last 50 corrections to avoid storage issues
      if (recentIds.length > 50) {
        recentIds = recentIds.slice(-50);
      }
      sessionStorage.setItem('recentCorrections', JSON.stringify(recentIds));
    }
  }
};

// Store multiple correction IDs in session storage as recently added
export const addRecentCorrections = (correctionIds: (number | string)[]) => {
  if (typeof window !== 'undefined' && correctionIds.length > 0) {
    // Get existing recent corrections
    const storedIds = sessionStorage.getItem('recentCorrections');
    let recentIds: number[] = storedIds ? JSON.parse(storedIds) : [];
    
    // Add the new IDs if not already present
    const numericIds = correctionIds.map(id => Number(id));
    const uniqueNewIds = numericIds.filter(id => !recentIds.includes(id));
    
    if (uniqueNewIds.length > 0) {
      recentIds = [...recentIds, ...uniqueNewIds];
      // Keep only last 50 corrections to avoid storage issues
      if (recentIds.length > 50) {
        recentIds = recentIds.slice(-50);
      }
      sessionStorage.setItem('recentCorrections', JSON.stringify(recentIds));
    }
  }
};

// Get recently added correction IDs from session storage
export const getRecentCorrections = (): number[] => {
  if (typeof window !== 'undefined') {
    const storedIds = sessionStorage.getItem('recentCorrections');
    return storedIds ? JSON.parse(storedIds) : [];
  }
  return [];
};

// Clear recently added corrections from session storage
export const clearRecentCorrections = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('recentCorrections');
  }
};

// Add a batch identifier to track corrections added in one operation
export const addCorrectionBatch = (batchIds: (number | string)[]) => {
  if (typeof window !== 'undefined' && batchIds.length > 0) {
    const batchId = Date.now().toString();
    const numericIds = batchIds.map(id => Number(id));
    sessionStorage.setItem(`correctionBatch_${batchId}`, JSON.stringify(numericIds));
    return batchId;
  }
  return null;
};

// Get corrections from a specific batch
export const getBatchCorrections = (batchId: string): number[] => {
  if (typeof window !== 'undefined') {
    const storedIds = sessionStorage.getItem(`correctionBatch_${batchId}`);
    return storedIds ? JSON.parse(storedIds) : [];
  }
  return [];
};
