import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Initialiser la base de données au démarrage de l'application
  // Nous faisons un appel à l'API d'initialisation pour créer les tables si nécessaire
  if (request.nextUrl.pathname === '/') {
    void fetch(`${request.nextUrl.origin}/api/init`);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
