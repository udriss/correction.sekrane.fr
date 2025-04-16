import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        user: null, 
        error: "aucun token d'authentification trouvé" 
      }, { status: 401 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    const { payload } = await jwtVerify(token, secret);
    
    return NextResponse.json({ 
      user: {
        id: payload.id,
        username: payload.username,
        name: payload.name
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    
    // Extraire et retourner les détails de l'erreur
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Erreur inconnue lors de la vérification du token";
      
    // Retourner à la fois le statut d'erreur et les détails
    return NextResponse.json({ 
      user: null, 
      error: errorMessage,
      errorType: error instanceof Error ? error.name : 'UnknownError',
      errorDetails: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 401 });
  }
}
