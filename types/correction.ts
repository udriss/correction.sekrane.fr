export type ContentItemType = 'text' | 'list' | 'listItem';

export interface ContentItem {
  id: string;
  type: ContentItemType;
  content: string;
  parentId?: string;
  fragmentId?: number;  // ID du fragment d'origine
  fragmentName?: string; // Nom ou titre du fragment
}

export interface DragItem {
  index: number;
  id: string;
  type: string;
}

export interface ContentData {
  items: ContentItem[];
}
