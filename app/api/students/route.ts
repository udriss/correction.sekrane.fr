import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // First, get all students with their class associations
    const studentsWithClasses = await query<any[]>(`
      SELECT 
        s.*,
        cs.class_id AS classId,
        cs.sub_class AS sub_class,
        c.name AS className
      FROM 
        students s
      LEFT JOIN 
        class_students cs ON s.id = cs.student_id
      LEFT JOIN 
        classes c ON cs.class_id = c.id
      ORDER BY 
        s.last_name, s.first_name
    `);
    
    // Create a map to consolidate students
    const studentMap = new Map();
    
    // Process each row to consolidate students and their classes
    studentsWithClasses.forEach(student => {
      // If we haven't seen this student before, create a new entry
      if (!studentMap.has(student.id)) {
        // Create a new student object with base properties
        studentMap.set(student.id, {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          gender: student.gender,
          created_at: student.created_at,
          updated_at: student.updated_at,
          // Initialize the allClasses array
          allClasses: []
        });
      }
      
      // Add class info to the student's allClasses array if a class exists
      if (student.classId) {
        const currentStudent = studentMap.get(student.id);
        
        // Add class info to allClasses
        currentStudent.allClasses.push({
          classId: student.classId,
          className: student.className,
          sub_class: student.sub_class
        });
        
        // If this is the first class, also add it as the primary class
        if (!currentStudent.classId) {
          currentStudent.classId = student.classId;
          currentStudent.className = student.className;
          currentStudent.sub_class = student.sub_class;
        }
      }
    });
    
    // Convert the map to an array
    const consolidatedStudents = Array.from(studentMap.values());
    
    return NextResponse.json(consolidatedStudents);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
