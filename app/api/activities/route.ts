import { NextRequest, NextResponse } from 'next/server';
import { getActivities, createActivity } from '@/lib/activity';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Récupérer l'utilisateur à partir du token
    const user = await getUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    // Récupérer uniquement les activités de l'utilisateur
    const activities = await getActivities(user.id);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des activités' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Récupérer l'utilisateur à partir du token
    const user = await getUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }
    
    // Obtenir les données de la requête
    const body = await req.json();
    const { name, content, experimental_points, theoretical_points } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }
    
    // Créer l'activité avec l'ID de l'utilisateur
    const activityId = await createActivity({
      name,
      content: content || null,
      experimental_points: experimental_points || 5,
      theoretical_points: theoretical_points || 15,
      user_id: user.id
    });
    
    return NextResponse.json({ id: activityId }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'activité' }, { status: 500 });
  }
}