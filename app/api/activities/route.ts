import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getActivities, createActivity } from '@/lib/activity';

export async function GET() {
  try {
    const activities = await getActivities();
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, content } = await request.json();
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const id = await createActivity({ name, content });
    return NextResponse.json({ id, name, content }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'activité' },
      { status: 500 }
    );
  }
}
