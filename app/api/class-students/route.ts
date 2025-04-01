import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const classStudents = await query(
      `SELECT * FROM class_students ORDER BY id DESC`
    );
    
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
