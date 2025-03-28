import { NextRequest, NextResponse } from 'next/server';
import { getCorrectionStatsByActivity } from '@/lib/correction';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the activity ID from parameters
    const { id } = await params;
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'ID d\'activité invalide' },
        { status: 400 }
      );
    }

    // Use the existing function from lib/correction.ts
    const stats = await getCorrectionStatsByActivity(activityId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json(
      { error: 'Error fetching activity statistics' },
      { status: 500 }
    );
  }
}