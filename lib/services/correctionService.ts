import { Correction } from '../types';
import { ContentItem } from '@/types/correction';
import { parseHtmlToItems, generateHtmlFromItems } from '@/utils/htmlUtils';

// Define the content_data structure to help TypeScript understand the shape
interface ContentData {
  version: string;
  items: ContentItem[];
}

export async function fetchCorrection(id: string): Promise<Correction> {
  const response = await fetch(`/api/corrections/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch correction');
  }
  const data = await response.json();
  return data as Correction; // Ensure the response is cast to our Correction type
}

// Update the method signature to accept optional student_name
export async function saveCorrection(
  id: string, 
  studentName: string = '', // Provide default empty string
  contentItems: ContentItem[]
): Promise<Correction> {
  // Générer le HTML pour l'affichage
  const htmlContent = generateHtmlFromItems(contentItems);

  // Préparer les données structurées à sauvegarder
  const contentData: ContentData = {
    version: '1.0',
    items: contentItems
  };
  
  const response = await fetch(`/api/corrections/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_name: studentName,
      content: htmlContent,
      content_data: contentData
    }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la sauvegarde de la correction');
  }

  const data = await response.json();
  return data as Correction;
}

export async function updateCorrectionName(
  correctionId: string, 
  studentName: string
): Promise<Correction> {
  const response = await fetch(`/api/corrections/${correctionId}/name`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ student_name: studentName }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du nom');
  }

  return await response.json();
}

export async function updateCorrectionGrade(
  correctionId: string,
  grade: number,
  penalty: number
): Promise<any> {
  try {
    const response = await fetch(`/api/corrections/${correctionId}/grade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grade, penalty }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la mise à jour de la note');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    throw error;
  }
}

export async function deleteCorrection(correctionId: string): Promise<void> {
  const response = await fetch(`/api/corrections/${correctionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression');
  }
}

export function parseContentItems(correction: Correction): ContentItem[] {
  try {
    // Check if content_data exists and has the right shape
    if (correction.content_data) {
      // If it's an object with items property
      if (
        typeof correction.content_data === 'object' && 
        correction.content_data !== null &&
        'items' in correction.content_data && 
        Array.isArray((correction.content_data as any).items)
      ) {
        console.log('Chargement depuis content_data (objet)');
        return (correction.content_data as unknown as ContentData).items;
      }
      
      // If it's a string, try to parse it
      if (typeof correction.content_data === 'string') {
        console.log('Parsing de content_data (string)');
        try {
          const parsed = JSON.parse(correction.content_data);
          if (parsed && typeof parsed === 'object' && 'items' in parsed && Array.isArray(parsed.items)) {
            return parsed.items;
          }
        } catch (e) {
          console.error('Erreur parsing content_data:', e);
        }
      }
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des content items:', err);
  }
  
  // Fallback: parser le HTML
  console.log('Parsing du HTML content');
  return parseHtmlToItems(correction.content || '');
}
