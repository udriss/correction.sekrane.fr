import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { getUser } from '@/lib/auth';
import authOptions from '@/lib/auth';

// Get all students
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    // Get students with class information in a single query
    const students = await query(`
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
    
    
    return NextResponse.json(students);
    
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des étudiants' }, 
      { status: 500 }
    );
  }
}

// Create a new student
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    let { email, first_name, last_name, gender } = data;
    
    if (!first_name || !last_name || !gender) {
      return NextResponse.json({
        error: 'First name, last name, and gender are required'
      }, { status: 400 });
    }
    
    // Traiter l'email vide comme NULL
    if (!email || email.trim() === '') {
      email = null;
    }
    
    // Créer l'étudiant avec email NULL si vide
    const result = await query(
      'INSERT INTO students (email, first_name, last_name, gender) VALUES (?, ?, ?, ?)',
      [email, first_name, last_name, gender]
    );
    
    const studentId = (result as any).insertId;
    
    // Récupérer et retourner l'étudiant créé
    const newStudent = await query('SELECT * FROM students WHERE id = ?', [studentId]);
    
    return NextResponse.json((newStudent as any[])[0], { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
