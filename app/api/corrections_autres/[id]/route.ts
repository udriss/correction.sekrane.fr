import { NextRequest, NextResponse } from 'next/server';
import { getCorrectionAutreById, updateCorrectionAutre, deleteCorrectionAutre, calculateGrade } from '@/lib/correctionAutre';
import { getActivityAutreById } from '@/lib/activityAutre';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    const correction = await getCorrectionAutreById(correctionId);
    if (!correction) {
      return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
    }

    return NextResponse.json(correction);
  } catch (error) {
    console.error('Error fetching correction_autre:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de la correction' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, 
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

    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    // Vérifier si la correction existe
    const existingCorrection = await getCorrectionAutreById(correctionId);
    if (!existingCorrection) {
      return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
    }

    // Obtenir l'activité associée pour valider les points
    const activity = await getActivityAutreById(existingCorrection.activity_id);
    if (!activity) {
      return NextResponse.json({ error: 'Activité associée non trouvée' }, { status: 404 });
    }

    // Obtenir les données de la requête
    const body = await req.json();
    const { 
      points_earned, 
      content, 
      submission_date, 
      penalty, 
      deadline,
      active
    } = body;
    
    // Validation des points si fournis
    if (points_earned !== undefined) {
      if (!Array.isArray(points_earned)) {
        return NextResponse.json({ error: 'points_earned doit être un tableau' }, { status: 400 });
      }
      
      if (points_earned.length !== activity.points.length) {
        return NextResponse.json({ 
          error: 'Le nombre de points gagnés doit correspondre au nombre de parties de l\'activité' 
        }, { status: 400 });
      }
      
      // Recalculer la note si les points changent
      const grade = await calculateGrade(points_earned, activity.points);
      
      // Mise à jour avec le nouveau grade
      const updated = await updateCorrectionAutre(correctionId, {
        points_earned,
        content,
        submission_date,
        penalty,
        deadline,
        grade,
        active
      });
      
      if (!updated) {
        return NextResponse.json({ error: 'Aucune modification apportée' }, { status: 400 });
      }
    } else {
      // Mise à jour sans toucher aux points
      const updated = await updateCorrectionAutre(correctionId, {
        content,
        submission_date,
        penalty,
        deadline,
        active
      });
      
      if (!updated) {
        return NextResponse.json({ error: 'Aucune modification apportée' }, { status: 400 });
      }
    }

    // Récupérer la correction mise à jour
    const updatedCorrection = await getCorrectionAutreById(correctionId);
    return NextResponse.json(updatedCorrection);
  } catch (error) {
    console.error('Error updating correction_autre:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la correction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest,
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
    
    if (isNaN(correctionId)) {
      return NextResponse.json({ error: 'ID de correction invalide' }, { status: 400 });
    }

    // Vérifier si la correction existe
    const existingCorrection = await getCorrectionAutreById(correctionId);
    if (!existingCorrection) {
      return NextResponse.json({ error: 'Correction non trouvée' }, { status: 404 });
    }

    // Supprimer la correction
    const deleted = await deleteCorrectionAutre(correctionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Échec de la suppression de la correction' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Correction supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting correction_autre:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de la correction' }, { status: 500 });
  }
}