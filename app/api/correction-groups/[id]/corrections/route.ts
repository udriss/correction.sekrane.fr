import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Correction } from '@/lib/types';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params
    const { id } = await params;
    const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }
    
    // Requête SQL modifiée incluant les dates de soumission et deadline
    const corrections = await query<any[]>(`
      SELECT 
        c.id,
        c.student_name,
        CAST(c.experimental_points_earned AS DECIMAL(10,2)) as experimental_points_earned,
        CAST(c.theoretical_points_earned AS DECIMAL(10,2)) as theoretical_points_earned,
        CAST(a.experimental_points AS DECIMAL(10,2)) as experimental_points,
        CAST(a.theoretical_points AS DECIMAL(10,2)) as theoretical_points,
        c.submission_date,
        c.deadline,
        a.id as activity_id
      FROM 
        correction_group_items cgi
      JOIN 
        corrections c ON cgi.correction_id = c.id
      JOIN 
        activities a ON c.activity_id = a.id
      WHERE 
        cgi.group_id = ?
      ORDER BY
        c.student_name ASC
    `, [groupId]);
    
    const formattedCorrections: Correction[] = corrections.map((correction: any) => ({
      id: correction.id,
      student_name: correction.student_name || 'Sans nom',
      experimental_points_earned: Number(correction.experimental_points_earned),
      theoretical_points_earned: Number(correction.theoretical_points_earned),
      experimental_points: Number(correction.experimental_points),
      theoretical_points: Number(correction.theoretical_points),
      submission_date: correction.submission_date,
      deadline: correction.deadline,
      activity_id: correction.activity_id
    }));
    
    
    console.log(`Fetched ${formattedCorrections.length} corrections for group ${groupId}`);
    
    return NextResponse.json(formattedCorrections);
  } catch (error) {
    console.error('Error fetching corrections for group:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch corrections for this group',
      details: String(error)
    }, { status: 500 });
  }
}


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object to access its properties
    const { id } = await params;
    const groupId = parseInt(id || '');
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }
    
    const body = await request.json();
    console.log("POST request body:", body);
    
    if (!body.correction_ids || !Array.isArray(body.correction_ids) || body.correction_ids.length === 0) {
      return NextResponse.json({ error: 'Correction IDs are required' }, { status: 400 });
    }
    
    console.log(`Adding ${body.correction_ids.length} corrections to group ${groupId}`);
    
    // Nettoyer les associations existantes pour éviter les doublons
    await query(`DELETE FROM correction_group_items WHERE group_id = ? AND correction_id IN (?)`, 
      [groupId, body.correction_ids]);
    
    // Insérer les associations dans la table pivot un par un plutôt qu'en masse
    // pour mieux gérer les erreurs potentielles
    let successCount = 0;
    
    for (const correctionId of body.correction_ids) {
      try {
        console.log(`Associating correction ${correctionId} with group ${groupId}`);
        
        await query(
          `INSERT INTO correction_group_items (group_id, correction_id) VALUES (?, ?)`,
          [groupId, correctionId]
        );
        
        successCount++;
      } catch (err) {
        console.error(`Error associating correction ${correctionId}:`, err);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      count: successCount,
      message: `Successfully associated ${successCount} out of ${body.correction_ids.length} corrections`
    });
  } catch (error) {
    console.error('Error adding corrections to group:', error);
    return NextResponse.json({ error: 'Failed to add corrections to group', details: String(error) }, { status: 500 });
  }
}