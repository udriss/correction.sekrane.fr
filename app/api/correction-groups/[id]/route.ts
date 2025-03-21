import { NextResponse } from 'next/server';
import { createCorrectionGroup, addCorrectionsToGroup } from '@/lib/correctionGroup';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
    try {
      // Await the params
      const { id } = await params;
      const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }
    
    const body = await request.json();
    
    if (!body.activity_id || !body.name) {
      return NextResponse.json({ error: 'Activity ID and name are required' }, { status: 400 });
    }
    
    const newGroupId = await createCorrectionGroup({
      activity_id: body.activity_id,
      name: body.name,
      description: body.description
    });
    
    return NextResponse.json({ id: newGroupId, success: true });
  } catch (error) {
    console.error('Error creating correction group:', error);
    return NextResponse.json({ error: 'Failed to create correction group' }, { status: 500 });
  }
}

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
    
    interface CorrectionGroup {
      id: number;
      activity_id: number;
      name: string;
      description: string;
      activity_name: string;
    }
    
    const groups = await query<CorrectionGroup[]>(`
      SELECT 
        cg.*, 
        a.name as activity_name 
      FROM 
        correction_groups cg
      LEFT JOIN 
        activities a ON cg.activity_id = a.id
      WHERE 
        cg.id = ?
    `, [groupId]);
    
    if (!groups.length) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    return NextResponse.json(groups[0]);
  } catch (error) {
    console.error('Error fetching correction group:', error);
    return NextResponse.json({ error: 'Failed to fetch correction group' }, { status: 500 });
  }
}

// Ajout de DELETE pour permettre la suppression des groupes
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
      // Await the params
      const { id } = await params;
      const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }
    
    // Supprimer d'abord les relations dans correction_group_items
    await query(`DELETE FROM correction_group_items WHERE group_id = ?`, [groupId]);
    
    // Ensuite supprimer le groupe lui-même
    interface SqlResult {
      affectedRows: number;
    }
    const result = await query<SqlResult>(`DELETE FROM correction_groups WHERE id = ?`, [groupId]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete correction group' }, { status: 500 });
  }
}

// Ajout de PUT pour permettre la mise à jour des groupes
export async function PUT(
  request: Request,
{ params }: { params: Promise<{ id: string }> }) {
  try {
      // Await the params
      const { id } = await params;
      const groupId = parseInt(id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }
    
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    interface SqlResult {
      affectedRows: number;
    }
    const result = await query<SqlResult>(`
      UPDATE correction_groups 
      SET name = ?, description = ? 
      WHERE id = ?
    `, [body.name, body.description || null, groupId]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating correction group:', error);
    return NextResponse.json({ error: 'Failed to update correction group' }, { status: 500 });
  }
}