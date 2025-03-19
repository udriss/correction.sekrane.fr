import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Function to verify JWT token
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// Fonction pour vérifier si l'utilisateur est authentifié
function isAuthenticated(request: NextRequest) {
  return request.cookies.has('auth_token');
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/login' || 
    path === '/api/auth/login' || 
    path === '/api/auth/logout';
    
  // Check if the path should be protected
  const isPathProtected = 
    path.startsWith('/activities') || 
    path.startsWith('/corrections') ||
    path.startsWith('/activites'); // Ajout de la nouvelle route protégée
  
  // If the path isn't protected or is a public path, proceed
  if (!isPathProtected || isPublicPath) {
    return NextResponse.next();
  }
  
  // Get the token from the cookies
  const token = request.cookies.get('auth_token')?.value || '';
  
  // If there's no token, redirect to login
  if (!token) {
    // Créer une URL pour la redirection
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    
    // Utiliser un paramètre de retour standard (callbackUrl) pour la cohérence
    url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
    
    console.log(`Redirecting to login: ${url.toString()}, from: ${request.nextUrl.pathname}`);
    return NextResponse.redirect(url);
  }
  
  // Verify the token
  const payload = await verifyToken(token);
  
  // If token is invalid, redirect to login
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Token is valid, proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/activities/:path*',
    '/corrections/:path*',
    '/activites/:path*', // Ajout de la nouvelle route protégée
    '/login'
  ],
};
