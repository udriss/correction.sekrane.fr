import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params.id avant de l'utiliser
    const { id } = await params;
    const correctionId = id;
    
    // Parse request body
    const { deadline, submission_date } = await request.json();
    console.log('Updating dates for correction ID:', correctionId);
    console.log('Request payload:', { deadline, submission_date });
    
    // Update correction in the database
    const result = await query(
      `UPDATE corrections 
       SET deadline = ?, submission_date = ?, updated_at = NOW() 
       WHERE id = ?`,
      [deadline, submission_date, correctionId]
    );
    
    // Return the updated data
    return NextResponse.json({
      deadline,
      submission_date,
      success: true
    });
    
  } catch (error) {
    console.error('Error updating dates:', error);
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la mise à jour des dates' },
      { status: 500 }
    );
  }
}
