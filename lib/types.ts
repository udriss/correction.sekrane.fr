export interface Correction {
  id: number;
  activity_id: number;
  student_name?: string;
  content?: string;
  content_data?: any;
  created_at?: string;
  updated_at?: string;
  grade?: number;
  penalty?: number;
  deadline?: string;
  submission_date?: string;
  activity_name?: string;
  experimental_points_earned?: number;
  theoretical_points_earned?: number;
  experimental_points?: number;
  theoretical_points?: number;
  shareCode?: string;
}

export interface Fragment {
  id: number;
  activity_id: number; // Changed from correction_id to align with actual usage
  content: string;
  created_at: string;
  updated_at: string;
  position_order?: number;
}
