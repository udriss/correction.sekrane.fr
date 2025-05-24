export type ContentItemType = 'text' | 'list' | 'listItem' | 'image' | 'audio';

export interface ContentItem {
  id: string;
  type: ContentItemType; // Utiliser le type unionné complet
  content?: string;
  src?: string; // URL de l'image
  alt?: string; // Texte alternatif
  position?: { x: number; y: number }; // Position pour les éléments draggables
  parentId?: string;
  childItems?: ContentItem[];
  fragmentId?: number;  // ID du fragment d'origine
  fragmentName?: string; // Nom ou titre du fragment
  modified?: boolean;  // Ajout d'un indicateur pour savoir si le fragment a été modifié
  // Added fragment tracking properties
  isFromFragment?: boolean;
  originalFragmentId?: number;
  originalContent?: string;
  wasFromFragment?: boolean;
}

export interface DragItem {
  index: number;
  id: string;
  type: string;
}

export interface ContentData {
  items: ContentItem[];
}
