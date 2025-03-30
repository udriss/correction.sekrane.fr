import { NextRequest, NextResponse } from 'next/server';
import { getActivities, createActivity } from '@/lib/activity';
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

    // Récupérer uniquement les activités de l'utilisateur
    if (customUser) {
      const activities = await getActivities(customUser.id);
      return NextResponse.json(activities);
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des activités' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }
    
    // Obtenir les données de la requête
    const body = await req.json();
    const { name, content, experimental_points, theoretical_points } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }
    
    if (customUser) {
      const activityId = await createActivity({
        name,
        content: content || null,
        experimental_points: experimental_points || 5,
        theoretical_points: theoretical_points || 15,
        user_id: customUser.id
      });    
      return NextResponse.json({ id: activityId }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'activité' }, { status: 500 });
  }
}