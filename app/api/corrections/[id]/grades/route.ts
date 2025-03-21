import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { Correction } from '@/lib/types';
import { RowDataPacket } from 'mysql2';

// Type d'extension pour le résultat de la requête SQL
interface CorrectionRow extends Correction, RowDataPacket {}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access the id
    const { id } = await params;
    const correctionId = id;
    
    if (!correctionId) {
      return NextResponse.json({ error: 'Correction ID is required' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Parse and validate grade values
    const experimentalPointsEarned = data.experimental_points_earned !== undefined 
      ? parseFloat(data.experimental_points_earned) 
      : null;
    
    const theoreticalPointsEarned = data.theoretical_points_earned !== undefined 
      ? parseFloat(data.theoretical_points_earned) 
      : null;
    
    const penalty = data.penalty !== undefined 
      ? parseFloat(data.penalty) 
      : 0;
    
    // Calculate total grade
    let totalGrade = null;
    if (experimentalPointsEarned !== null && theoreticalPointsEarned !== null) {
      totalGrade = Math.max(0, experimentalPointsEarned + theoreticalPointsEarned - penalty);
    }
    
    return await withConnection(async (connection) => {
      // Check if the experimental_points_earned and theoretical_points_earned columns exist
      const [columnsResult] = await connection.query(`
        SELECT 
          COUNT(*) as experimental_exists
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE 
          TABLE_NAME = 'corrections' AND 
          COLUMN_NAME = 'experimental_points_earned'
      `);
      
      const columnExists = (columnsResult as any)[0].experimental_exists > 0;
      
      // Add columns if they don't exist
      if (!columnExists) {
        await connection.query(`
          ALTER TABLE corrections
          ADD COLUMN experimental_points_earned DECIMAL(4,2) DEFAULT NULL,
          ADD COLUMN theoretical_points_earned DECIMAL(4,2) DEFAULT NULL
        `);
      }
      
      // Update the correction with grade information
      await connection.query(
        `UPDATE corrections
         SET 
          experimental_points_earned = ?,
          theoretical_points_earned = ?,
          penalty = ?,
          grade = ?
         WHERE id = ?`,
        [
          experimentalPointsEarned, 
          theoreticalPointsEarned, 
          penalty, 
          totalGrade, 
          correctionId
        ]
      );
      
      // Fetch and return the updated correction with explicit typing
      const [updatedCorrections] = await connection.query<CorrectionRow[]>(
        'SELECT * FROM corrections WHERE id = ?', 
        [correctionId]
      );
      
      if (!updatedCorrections || updatedCorrections.length === 0) {
        return NextResponse.json({ error: 'Correction not found after update' }, { status: 404 });
      }
      
      // Utiliser le type Correction pour éviter les problèmes de typage
      const correction: Correction = {
        ...updatedCorrections[0],
        created_at: (updatedCorrections[0].created_at as unknown as Date) instanceof Date 
          ? (updatedCorrections[0].created_at as unknown as Date).toISOString() 
          : String(updatedCorrections[0].created_at),
        updated_at: (updatedCorrections[0].updated_at as unknown as Date) instanceof Date 
          ? (updatedCorrections[0].updated_at as unknown as Date).toISOString() 
          : String(updatedCorrections[0].updated_at)
      };
      
      return NextResponse.json(correction);
    });
  } catch (error) {
    console.error('Error updating correction grades:', error);
    return NextResponse.json(
      { error: 'Failed to update grades', details: String(error) },
      { status: 500 }
    );
  }
}