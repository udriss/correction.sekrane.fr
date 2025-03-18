import { NextRequest, NextResponse } from 'next/server';
import { createActivity, getActivities } from '@/lib/activity';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Le nom de l\'activité est requis' }, { status: 400 });
    }
    
    // Validate points total to 20
    const experimentalPoints = body.experimental_points !== undefined ? Number(body.experimental_points) : 5;
    const theoreticalPoints = body.theoretical_points !== undefined ? Number(body.theoretical_points) : 15;
    
    if (experimentalPoints + theoreticalPoints !== 20) {
      return NextResponse.json(
        { error: 'Le total des points doit être égal à 20' }, 
        { status: 400 }
      );
    }

    // Create activity with the points configuration
    const activityData = {
      name: body.name.trim(),
      content: body.content,
      experimental_points: experimentalPoints,
      theoretical_points: theoreticalPoints
    };
    
    const activityId = await createActivity(activityData);
    
    return NextResponse.json({ 
      id: activityId, 
      ...activityData 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'activité' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const activities = await getActivities();
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des activités' }, { status: 500 });
  }
}
