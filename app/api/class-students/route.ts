import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const classId = url.searchParams.get('classId');
    
    let sql = 'SELECT * FROM class_students WHERE 1=1';
    const params: (number | string)[] = [];
    
    if (studentId) {
      sql += ' AND student_id = ?';
      params.push(parseInt(studentId));
    }
    
    if (classId) {
      sql += ' AND class_id = ?';
      params.push(parseInt(classId));
    }
    
    sql += ' ORDER BY id DESC';
    
    const classStudents = await query(sql, params);
    
    return NextResponse.json(classStudents);
  } catch (error) {
    console.error('Error fetching class-student relationships:', error);
    return NextResponse.json(
      { error: 'Error fetching class-student relationships' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { class_id, student_id, sub_class } = body;
    
    if (!class_id || !student_id) {
      return NextResponse.json(
        { error: 'Class ID and Student ID are required' },
        { status: 400 }
      );
    }
    
    interface InsertResult {
      insertId: number;
    }
    
    const result = await query<InsertResult>(
      `INSERT INTO class_students (class_id, student_id, sub_class, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [class_id, student_id, sub_class || null]
    );
    
    if (!result.insertId) {
      throw new Error('Failed to create class-student relationship');
    }
    
    interface ClassStudent {
      id: number;
      class_id: number;
      student_id: number;
      sub_class: string | null;
      created_at: string;
      updated_at: string;
    }
    
    const newClassStudent = await query<ClassStudent[]>(
      `SELECT * FROM class_students WHERE id = ?`,
      [result.insertId]
    );
    
    return NextResponse.json(newClassStudent[0]);
  } catch (error) {
    console.error('Error creating class-student relationship:', error);
    return NextResponse.json(
      { error: 'Error creating class-student relationship' },
      { status: 500 }
    );
  }
}
