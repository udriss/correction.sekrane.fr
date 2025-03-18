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
    path.startsWith('/corrections');
  
  // If the path isn't protected or is a public path, proceed
  if (!isPathProtected || isPublicPath) {
    return NextResponse.next();
  }
  
  // Get the token from the cookies
  const token = request.cookies.get('auth_token')?.value || '';
  
  // If there's no token, redirect to login
  if (!token) {
    // Utiliser l'URL complète actuelle pour la redirection
    const baseUrl = new URL(request.url).origin;
    const loginUrl = new URL('/login', baseUrl);
    
    // Stockez l'URL complète actuelle (pas juste le chemin)
    loginUrl.searchParams.set('callbackUrlMiddle', request.url);
    
    console.log(`Redirecting to login: ${loginUrl.toString()}, from: ${request.url}`);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify the token
  const payload = await verifyToken(token);
  
  // If token is invalid, redirect to login
  if (!payload) {
    const baseUrl = new URL(request.url).origin;
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Token is valid, proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/activities/:path*',
    '/corrections/:path*',
    '/login'
  ],
};
