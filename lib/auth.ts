import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/db";
import { compare } from 'bcrypt';

export interface User {
  id: number;
  username: string;
  name: string;
  is_admin?: boolean;
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
    // Log l'erreur avec plus de détails pour faciliter le débogage
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`Error verifying token in getUserFromToken: ${errorType} - ${errorMessage}`, error);
    
    // Retourner null mais on pourrait aussi retourner { user: null, error: errorMessage }
    // si on voulait propager l'erreur
    return null;
  }
}

export async function getUser(req?: NextRequest): Promise<User | null> {
  const cookieStore = req ? req.cookies : await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    
    return null;
  }

  try {
    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Récupérer les informations supplémentaires de l'utilisateur depuis la base de données
    const userId = payload.id as number;
    const users = await query<any[]>(`
      SELECT id, name, username, is_admin 
      FROM users 
      WHERE id = ?
    `, [userId]);
    
    const user = users[0];
    
    if (!user) {
      
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      is_admin: user.is_admin === 1 // Convertir la valeur numérique en booléen
    };
  } catch (error) {
    // Log l'erreur avec plus de détails pour faciliter le débogage
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`Error in getUser: ${errorType} - ${errorMessage}`, error);
    
    // Si l'erreur est liée à la base de données, ajoutez des informations spécifiques
    if (error instanceof Error && (error as any).code) {
      console.error(`Database error code: ${(error as any).code}`);
    }
    
    // Propager l'erreur au lieu de retourner null
    throw error;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Only keep the CredentialsProvider since that's what your database supports
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Query your users table with the correct fields
          const users = await query<any[]>(`
            SELECT id, name, username, password 
            FROM users 
            WHERE username = ?
          `, [credentials.username]);

          // Check if user exists
          const user = users[0];
          
          if (!user) {
            
            return null;
          }

          // Check password - adjust depending on how your passwords are stored
          // If using bcrypt:
          const isValidPassword = await compare(credentials.password, user.password);
          // If stored as plain text (not recommended):
          // const isValidPassword = user.password === credentials.password;
          
          if (!isValidPassword) {
            
            return null;
          }

          
          
          // Return user in the format NextAuth expects
          return {
            id: user.id.toString(),
            name: user.name || user.username,
            username: user.username
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  // Remove or comment out pages since we're using custom auth
  // pages: {
  //   signIn: '/auth/signin',
  //   error: '/auth/error',
  // },
  callbacks: {
    async jwt({ token, user }) {
      // Add user id to token when available
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
    // Fix the redirect callback to prevent forced redirects to signin
    async redirect({ url, baseUrl }) {
      
      // Don't redirect to signin page if there's an error, just go to home
      if (url.includes('/auth/signin')) {
        return baseUrl;
      }
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Allow same origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      return baseUrl;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 30 days
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Missing required environment variable: NEXTAUTH_SECRET or JWT_SECRET");
    }
    return secret;
  })(),
  debug: process.env.NODE_ENV === "development",
  // Handle errors properly
  logger: {
    error(code, metadata) {
      console.error(`Auth error [${code}]:`, metadata);
    },
    warn(code) {
      console.warn(`Auth warning [${code}]`);
    },
    debug(code, metadata) {
      console.debug(`Auth debug [${code}]:`, metadata);
    }
  },
};

export default authOptions;
