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
    
    // Get query parameters
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    
    // Use the updated function with the includeInactive parameter
    const stats = await getCorrectionStatsByActivity(activityId, includeInactive);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    
    // Préparer les détails d'erreur pour les inclure dans la réponse
    const errorDetails = {
      message: error.message || 'Error fetching activity statistics',
      code: error.code || 'UNKNOWN_ERROR',
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    return NextResponse.json(
      { 
        error: 'Error fetching activity statistics', 
        details: errorDetails
      },
      { status: 500 }
    );
  }
}