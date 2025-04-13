import { NextRequest, NextResponse } from 'next/server';
import { getActivitiesAutres, createActivityAutre } from '@/lib/activityAutre';
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
      const activities = await getActivitiesAutres(customUser.id);
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
    const { name, content, parts_names, points } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }
    
    // Vérifier que parts_names et points sont des tableaux valides
    if (!Array.isArray(parts_names) || parts_names.length === 0) {
      return NextResponse.json({ error: 'Les noms des parties sont requis' }, { status: 400 });
    }
    
    if (!Array.isArray(points) || points.length !== parts_names.length) {
      return NextResponse.json({ error: 'Les points doivent correspondre au nombre de parties' }, { status: 400 });
    }
    
    // Vérifier que les points sont des nombres valides
    const validPoints = points.every(p => !isNaN(Number(p)) && Number(p) > 0);
    if (!validPoints) {
      return NextResponse.json({ error: 'Les points doivent être des nombres positifs' }, { status: 400 });
    }
    
    if (customUser) {
      const activityId = await createActivityAutre({
        name,
        content: content || null,
        parts_names: parts_names,
        points: points.map(Number),
        user_id: customUser.id
      });    
      return NextResponse.json({ id: activityId }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'activité' }, { status: 500 });
  }
}