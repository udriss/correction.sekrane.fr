import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Get the code parameter using the new async pattern
    const { code } = await params;
    
    // Validate that code is not empty or undefined
    if (!code || code === 'undefined' || code === 'null') {
      return NextResponse.json({ error: 'Code de partage invalide' }, { status: 400 });
    }

    return await withConnection(async (connection) => {
      // Use parameterized query with the code as string
      const [shares] = await connection.query(
        `SELECT correction_id FROM share_codes 
         WHERE code = ? AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [code]
      );

      if (!Array.isArray(shares) || shares.length === 0) {
        return NextResponse.json(
          { error: 'Code de partage invalide ou expiré' },
          { status: 404 }
        );
      }

      const correctionId = (shares[0] as any).correction_id;

      // Récupérer la correction avec les notes et calculer le grade si nécessaire
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name, a.experimental_points, a.theoretical_points,
                IFNULL(c.grade, (c.experimental_points_earned + c.theoretical_points_earned)) as grade, 
                IFNULL(c.penalty, 0) as penalty,
                (IFNULL(c.grade, (c.experimental_points_earned + c.theoretical_points_earned)) - IFNULL(c.penalty, 0)) as final_grade
         FROM corrections c 
         JOIN activities a ON c.activity_id = a.id 
         WHERE c.id = ?`,
        [correctionId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Correction non trouvée' },
          { status: 404 }
        );
      }

      const correction = rows[0] as any;

      // Si content_data existe et est une string, parser en JSON
      if (correction.content_data && typeof correction.content_data === 'string') {
        try {
          correction.content_data = JSON.parse(correction.content_data);
        } catch (e) {
          console.error('Erreur de parsing content_data:', e);
        }
      }

      // Si la correction n'a pas de grade ou penalty enregistrés, les mettre à jour pour une utilisation future
      if (correction.grade === null || correction.penalty === null) {
        const totalGrade = parseFloat(correction.experimental_points_earned || 0) + parseFloat(correction.theoretical_points_earned || 0);
        await connection.query(
          `UPDATE corrections SET grade = ?, penalty = 0 WHERE id = ? AND (grade IS NULL OR penalty IS NULL)`,
          [totalGrade, correctionId]
        );
      }

      // Ajouter l'information que cette correction est accédée via un lien de partage
      correction.shared = true;

      return NextResponse.json(correction);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la correction partagée:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Get the code from params using the new async pattern
    const { code } = await params;
    
    // Check if code is valid
    if (!code || code === 'undefined' || code === 'null') {
      return NextResponse.json({ error: 'Code de partage invalide' }, { status: 400 });
    }
    
    // Try to parse the code as integer if needed
    const codeValue = parseInt(code);
    
    if (isNaN(codeValue)) {
      return NextResponse.json({ error: 'Code de partage invalide' }, { status: 400 });
    }
    
    // Récupérer les données du corps de la requête
    const body = await request.json();
    console.log("Données reçues à sauvegarder:", body);
    
    // Utiliser withConnection pour s'assurer que les connexions sont libérées
    return await withConnection(async (connection) => {
      // D'abord récupérer l'ID de la correction à partir du code de partage
      const [rows] = await connection.query(
        `SELECT correction_id FROM shared_corrections WHERE share_code = ?`, 
        [codeValue]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Code de partage invalide' },
          { status: 404 }
        );
      }
      
      const correctionId = (rows[0] as any).correction_id;
      
      // Préparer les données pour la mise à jour
      const contentData = {
        fragments: body.fragments || []
      };
      
      // Mettre à jour la correction avec toutes les données nécessaires
      const [updateResult] = await connection.query(
        `UPDATE corrections 
         SET content = ?, 
             content_data = ?,
             student_name = ?,
             experimental_points_earned = ?,
             theoretical_points_earned = ?
         WHERE id = ?`,
        [
          body.content || '',
          JSON.stringify(contentData),
          body.student_name,
          body.experimental_points_earned,
          body.theoretical_points_earned,
          correctionId
        ]
      );
      
      // Récupérer la correction mise à jour
      const [updatedRows] = await connection.query(
        `SELECT c.*, a.name as activity_name, a.experimental_points, a.theoretical_points 
         FROM corrections c
         JOIN activities a ON c.activity_id = a.id
         WHERE c.id = ?`,
        [correctionId]
      );
      
      if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération de la correction mise à jour' },
          { status: 500 }
        );
      }
      
      // Traitement de content_data pour le convertir en objet
      const correction = updatedRows[0] as any;
      try {
        if (correction.content_data && typeof correction.content_data === 'string') {
          correction.content_data = JSON.parse(correction.content_data);
        }
      } catch (e) {
        console.error('Erreur parsing content_data', e);
        correction.content_data = { fragments: [] };
      }
      
      console.log("Correction mise à jour:", correction);
      
      return NextResponse.json(correction);
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la correction:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de la correction' },
      { status: 500 }
    );
  }
}