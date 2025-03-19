import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface User {
  id: number;
  username: string;
  name: string;
}

/**
 * Récupère l'utilisateur à partir du token d'authentification dans la requête
 */
export async function getUserFromToken(req: NextRequest): Promise<User | null> {
  try {
    // Récupérer le token des cookies
    const token = req.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Vérifier le token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    const { payload } = await jwtVerify(token, secret);
    
    // S'assurer que le payload contient un utilisateur valide
    if (!payload || !payload.id) {
      return null;
    }
    
    return {
      id: payload.id as number,
      username: payload.username as string,
      name: payload.name as string
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function getUser(req?: NextRequest): Promise<User | null> {
  try {
    const cookieStore = req ? req.cookies : await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as number,
      username: payload.username as string,
      name: payload.name as string
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
