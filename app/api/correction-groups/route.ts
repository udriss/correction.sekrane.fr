import { NextResponse } from 'next/server';
import { createCorrectionGroup } from '@/lib/correctionGroup';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.activity_id || !body.name) {
      return NextResponse.json({ error: 'Activity ID and name are required' }, { status: 400 });
    }
    
    const groupId = await createCorrectionGroup({
      activity_id: body.activity_id,
      name: body.name,
      description: body.description
    });
    
    return NextResponse.json({ id: groupId, success: true });
  } catch (error) {
    console.error('Error creating correction group:', error);
    return NextResponse.json({ error: 'Failed to create correction group' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Récupérer tous les groupes avec le nombre de corrections
    // Cette route est maintenue pour la compatibilité ascendante
    // Mais on devrait préférer utiliser /api/activities_autres/[id]/groups
    const groups = await query(`
      SELECT 
        cg.*, 
        a.name as activity_name,
        COUNT(cgi.correction_id) as correction_count
      FROM 
        correction_groups cg
      LEFT JOIN 
        activities a ON cg.activity_id = a.id
      LEFT JOIN 
        correction_group_items cgi ON cg.id = cgi.group_id
      GROUP BY 
        cg.id
      ORDER BY 
        cg.created_at DESC
    `);
    
    // Vérifier si un activityId est spécifié comme paramètre de requête
    const url = new URL(request.url);
    const activityId = url.searchParams.get('activityId');
    
    if (activityId) {
      // Si un ID d'activité est fourni, filtrer les résultats
      const filteredGroups = (groups as any[]).filter((group: any) => 
        group.activity_id === parseInt(activityId)
      );
      return NextResponse.json(filteredGroups);
    }
    
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching correction groups:', error);
    return NextResponse.json({ error: 'Failed to fetch correction groups' }, { status: 500 });
  }
}