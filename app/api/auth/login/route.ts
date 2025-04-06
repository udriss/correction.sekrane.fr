import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { withConnection } from '@/lib/db';
import { cookies } from 'next/headers';
import { createLogEntry } from '@/lib/services/logsService';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Validate request data
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur et mot de passe requis' },
        { status: 400 }
      );
    }

    return await withConnection(async (connection) => {
      const [rows] = await connection.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        // Log échec de connexion - utilisateur inexistant
        await createLogEntry({
          action_type: 'LOGIN_FAILED',
          description: `Tentative de connexion échouée: utilisateur "${username}" inexistant`,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        });
        
        return NextResponse.json(
          { error: 'Identifiants invalides' },
          { status: 401 }
        );
      }

      const user = rows[0] as any;
      
      // Vérification du mot de passe en utilisant bcrypt
      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
        // Log échec de connexion - mot de passe incorrect
        await createLogEntry({
          action_type: 'LOGIN_FAILED',
          description: `Tentative de connexion échouée: mot de passe incorrect pour "${username}"`,
          user_id: user.id,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        });
        
        return NextResponse.json(
          { error: 'Identifiants invalides' },
          { status: 401 }
        );
      }

      // Update last login timestamp
      await connection.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Generate JWT token using jsonwebtoken instead of jose
      const jwtSecret = process.env.JWT_SECRET || 'changeme';
      
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          name: user.name
        }, 
        jwtSecret,
        { 
          algorithm: 'HS256',
          expiresIn: '24h'
        }
      );

      // Set cookie with SameSite=None pour permettre l'accès entre domaines si nécessaire
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: 'lax',  // ou 'none' si vous avez des problèmes de CORS
      });
      
      // Log connexion réussie
      await createLogEntry({
        action_type: 'LOGIN_SUCCESS',
        description: `Connexion réussie pour l'utilisateur "${username}"`,
        user_id: user.id,
        username: username,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Log erreur interne lors de la connexion
    await createLogEntry({
      action_type: 'LOGIN_ERROR',
      description: `Erreur interne lors de la tentative de connexion: ${(error as Error).message}`,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    });
    
    return NextResponse.json(
      { error: 'Authentification échouée' },
      { status: 500 }
    );
  }
}