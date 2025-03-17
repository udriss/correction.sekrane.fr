import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Base de données initialisée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur lors de l\'initialisation de la base de données' 
    }, { 
      status: 500 
    });
  }
}
