// Fichier de déclaration de types global pour les importations @/

// Import the Correction type from our central location
import { Correction, Fragment } from '@/lib/types';

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
  // Re-export the Correction type from our central location
  export type { Correction } from '@/lib/types';
  
  export function createCorrection(correction: Correction): Promise<number>;
  export function getCorrectionsByActivityId(activityId: number): Promise<Correction[]>;
  export function getCorrectionById(id: number): Promise<Correction | null>;
  export function updateCorrection(id: number, correction: Correction): Promise<boolean>;
  export function deleteCorrection(id: number): Promise<boolean>;
  export function generateCorrectionName(activityId: number): Promise<string>;
}

declare module '@/lib/fragment' {
  // Re-export the Fragment type from our central location
  export type { Fragment } from '@/lib/types';
  
  export function createFragment(fragment: Fragment): Promise<number>;
  export function getFragmentsByActivityId(activityId: number): Promise<Fragment[]>;
  export function getFragmentById(id: number): Promise<Fragment | null>;
  export function updateFragment(id: number, content: string): Promise<boolean>;
  export function deleteFragment(id: number): Promise<boolean>;
}

declare module '@/lib/db' {
  import mysql from 'mysql2/promise';
  export function query<T>(sql: string, params?: any[]): Promise<T>;
    export function createCorrectionPool(): mysql.Pool;
  export function getPool(): mysql.Pool;
  export function initializeDatabase(): Promise<void>;
}

// Database related types
interface DatabaseResult {
  affectedRows?: number;
  insertId?: number;
  changedRows?: number;
}

// If you need to augment the NodeJS namespace
declare namespace NodeJS {
  interface ProcessEnv {
    // Environment variables used in the project
    DB_HOST: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    // Add other environment variables your app uses
  }
}

// If you want to enhance existing modules (module augmentation)
// For example, if you want to add a method to the Express Request:
// declare namespace Express {
//   interface Request {
//     currentUser?: { id: number; name: string };
//   }
// }

// If you need to declare a module that doesn't have types
// declare module 'some-module-without-types' {
//   export function someFunction(): void;
//   export const someValue: string;
// }

// DON'T include this, as it's already exported from lib/db.ts
// declare function query<T>(sql: string, params?: any[]): Promise<T>;
