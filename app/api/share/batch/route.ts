import { NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function POST(request: Request) {
  return await withConnection(async (connection) => {
    try {
      const data = await request.json();
      const { correctionIds } = data;
      
      if (!Array.isArray(correctionIds) || correctionIds.length === 0) {
        return NextResponse.json({ error: 'Liste d\'IDs de corrections requise' }, { status: 400 });
      }
      
      // Convertir et valider les IDs
      const validIds = correctionIds
        .map(id => parseInt(id.toString()))
        .filter(id => !isNaN(id));
        
      if (validIds.length === 0) {
        return NextResponse.json({ error: 'Aucun ID de correction valide' }, { status: 400 });
      }
      
      // Récupérer tous les codes de partage pour ces corrections
      const placeholders = validIds.map(() => '?').join(',');
      const query = `
        SELECT code, correction_id 
        FROM share_codes 
        WHERE correction_id IN (${placeholders}) 
      `;
      
      const [shareCodes] = await connection.query(query, validIds);
      
      return NextResponse.json({ 
        success: true, 
        shareCodes 
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des codes de partage en lot:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  });
}