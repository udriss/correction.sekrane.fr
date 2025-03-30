import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Read-only endpoint that returns relationship data between entities
export async function GET(req: NextRequest) {
  try {

    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    // First, verify the user is authenticated
    if (!userId) {
        return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
      }
    
    
    // Parse URL search params
    const url = new URL(req.url);
    const classIdsParam = url.searchParams.get('classIds') || '';
    const studentIdsParam = url.searchParams.get('studentIds') || '';
    const activityIdsParam = url.searchParams.get('activityIds') || '';
    const categoryIdsParam = url.searchParams.get('categoryIds') || '';
    const fragmentIdsParam = url.searchParams.get('fragmentIds') || '';
    
    // Convert comma-separated strings to arrays of numbers
    const classIds = classIdsParam ? classIdsParam.split(',').map(Number) : [];
    const studentIds = studentIdsParam ? studentIdsParam.split(',').map(Number) : [];
    const activityIds = activityIdsParam ? activityIdsParam.split(',').map(Number) : [];
    const categoryIds = categoryIdsParam ? categoryIdsParam.split(',').map(Number) : [];
    const fragmentIds = fragmentIdsParam ? fragmentIdsParam.split(',').map(Number) : [];
    
    // Prepare empty results
    const result: any = {};
    
    try {
      // Only fetch data for IDs that were provided
      if (classIds.length > 0 || studentIds.length > 0) {
        // Fetch class-student relationships from class_students table
        result.classStudents = await query(`
          SELECT * FROM class_students 
          WHERE ${classIds.length > 0 ? `class_id IN (${classIds.join(',')})` : '1=1'}
          ${studentIds.length > 0 ? `AND student_id IN (${studentIds.join(',')})` : ''}
        `);
      }
      
      if (activityIds?.length > 0 || studentIds?.length > 0) {
        // Fetch student activities from corrections table, including NULL grades
        result.studentActivities = await query(`
          SELECT DISTINCT student_id, activity_id, grade 
          FROM corrections 
          WHERE ${activityIds.length > 0 ? `activity_id IN (${activityIds.join(',')})` : '1=1'}
          ${studentIds.length > 0 ? `AND student_id IN (${studentIds.join(',')})` : ''}
        `);
      }
      
      if (classIds?.length > 0 || activityIds?.length > 0) {
        // Fetch class activities from class_activities table
        result.classActivities = await query(`
          SELECT * FROM class_activities 
          WHERE ${classIds.length > 0 ? `class_id IN (${classIds.join(',')})` : '1=1'}
          ${activityIds.length > 0 ? `AND activity_id IN (${activityIds.join(',')})` : ''}
        `);
      }
      
      if (activityIds?.length > 0) {
        // Fetch activity corrections with grades
        result.activityCorrections = await query(`
          SELECT activity_id, grade 
          FROM corrections 
          WHERE activity_id IN (${activityIds.join(',')})
        `);
        
        // Also fetch the activity points data for proper grade calculations
        result.activitiesData = await query(`
          SELECT id, name, experimental_points, theoretical_points
          FROM activities
          WHERE id IN (${activityIds.join(',')})
        `);
      }
      
      // Note: According to the CSV data, activities don't directly link to categories
      // Activities have properties: name, content, experimental_points, theoretical_points, user_id
      // No direct relationship exists in the schema between activities and categories
      
      if (fragmentIds?.length > 0 || categoryIds?.length > 0) {
        // Fetch fragment categories from fragments_categories junction table
        result.fragmentCategories = await query(`
          SELECT * FROM fragments_categories 
          WHERE ${fragmentIds.length > 0 ? `fragment_id IN (${fragmentIds.join(',')})` : '1=1'}
          ${categoryIds.length > 0 ? `AND category_id IN (${categoryIds.join(',')})` : ''}
        `);
      }
      
    } catch (dbError: any) {
      // Check for specific database connection errors
      if (dbError.code === 'ER_CON_COUNT_ERROR' || 
          dbError.message?.includes('too many connections') ||
          dbError.errno === 1040) {
        console.error('Database connection limit reached:', dbError);
        return NextResponse.json(
          { error: 'Trop de connexions à la base de données. Veuillez réessayer dans quelques instants.' }, 
          { status: 503 }
        );
      }
      
      // For other database errors, re-throw
      throw dbError;
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching relationship data:', error);
    
    // Provide more descriptive error message based on error type
    const errorMessage = error.code === 'ECONNREFUSED' 
      ? 'Impossible de se connecter à la base de données. Veuillez réessayer plus tard.'
      : error.message || 'Failed to fetch relationship data';
      
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Keep POST method as a fallback for larger datasets
export async function POST(req: NextRequest) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    // First, verify the user is authenticated
    if (!userId) {
        return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
      }
    
    // Parse request body
    const { classIds, studentIds, activityIds, categoryIds, fragmentIds } = await req.json();
    
    // Prepare empty results
    const result: any = {};
    
    try {
      // Only fetch data for IDs that were provided
      if (classIds?.length > 0 || studentIds?.length > 0) {
        // Fetch class-student relationships from class_students table
        result.classStudents = await query(`
          SELECT * FROM class_students 
          WHERE ${classIds.length > 0 ? `class_id IN (${classIds.join(',')})` : '1=1'}
          ${studentIds.length > 0 ? `AND student_id IN (${studentIds.join(',')})` : ''}
        `);
      }
      
      if (activityIds?.length > 0 || studentIds?.length > 0) {
        // Fetch student activities from corrections table, including NULL grades
        result.studentActivities = await query(`
          SELECT DISTINCT student_id, activity_id, grade 
          FROM corrections 
          WHERE ${activityIds.length > 0 ? `activity_id IN (${activityIds.join(',')})` : '1=1'}
          ${studentIds.length > 0 ? `AND student_id IN (${studentIds.join(',')})` : ''}
        `);
      }
      
      if (classIds?.length > 0 || activityIds?.length > 0) {
        // Fetch class activities from class_activities table
        result.classActivities = await query(`
          SELECT * FROM class_activities 
          WHERE ${classIds.length > 0 ? `class_id IN (${classIds.join(',')})` : '1=1'}
          ${activityIds.length > 0 ? `AND activity_id IN (${activityIds.join(',')})` : ''}
        `);
      }
      
      if (activityIds?.length > 0) {
        // Fetch activity corrections with grades
        result.activityCorrections = await query(`
          SELECT activity_id, grade 
          FROM corrections 
          WHERE activity_id IN (${activityIds.join(',')})
        `);
        
        // Also fetch the activity points data for proper grade calculations
        result.activitiesData = await query(`
          SELECT id, name, experimental_points, theoretical_points
          FROM activities
          WHERE id IN (${activityIds.join(',')})
        `);
      }
      
      // Note: According to the CSV data, activities don't directly link to categories
      // Activities have properties: name, content, experimental_points, theoretical_points, user_id
      // No direct relationship exists in the schema between activities and categories
      
      if (fragmentIds?.length > 0 || categoryIds?.length > 0) {
        // Fetch fragment categories from fragments_categories junction table
        result.fragmentCategories = await query(`
          SELECT * FROM fragments_categories 
          WHERE ${fragmentIds.length > 0 ? `fragment_id IN (${fragmentIds.join(',')})` : '1=1'}
          ${categoryIds.length > 0 ? `AND category_id IN (${categoryIds.join(',')})` : ''}
        `);
      }
      
    } catch (dbError: any) {
      // Check for specific database connection errors
      if (dbError.code === 'ER_CON_COUNT_ERROR' || 
          dbError.message?.includes('too many connections') ||
          dbError.errno === 1040) {
        console.error('Database connection limit reached:', dbError);
        return NextResponse.json(
          { error: 'Trop de connexions à la base de données. Veuillez réessayer dans quelques instants.' }, 
          { status: 503 }
        );
      }
      
      // For other database errors, re-throw
      throw dbError;
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching relationship data:', error);
    
    // Provide more descriptive error message based on error type
    const errorMessage = error.code === 'ECONNREFUSED' 
      ? 'Impossible de se connecter à la base de données. Veuillez réessayer plus tard.'
      : error.message || 'Failed to fetch relationship data';
      
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
