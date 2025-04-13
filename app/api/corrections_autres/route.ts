import { NextRequest, NextResponse } from 'next/server';
import { getCorrectionsAutres } from '@/lib/correctionAutre';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Récupérer uniquement les corrections de l'utilisateur
    if (customUser) {
      const corrections = await getCorrectionsAutres();
      return NextResponse.json(corrections);
    }
  } catch (error) {
    console.error('Error fetching corrections_autres:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des corrections' }, { status: 500 });
  }
}