import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { getServerSession } from "next-auth/next";


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
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

    const { id } = await Promise.resolve(params);
    const correctionId = parseInt(id, 10);
    
    const body = await request.json();
    const { 
      grade, 
      experimental_points_earned,
      theoretical_points_earned,
      penalty 
    } = body;


        // Validate the data
    if (
      (grade === undefined || grade === null) && 
      (experimental_points_earned === undefined || experimental_points_earned === null) &&
      (theoretical_points_earned === undefined || theoretical_points_earned === null)
    ) {
      return NextResponse.json(
        { error: 'At least one of grade, experimental_points_earned, or theoretical_points_earned must be provided' },
        { status: 400 }
      );
    }

    // S'assurer que toutes les valeurs sont des nombres valides
    const gradeValue = parseFloat(Number(grade).toFixed(1));
    const expPoints = parseFloat(Number(experimental_points_earned).toFixed(1));
    const theoPoints = parseFloat(Number(theoretical_points_earned).toFixed(1));
    const penaltyValue = parseFloat(Number(penalty).toFixed(1));

    // Prepare update fields and values for MySQL style query (using ? placeholders)
    const updateFields: string[] = [];
    const values: (number | string | null)[] = [];

    // Only update fields that are provided in the request
    if (expPoints !== undefined && !isNaN(expPoints)) {
      updateFields.push(`experimental_points_earned = ?`);
      values.push(expPoints);
    }

    if (theoPoints !== undefined && !isNaN(theoPoints)) {
      updateFields.push(`theoretical_points_earned = ?`);
      values.push(theoPoints);
    }

    // Always update the total grade if valid
    if (gradeValue !== undefined && !isNaN(gradeValue)) {
      updateFields.push(`grade = ?`);
      values.push(gradeValue);
    }

    // Handle penalty separately - could be 0 which is falsy
    if (penaltyValue !== undefined) {
      if (penaltyValue <= 0 || isNaN(penaltyValue)) {
        // If penalty is 0, negative, or invalid, set it to NULL
        updateFields.push(`penalty = NULL`);
      } else {
        // Otherwise set it to the provided value
        updateFields.push(`penalty = ?`);
        values.push(penaltyValue);
      }
    }

    // Always update the timestamp
    updateFields.push(`updated_at = NOW()`);

    // Build the SQL query for MySQL
    const updateQuery = `
      UPDATE corrections
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    // Add the correction ID to the values array at the end (for the WHERE clause)
    values.push(correctionId);
    
    return await withConnection(async (connection) => {
      // Use the updateQuery and values array we built above
      await connection.query(updateQuery, values);
      
      // Récupérer la correction mise à jour
      const [rows] = await connection.query(
        `SELECT * FROM corrections WHERE id = ?`,
        [correctionId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Correction non trouvée après mise à jour' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(rows[0]);
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la note' },
      { status: 500 }
    );
  }
}
