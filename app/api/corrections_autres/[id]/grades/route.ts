// filepath: /var/www/correction.sekrane.fr/app/api/corrections_autres/[id]/grades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { CorrectionAutre } from '@/lib/types';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

// Type d'extension pour le résultat de la requête SQL
interface CorrectionRow extends CorrectionAutre, RowDataPacket {}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Await the params to properly access the id
    const { id } = await params;
    const correctionId = id;
    
    if (!correctionId) {
      return NextResponse.json({ error: 'Correction ID is required' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Parse and validate grade values
    const grade = data.grade !== undefined 
      ? parseFloat(data.grade) 
      : null;
    
    const penalty = data.penalty !== undefined 
      ? parseFloat(data.penalty) 
      : 0;
    
    // Calculate final grade (may include penalties or other adjustments)
    let finalGrade = null;
    if (grade !== null) {
      finalGrade = Math.max(0, grade - penalty);
    }
    
    return await withConnection(async (connection) => {
      // Update the correction with grade information
      await connection.query(
        `UPDATE corrections_autres
         SET 
          penalty = ?,
          grade = ?,
          final_grade = ?
         WHERE id = ?`,
        [
          penalty, 
          grade, 
          finalGrade, 
          correctionId
        ]
      );
      
      // Fetch and return the updated correction with explicit typing
      const [updatedCorrections] = await connection.query<CorrectionRow[]>(
        'SELECT * FROM corrections_autres WHERE id = ?', 
        [correctionId]
      );
      
      if (!updatedCorrections || updatedCorrections.length === 0) {
        return NextResponse.json({ error: 'Correction not found after update' }, { status: 404 });
      }
      
      // Utiliser le type CorrectionAutre pour éviter les problèmes de typage
      const correction: CorrectionAutre = {
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