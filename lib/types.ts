export interface Correction {
  id: number;
  student_id: number | null;
  activity_id: number;
  grade?: number;
  experimental_points_earned?: number;
  theoretical_points_earned?: number;
  submission_date?: string;
  content: string | null;
  content_data?: Date | string; // Could be JSON or string
  created_at?: Date | string;
  updated_at?: Date | string;
  penalty?: number | null;
  deadline?: Date | string | null;
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

// Ajoutons ou modifions le type Fragment pour qu'il soit uniforme dans toute l'application

export interface Fragment {
  id: number;
  content: string;
  // Make tags always an array of strings
  tags: string[];
  // Make categories always required
  categories: number[] | Array<{id: number, name: string}>;
  activity_id?: number | null;
  user_id?: string;
  isOwner?: boolean;
  activity_name?: string;
  isModified?: boolean;
  usage_count?: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
  _updateKey?: string;
  position_order?: number | null;
}

export interface CorrectionWithShareCode extends Correction {
  shareCode?: string | null;
  class_name?: string; // Ajout de la propriété class_name
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender: 'M' | 'F' | 'N';
  classId?: number | null;
  group?: string;
  // Support multiple data types for sub_class pour compatibilité avec les différentes parties de l'application
  sub_class?: number | string | null;
  // Propriétés additionnelles
  className?: string;
  corrections_count?: number;
  // Définir allClasses comme un tableau d'objets
  allClasses?: Array<{
    classId: number;
    className: string;
    sub_class?: string | null;
  }>;
  additionalClasses?: {id: number, name: string}[];
  created_at?: string;
  updated_at?: string;
}

export interface Class {
  id: number;
  name: string;
  year: string;
  academic_year?: string;
  description?: string;
  nbre_subclasses?: number;
  student_count?: number;
  activity_count?: number;
  created_at: string;
  updated_at: string;
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