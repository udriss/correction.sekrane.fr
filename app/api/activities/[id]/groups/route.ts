import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await the params
        const { id } = await params;
        const activityId = parseInt(id);

    
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }
    
    // Récupérer les groupes associés à cette activité avec le nombre de corrections
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
      WHERE 
        cg.activity_id = ?
      GROUP BY 
        cg.id
      ORDER BY 
        cg.created_at DESC
    `, [activityId]);
    
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching correction groups for activity:', error);
    return NextResponse.json({ error: 'Failed to fetch correction groups' }, { status: 500 });
  }
}
