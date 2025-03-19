import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Function to verify JWT token
async function verifyToken(token: string) {
  try {
    // Vérifier que JWT_SECRET existe
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return null;
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Fonction pour vérifier si l'URL de redirection est valide (interne à l'application)
function isValidRedirectUrl(path: string): boolean {
  // S'assurer que le chemin est relatif et ne contient pas de caractères suspects
  if (!path || path.startsWith('//') || path.startsWith('http') || path.includes(':')) {
    return false;
  }
  
  // Liste des chemins autorisés pour la redirection - élargir cette liste
  const allowedPaths = [
    '/', 
    '/activities', 
    '/corrections', 
    '/activites', 
    '/feedback', 
    '/dashboard',
    '/admin'
  ];
  
  // Vérifier si le chemin commence par un des chemins autorisés
  return allowedPaths.some(allowedPath => path.startsWith(allowedPath));
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/' ||
    path === '/login' || 
    path === '/api/auth/login' || 
    path === '/api/auth/logout';
    
  // Check if the path should be protected
  const isPathProtected = 
    path.startsWith('/activities') || 
    path.startsWith('/corrections') ||
    path.startsWith('/activites') ||
    path.startsWith('/admin') ||
    path.startsWith('/dashboard');
  
  // Si le chemin n'est pas protégé ou est public, continuer
  if (!isPathProtected || isPublicPath) {
    return NextResponse.next();
  }
  
  // Get the token from the cookies
  const token = request.cookies.get('auth_token')?.value || '';
  
  // Si pas de token, rediriger vers login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    
    // Utiliser un nom de paramètre cohérent: 'callbackUrl'
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    if (isValidRedirectUrl(request.nextUrl.pathname)) {
      url.searchParams.set('callbackUrl', fullPath);
    }
    
    // Log pour déboguer
    console.log('Redirecting to login with callback:', fullPath);
    
    return NextResponse.redirect(url);
  }
  
  // Verify the token
  const payload = await verifyToken(token);
  
  // If token is invalid, redirect to login
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    
    // Utiliser le même nom de paramètre
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    if (isValidRedirectUrl(request.nextUrl.pathname)) {
      url.searchParams.set('callbackUrl', fullPath);
    }
    
    return NextResponse.redirect(url);
  }
  
  // Token is valid, proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/activities/:path*',
    '/corrections/:path*',
    '/activites/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/login'
  ],
};