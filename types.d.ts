// Fichier de déclaration de types global pour les importations @/

// Déclaration des modules pour les importations avec @/
declare module '@/lib/activity' {
  export interface Activity {
    id?: number;
    name: string;
    content?: string;
    created_at?: Date;
    updated_at?: Date;
  }
  
  export function createActivity(activity: Activity): Promise<number>;
  export function getActivities(): Promise<Activity[]>;
  export function getActivityById(id: number): Promise<Activity | null>;
  export function updateActivity(id: number, activity: Activity): Promise<boolean>;
  export function deleteActivity(id: number): Promise<boolean>;
}

declare module '@/lib/correction' {
  export interface Correction {
    id?: number;
    activity_id: number;
    student_name?: string;
    content?: string;
    created_at?: Date;
    updated_at?: Date;
    activity_name?: string;
  }
  
  export function createCorrection(correction: Correction): Promise<number>;
  export function getCorrectionsByActivityId(activityId: number): Promise<Correction[]>;
  export function getCorrectionById(id: number): Promise<Correction | null>;
  export function updateCorrection(id: number, correction: Correction): Promise<boolean>;
  export function deleteCorrection(id: number): Promise<boolean>;
  export function generateCorrectionName(activityId: number): Promise<string>;
}

declare module '@/lib/fragment' {
  export interface Fragment {
    id?: number;
    activity_id: number;
    content: string;
    created_at?: Date;
    updated_at?: Date;
    position_order?: number;
  }
  
  export function createFragment(fragment: Fragment): Promise<number>;
  export function getFragmentsByActivityId(activityId: number): Promise<Fragment[]>;
  export function getFragmentById(id: number): Promise<Fragment | null>;
  export function updateFragment(id: number, content: string): Promise<boolean>;
  export function deleteFragment(id: number): Promise<boolean>;
}

declare module '@/lib/db' {
  import mysql from 'mysql2/promise';
  
  export function createCorrectionPool(): mysql.Pool;
  export function getPool(): mysql.Pool;
  export function initializeDatabase(): Promise<void>;
}
