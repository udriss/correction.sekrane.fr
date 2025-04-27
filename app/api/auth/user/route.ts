import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    
    if (!token) {
      // Retourner un 200 OK au lieu d'un 401 pour éviter les erreurs dans la console
      // tout en indiquant que l'utilisateur n'est pas authentifié
      return NextResponse.json({ 
        user: null, 
        authenticated: false
      }, { status: 200 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    
    try {
      const { payload } = await jwtVerify(token, secret);
      
      return NextResponse.json({ 
        user: {
          id: payload.id,
          username: payload.username,
          name: payload.name
        },
        authenticated: true
      });
    } catch (tokenError) {
      // En cas d'erreur de vérification du token (token expiré ou invalide)
      // on retourne également un 200 OK pour éviter les erreurs dans la console
      return NextResponse.json({ 
        user: null, 
        authenticated: false,
        reason: 'token_invalid'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in auth/user endpoint:', error);
    
    // Même en cas d'erreur serveur, on retourne un 200 OK pour éviter les erreurs console
    return NextResponse.json({ 
      user: null, 
      authenticated: false,
      reason: 'server_error'
    }, { status: 200 });
  }
}
