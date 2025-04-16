// filepath: /var/www/correction.sekrane.fr/app/api/corrections_autres/[id]/dates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';
import { RowDataPacket } from 'mysql2';
import { updateCorrectionAutre, getCorrectionAutreById } from '@/lib/correctionAutre';

// Définir une interface pour le type Correction
interface CorrectionRow extends RowDataPacket {
  id: number;
  activity_id?: number;
  student_id?: number;
  deadline?: string | null;
  submission_date?: string | null;
  [key: string]: any; // Pour les autres propriétés
}

// Function for the API route handler to save both deadline and submission date
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

    // Await the params
    const { id } = await params;
    const correctionId = parseInt(id);


    const { deadline, submission_date } = await request.json();
    
    // Make sure we can parse the ID
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    // Update the correction
    const updated = await updateCorrectionAutre(correctionId, {
      deadline: deadline,
      submission_date: submission_date
    });
    
    if (!updated) {
      return NextResponse.json({ error: 'Correction not found or no update needed' }, { status: 404 });
    }
    
    // Get the correction with updated data
    const correction = await getCorrectionAutreById(correctionId);
    
    return NextResponse.json({
      message: 'Dates updated successfully',
      deadline: correction?.deadline,
      submission_date: correction?.submission_date
    });
  } catch (error) {
    console.error('Error updating dates:', error);
    return NextResponse.json(
      { error: 'Failed to update dates' },
      { status: 500 }
    );
  }
}