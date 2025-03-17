import { NextResponse } from 'next/server';
import { updateCorrectionName } from '../../../../../lib/correction';

export async function PUT(
  request: Request,
  { params }: { params: Promise<Record<string, string>> }
): Promise<NextResponse> {
  try {
    const { id } = await params; // await the params as suggested
    const { student_name } = await request.json();
    const correctionId = parseInt(id, 10);
    
    if (isNaN(correctionId)) {
      return NextResponse.json(
        { error: 'ID de correction invalide' },
        { status: 400 }
      );
    }
    
    const success = await updateCorrectionName(correctionId, student_name);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Correction non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      student_name
    });
  } catch (error) {
    console.error('Error updating correction name:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du nom' },
      { status: 500 }
    );
  }
}
