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
      
      // Transformer la réponse en un objet associant chaque ID de correction à son code
      const shareCodesMap: Record<string, string> = {};
      (shareCodes as any[]).forEach(item => {
        shareCodesMap[item.correction_id] = item.code;
      });
      
      return NextResponse.json(shareCodesMap);
    } catch (error) {
      console.error('Erreur lors de la récupération des codes de partage en lot:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  });
}

export async function GET(request: Request) {
  return await withConnection(async (connection) => {
    try {
      // Extraire les IDs des corrections depuis les query parameters
      const url = new URL(request.url);
      const correctionIdsParam = url.searchParams.getAll('correctionIds[]');
      
      if (!correctionIdsParam || correctionIdsParam.length === 0) {
        return NextResponse.json({ error: 'Liste d\'IDs de corrections requise' }, { status: 400 });
      }
      
      // Convertir et valider les IDs
      const validIds = correctionIdsParam
        .map(id => parseInt(id))
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
      
      // Transformer la réponse en un objet associant chaque ID de correction à son code
      const shareCodesMap: Record<string, string> = {};
      (shareCodes as any[]).forEach(item => {
        shareCodesMap[item.correction_id] = item.code;
      });
      
      return NextResponse.json(shareCodesMap);
    } catch (error) {
      console.error('Erreur lors de la récupération des codes de partage en lot:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  });
}