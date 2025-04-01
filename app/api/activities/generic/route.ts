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

    // Déterminer le prochain numéro à utiliser
    let nextNumber = 1;
    
    // Récupérer toutes les activités qui commencent par "Activité générique"
    const allGenericActivities = await query<any[]>(
      `SELECT * FROM activities 
       WHERE name LIKE 'Activité générique%' 
       ORDER BY id DESC`
    );
    console.log('allGenericActivities', allGenericActivities);
    
    if (allGenericActivities && Array.isArray(allGenericActivities) && allGenericActivities.length > 0) {
      // Analyser chaque nom pour extraire le numéro le plus élevé
      for (const activity of allGenericActivities) {
        const match = activity.name.match(/Activité générique.*/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNumber) {
            nextNumber = num + 1;
          }
        }
      }
    }
    
    // Créer une nouvelle activité générique avec le numéro suivant
    const result = await query<any>(
      `INSERT INTO activities 
       (name, content, created_at, updated_at, experimental_points, theoretical_points, user_id)
       VALUES (?, ?, NOW(), NOW(), ?, ?, ?)`,
      [`Activité générique N° ${nextNumber}`, 'Activité pour les corrections sans activité spécifique', 5, 15, userId]
    );
    
    if (result && result.insertId) {
      // Récupérer l'activité nouvellement ajoutée
      const newActivity = await query<any[]>(
        `SELECT * FROM activities WHERE id = ?`,
        [result.insertId]
      );
      
      if (newActivity && Array.isArray(newActivity) && newActivity.length > 0) {
        return NextResponse.json(newActivity[0]);
      }
    }
    
    return NextResponse.json(
      { error: "Impossible d'ajouter une activité générique" },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité générique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'activité générique' },
      { status: 500 }
    );
  }
}
