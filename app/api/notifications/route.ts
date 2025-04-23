import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { 
  getFeedbackNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  countUnreadNotifications,
  countTotalNotifications
} from '@/lib/services/notificationService';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Récupérer le paramètre de requête
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'count') {
      // Compter les notifications non lues
      const count = await countUnreadNotifications();
      return NextResponse.json({ count });
    } else if (action === 'totalCount') {
      // Compter le nombre total de notifications
      const total = await countTotalNotifications();
      return NextResponse.json({ total });
    } else if (action === 'counts') {
      // Compter à la fois les notifications non lues et totales
      const [count, total] = await Promise.all([
        countUnreadNotifications(),
        countTotalNotifications()
      ]);
      return NextResponse.json({ count, total });
    } else if (action === 'markAllAsRead') {
      // Marquer toutes les notifications comme lues
      const success = await markAllNotificationsAsRead();
      return NextResponse.json({ success });
    } else {
      // Récupérer les notifications
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);
      const includeRead = url.searchParams.get('includeRead') === 'true';
      
      const notifications = await getFeedbackNotifications(limit, includeRead);
      return NextResponse.json({ notifications });
    }
  } catch (error) {
    console.error('Error handling notification request:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Récupérer les données du corps de la requête
    const body = await request.json();
    
    if (body.action === 'markAsRead' && body.id) {
      // Marquer une notification spécifique comme lue
      const success = await markNotificationAsRead(body.id);
      return NextResponse.json({ success });
    } else if (body.action === 'markAllAsRead') {
      // Marquer toutes les notifications comme lues
      const success = await markAllNotificationsAsRead();
      return NextResponse.json({ success });
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling notification request:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}