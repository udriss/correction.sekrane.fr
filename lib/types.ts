export interface Correction {
  id: number;
  name: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fragment {
  id: number;
  correction_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}
