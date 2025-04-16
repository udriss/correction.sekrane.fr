import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

// Get all classes
export async function GET() {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }
    // Get all classes
    const classes = await query(`
      SELECT * FROM classes ORDER BY created_at DESC
    `);
    
    // Get the count of students for each class
    const classesWithCounts = await Promise.all((classes as any[]).map(async (cls) => {
      // Count students
      const studentCountResult = await query<{ count: number }[]>(`
        SELECT COUNT(*) as count FROM class_students WHERE class_id = ?
      `, [cls.id]);
      
      // Count activities
      const activityCountResult = await query<{ count: number }[]>(`
        SELECT COUNT(*) as count FROM class_activities WHERE class_id = ?
      `, [cls.id]);
      
      return {
        ...cls,
        student_count: studentCountResult[0].count,
        activity_count: activityCountResult[0].count
      };
    }));
    
    return NextResponse.json(classesWithCounts);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ 
      error: error,
      details: error 
    }, { status: 500 });
  }
}

// Create a new class
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, academic_year, activity_ids, nbre_subclasses } = data;
    
    if (!name || !academic_year) {
      return NextResponse.json({ error: 'Name and academic year are required' }, { status: 400 });
    }
    
    // Use withConnection to handle transaction
    const newClass = await withConnection(async (connection) => {
      // First create the class with nbre_subclasses field
      const [result] = await connection.query(
        'INSERT INTO classes (name, description, academic_year, nbre_subclasses) VALUES (?, ?, ?, ?)',
        [name, description || null, academic_year, nbre_subclasses || null]
      );
      
      const classId = (result as any).insertId;
      
      // If activity_ids are provided, create the associations
      if (activity_ids && Array.isArray(activity_ids) && activity_ids.length > 0) {
        // Build values for multi-insert
        const values = activity_ids.map(activityId => [classId, activityId]);
        
        // Create multiple associations at once using a dynamic query
        const placeholders = activity_ids.map(() => '(?, ?)').join(', ');
        const params = activity_ids.flatMap(activityId => [classId, activityId]);
        
        await connection.query(
          `INSERT IGNORE INTO class_activities (class_id, activity_id) VALUES ${placeholders}`,
          params
        );
      }
      
      // Return the newly created class
      const [rows] = await connection.query('SELECT * FROM classes WHERE id = ?', [classId]);
      return (rows as any[])[0];
    });
    
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ 
      error: error,
      details: error 
    }, { status: 500 });
  }
}
