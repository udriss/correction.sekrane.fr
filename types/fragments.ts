export interface Fragment {
  id: number;
  content: string;
  category?: string;
  tags: string[]; // Obligatoire, mais peut être tableau vide []
  activity_id?: number | null;  // Peut être null explicitement
  activity_name?: string | null; // Peut être null également
  created_at: string;
  updated_at?: string;
  usage_count?: number;
  isOwner?: boolean;
  user_id?: string;
  categories?: Array<{id: number, name: string}> | number[];
}

export interface Category {
  id: number;
  name: string;
  highlighted: boolean;
}

export interface Activity {
  id: number;
  name: string;
}
