import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

// Get corrections for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);

    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    return await withConnection(async (connection) => {
      // Fetch corrections that belong to this group
      const [rows] = await connection.query(
        `SELECT c.*, a.name as activity_name,
         CONCAT(s.first_name, ' ', s.last_name) as student_name
         FROM corrections c 
         JOIN activities a ON c.activity_id = a.id 
         LEFT JOIN students s ON c.student_id = s.id
         WHERE c.group_id = ? 
         ORDER BY s.last_name ASC, s.first_name ASC`,
        [groupId]
      );
      
      return NextResponse.json(rows);
    });
  } catch (error) {
    console.error('Error retrieving group corrections:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve corrections for this group' },
      { status: 500 }
    );
  }
}

// Add corrections to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);

    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    
    // Handle correction_ids format (from MultipleCorrectionsForm)
    if (body.correction_ids && Array.isArray(body.correction_ids)) {
      return await withConnection(async (connection) => {
        const results = [];
        
        // Update existing corrections to add them to this group
        for (const correctionId of body.correction_ids) {
          try {
            // Update the correction with the group ID
            await connection.query(
              `UPDATE corrections SET group_id = ? WHERE id = ?`,
              [groupId, correctionId]
            );
            
            results.push({
              status: 'success',
              message: 'Correction linked to group',
              data: { id: correctionId, group_id: groupId }
            });
          } catch (err) {
            results.push({
              status: 'error',
              message: `Failed to link correction: ${(err as Error).message}`,
              data: { id: correctionId }
            });
          }
        }
        
        return NextResponse.json(results);
      });
    }
    // Original corrections array format
    else if (body.corrections && Array.isArray(body.corrections)) {
      // Keep original implementation for backward compatibility
      return await withConnection(async (connection) => {
        // Original code for handling complete correction objects
        const results = [];
        
        for (const correction of body.corrections) {
          // Ensure correction has required fields
          if (!correction.activity_id || !correction.student_id) {
            results.push({
              status: 'error',
              message: 'Activity ID and student ID are required',
              data: correction
            });
            continue;
          }
          
          // Calculate grade if needed
          const expPoints = parseFloat(correction.experimental_points_earned) || 0;
          const theoPoints = parseFloat(correction.theoretical_points_earned) || 0;
          const totalGrade = expPoints + theoPoints;
          
          // Prepare correction data with group_id
          const correctionData = {
            activity_id: correction.activity_id,
            student_id: correction.student_id,
            content: correction.content || '',
            experimental_points_earned: expPoints,
            theoretical_points_earned: theoPoints,
            grade: totalGrade,
            penalty: correction.penalty || 0,
            group_id: groupId, // Set the group ID for this correction
          };
          
          try {
            // Insert the correction with group_id
            const [result] = await connection.query(
              `INSERT INTO corrections 
              (activity_id, student_id, content, experimental_points_earned, theoretical_points_earned, grade, penalty, group_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                correctionData.activity_id,
                correctionData.student_id,
                correctionData.content,
                correctionData.experimental_points_earned,
                correctionData.theoretical_points_earned,
                correctionData.grade,
                correctionData.penalty,
                correctionData.group_id
              ]
            );
            
            const insertId = (result as any).insertId;
            
            // Get student name for response
            const [studentRows] = await connection.query<any[]>(
              `SELECT CONCAT(first_name, ' ', last_name) as student_name 
               FROM students WHERE id = ?`,
              [correctionData.student_id]
            );
            
            const studentName = studentRows.length > 0 ? studentRows[0].student_name : null;
            
            results.push({
              status: 'success',
              message: 'Correction added to group',
              data: { 
                id: insertId, 
                ...correctionData,
                student_name: studentName 
              }
            });
          } catch (err) {
            results.push({
              status: 'error',
              message: `Failed to add correction: ${(err as Error).message}`,
              data: correction
            });
          }
        }
        
        return NextResponse.json(results);
      });
    }
    else {
      return NextResponse.json(
        { error: 'Invalid request format. Expected correction_ids array or corrections array.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error adding corrections to group:', error);
    return NextResponse.json(
      { error: 'Failed to add corrections to group' },
      { status: 500 }
    );
  }
}