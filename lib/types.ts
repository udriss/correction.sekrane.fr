export interface Correction {
  id: number;
  activity_id: number;
  student_id: number | null;
  content: string | null;
  content_data?: Date | string; // Could be JSON or string
  created_at?: Date | string;
  updated_at?: Date | string;
  grade?: number | null;
  penalty?: number | null;
  deadline?: Date | string | null;
  submission_date?: Date | string | null;
  experimental_points_earned?: number | null;
  theoretical_points_earned?: number | null;
  group_id: number | null;
  class_id: number | null;
}

export interface ShareCode {
  id: number;
  code: string;
  correction_id: number;
  created_at: string;
  expires_at?: string | null;
  is_active: boolean;
}

export interface Fragment {
  id: number;
  content: string;
  tags?: string[] | string;
  categories?: Array<{id: number, name: string}> | number[];
  category?: string; // Pour compatibilité avec l'ancien format
  // Suppression de category_id qui n'existe plus
  activity_id?: number;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  activity_name?: string;
  usage_count?: number;
  isOwner?: boolean;
  isModified?: boolean;
}

export interface CorrectionWithShareCode extends Correction {
  shareCode?: string | null;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'M' | 'F' | 'N';
  // New property to match the API response
  allClasses?: { classId: number; className: string; sub_class?: number | null }[];
  created_at?: string;
  updated_at?: string;
}

export interface Class {
  id: number;
  name: string;
  description: string;
  academic_year: string;
  nbre_subclasses?: number | null;
  created_at: string;
  updated_at: string;
  // Add these properties returned by the API
  student_count?: number;
  activity_count?: number;
}

export interface ClassStudent {
  id: number;
  class_id: number;
  student_id: number;
  sub_class?: number | null;
  created_at?: string;
  updated_at?: string;
  // These fields are included when joined with student data
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
}