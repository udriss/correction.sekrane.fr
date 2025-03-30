// Interfaces partagées entre les composants

export interface Student {
  id: number;
  email: string | null;
  first_name: string;
  last_name: string;
  gender: 'M' | 'F' | 'N';
  created_at: string;
  updated_at: string;
  phone?: string;
  code?: string;
  classId?: number;
  group?: string;
}

export interface Correction {
  id: number;
  activity_id: number;
  content: string | null;
  content_data: any | null;
  created_at: string;
  updated_at: string;
  grade: number | null;
  penalty: number | null;
  deadline: string | null;
  submission_date: string | null;
  experimental_points_earned: number | null;
  theoretical_points_earned: number | null;
  group_id: number | null;
  class_id: number | null;
  student_id: number | null;
  activity_name?: string;
  class_name?: string;
  experimental_points?: number;
  theoretical_points?: number;
}

export interface Class {
  id: number;
  name: string;
  description: string | null;
  academic_year: string;
  created_at: string;
  updated_at: string;
  nbre_subclasses: number | null;
  student_count?: number;
  sub_class?: number | null;
  year?: string;
}

export interface StudentStats {
  averageGrade: number;
  totalCorrections: number;
  bestGrade: number;
  worstGrade: number;
  latestSubmission: string;
  totalActivities: number;
  classesCount: number;
  gradedCount: number;
  ungradedCount: number;
}
