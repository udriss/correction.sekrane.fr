import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/auth';
import { createLogEntry } from '@/lib/services/logsService';

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur actuel avant de supprimer le cookie
    const user = await getUser(request);
    
    // Clear auth cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    
    // Enregistrer le log de déconnexion si un utilisateur était connecté
    if (user) {
      await createLogEntry({
        action_type: 'LOGOUT',
        description: `Déconnexion de l'utilisateur "${user.username}"`,
        user_id: user.id,
        username: user.username,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Même en cas d'erreur, on tente de supprimer le cookie
    try {
      const cookieStore = await cookies();
      cookieStore.delete('auth_token');
    } catch (e) {
      console.error('Error deleting cookie:', e);
    }
    
    // Log de l'erreur
    await createLogEntry({
      action_type: 'LOGOUT_ERROR',
      description: `Erreur lors de la déconnexion: ${(error as Error).message}`,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });
    
    return NextResponse.json({ success: true });
  }
}
