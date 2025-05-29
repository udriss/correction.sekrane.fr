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
  bonus?: number | null; // Ajout du champ bonus
  final_grade?: number | null; // Note finale: si (grade-penalty) < 5 et grade >= 5 alors 5, si grade < 5 alors grade, sinon (grade-penalty)
  deadline?: Date | string | null;
  group_id: number | null;
  class_id: number | null;
  active?: number; // 0 = inactive, 1 = active
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
  categories: Array<{id: number, name: string}>;
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
  email: string | null;
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

export interface ActivityAutre {
  id: number;
  name: string;
  content?: string | null;
  parts_names?: string[];
  points: number[];
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CorrectionAutre {
  id: number;
  student_id: number | null;
  activity_id: number;
  grade?: number | null;
  points_earned: number[]; // Array of points earned for each part
  submission_date?: Date | string;
  content?: string | null;
  content_data?: string | Record<string, any> | null; // Peut être un objet structuré ou null, plus de string
  created_at?: Date | string;
  updated_at?: Date | string;
  penalty?: number | null;
  bonus?: number | null; // Ajout du champ bonus
  final_grade?: number | null;
  deadline?: Date | string | null;
  group_id: number | null;
  class_id: number | null;
  active?: number; // 0 = inactive, 1 = active
  status?: string; // Ajout du statut pour compléter les propriétés attendues
}

export interface CorrectionAutreWithShareCode extends CorrectionAutre {
  shareCode?: string | null;
  class_name?: string;
}

export interface CorrectionAutreEnriched extends CorrectionAutreWithShareCode {
  shareCode?: string | null;
  activity_name?: string;
  student_name?: string;
  score_percentage?: number;
  status?: string;
  placeholder?: boolean;
  noQRCode?: boolean;
  sub_class?: string | number | null;
  // Nouvelles propriétés pour stocker les compteurs de corrections
  total_corrections_count?: number;
  class_corrections_count?: number;
  // Array of all corrections for the student
  all_corrections?: CorrectionAutreWithShareCode[];
}