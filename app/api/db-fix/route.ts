import { NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(request: Request) {
  try {
    return await withConnection(async (connection) => {
      // First, drop the existing foreign key constraint
      await connection.query(`
        ALTER TABLE class_students 
        DROP FOREIGN KEY class_students_ibfk_2
      `);
      
      // Then recreate it with ON UPDATE CASCADE
      await connection.query(`
        ALTER TABLE class_students 
        ADD CONSTRAINT class_students_ibfk_2 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Foreign key constraint updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating foreign key constraint:', error);
    return NextResponse.json(
      { error: 'Error updating foreign key constraint', details: String(error) },
      { status: 500 }
    );
  }
}
