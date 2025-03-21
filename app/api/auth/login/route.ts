import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt';
import { SignJWT } from 'jose';
import { withConnection } from '@/lib/db';
import { cookies } from 'next/headers';

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
        return NextResponse.json(
          { error: 'Identifiants invalides' },
          { status: 401 }
        );
      }

      const user = rows[0] as any;
      
      // Vérification du mot de passe en utilisant bcrypt
      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
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

      // Generate JWT token
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'changeme'
      );
      
      const token = await new SignJWT({
        id: user.id,
        username: user.username,
        name: user.name
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

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
    return NextResponse.json(
      { error: 'Authentification échouée' },
      { status: 500 }
    );
  }
}