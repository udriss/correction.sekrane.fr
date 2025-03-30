import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { getServerSession } from "next-auth/next";

export async function GET() {
  try {

    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;

    // Rechercher une activité générique
    const genericActivity = await query<any[]>(
      `SELECT * FROM activities 
       WHERE name = 'Activité générique' 
       ORDER BY id DESC LIMIT 1`
    );
    
    // Si aucune activité générique n'existe, en créer une
    if (!genericActivity || !Array.isArray(genericActivity) || genericActivity.length === 0) {
      // Créer une nouvelle activité générique
      const result = await query<any>(
        `INSERT INTO activities 
         (name, content, created_at, updated_at, experimental_points, theoretical_points, user_id)
         VALUES (?, ?, NOW(), NOW(), ?, ?, ?)`,
        ['Activité générique', 'Activité pour les corrections sans activité spécifique', 5, 15, userId]
      );
      
      if (result && result.insertId) {
        // Récupérer l'activité nouvellement créée
        const newActivity = await query<any[]>(
          `SELECT * FROM activities WHERE id = ?`,
          [result.insertId]
        );
        
        if (newActivity && Array.isArray(newActivity) && newActivity.length > 0) {
          return NextResponse.json(newActivity[0]);
        }
      }
      
      return NextResponse.json(
        { error: "Impossible de créer une activité générique" },
        { status: 500 }
      );
    }
    
    // Retourner l'activité générique existante
    return NextResponse.json(genericActivity[0]);
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité générique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'activité générique' },
      { status: 500 }
    );
  }
}
