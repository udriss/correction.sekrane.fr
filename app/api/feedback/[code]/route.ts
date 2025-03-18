import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
): Promise<NextResponse> {
  try {
    const { code } = await Promise.resolve(params);

    // Vérifier que le code existe et est actif
    const pool = getPool();
    const [shares] = await pool.query(
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

    // Récupérer la correction avec les notes
    const [rows] = await pool.query(
      `SELECT c.*, a.name as activity_name,
              c.grade, c.penalty,
              (c.grade - IFNULL(c.penalty, 0)) as final_grade
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

    // Ajouter l'information que cette correction est accédée via un lien de partage
    correction.shared = true;

    return NextResponse.json(correction);
  } catch (error) {
    console.error('Erreur lors de la récupération de la correction partagée:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}