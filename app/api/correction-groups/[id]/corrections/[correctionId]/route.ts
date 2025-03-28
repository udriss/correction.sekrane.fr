import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

// Remove a correction from a group by setting group_id back to 0 (not deleting it)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, correctionId: string }> }
) {
  try {
    const { id, correctionId } = await params;
    const groupId = parseInt(id);
    const corrId = parseInt(correctionId);
    
    if (isNaN(groupId) || isNaN(corrId)) {
      return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 });
    }

    return await withConnection(async (connection) => {
      // Verify the correction belongs to this group
      const [rows] = await connection.query(
        'SELECT * FROM corrections WHERE id = ? AND group_id = ?',
        [corrId, groupId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Correction not found in this group' },
          { status: 404 }
        );
      }
      
      // Update the correction to remove it from the group (set group_id to 0)
      await connection.query(
        'UPDATE corrections SET group_id = 0 WHERE id = ?',
        [corrId]
      );
      
      return NextResponse.json({
        message: 'Correction removed from group successfully'
      });
    });
  } catch (error) {
    console.error('Error removing correction from group:', error);
    return NextResponse.json(
      { error: 'Failed to remove correction from group' },
      { status: 500 }
    );
  }
}