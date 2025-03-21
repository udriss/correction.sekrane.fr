import { NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution des paramètres
    const { id } = await params;
    
    // Vérifier que l'ID est un nombre valide
    const activityId = parseInt(id, 10);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID d\'activité invalide' }, { status: 400 });
    }

    // Récupérer toutes les corrections pour cette activité
    return await withConnection(async (connection) => {
      const [rows] = await connection.query(
        `SELECT * FROM corrections WHERE activity_id = ? ORDER BY created_at DESC`,
        [activityId]
      );
      
      return NextResponse.json(rows);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des corrections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Vérifier que tous les champs requis sont présents
    console.log("Données de création de correction reçues:", {
      activity_id: data.activity_id,
      student_name: data.student_name,
      exp_points: data.experimental_points_earned,
      theo_points: data.theoretical_points_earned,
      deadline: data.deadline || null,
      submission_date: data.submission_date || null
    });
    
    if (!data.activity_id || !data.student_name) {
      return NextResponse.json(
        { error: "L'ID de l'activité et le nom de l'étudiant sont requis" },
        { status: 400 }
      );
    }

    // Validation pour éviter les erreurs si les valeurs ne sont pas des nombres
    const expPoints = parseFloat(data.experimental_points_earned) || 0;
    const theoPoints = parseFloat(data.theoretical_points_earned) || 0;
    
    // Calcul de la note totale (grade)
    const totalGrade = expPoints + theoPoints;
    
    console.log(`Points enregistrés pour ${data.student_name}: Exp=${expPoints}, Theo=${theoPoints}, Total=${totalGrade}`);
    
    // Version mise à jour avec les champs existants dans la base de données
    const correctionData = {
      activity_id: data.activity_id,
      student_name: data.student_name || null,
      content: data.content || '',
      experimental_points_earned: expPoints,
      theoretical_points_earned: theoPoints,
      grade: totalGrade,             // Ajout du calcul de la note totale
      penalty: 0,                    // Initialisation de la pénalité à 0
      deadline: data.deadline || null,
      submission_date: data.submission_date || null
    };

    return await withConnection(async (connection) => {
      // Insérer la correction avec tous les champs existants, y compris grade et penalty
      const [result] = await connection.query(
        `INSERT INTO corrections 
         (activity_id, student_name, content, experimental_points_earned, theoretical_points_earned, grade, penalty, deadline, submission_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          correctionData.activity_id,
          correctionData.student_name,
          correctionData.content,
          correctionData.experimental_points_earned, 
          correctionData.theoretical_points_earned,
          correctionData.grade,
          correctionData.penalty,
          correctionData.deadline,
          correctionData.submission_date
        ]
      );
      
      const id = (result as any).insertId;
      console.log(`Correction créée avec ID=${id}, expPoints=${expPoints}, theoPoints=${theoPoints}, grade=${totalGrade}, penalty=0`);
      
      return NextResponse.json({ 
        id, 
        ...correctionData
      }, { status: 201 });
    });
  } catch (error) {
    console.error('Erreur lors de la création de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la correction', details: String(error) },
      { status: 500 }
    );
  }
}
