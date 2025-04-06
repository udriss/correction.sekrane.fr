import { NextRequest, NextResponse } from 'next/server';
import { query, withConnection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {

    // Authentication check
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }


    // Récupération des données de la requête
    const { fragmentId, newPosition } = await request.json();

    // Validation des données
    if (!fragmentId || typeof newPosition !== 'number' || newPosition < 0) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Utilisez withConnection pour encapsuler l'ensemble des opérations de base de données
    return await withConnection(async (connection) => {
      // Récupérer le fragment à mettre à jour
      const fragmentToUpdate = await query<any[]>(`
        SELECT id, activity_id, position_order 
        FROM fragments 
        WHERE id = ?
      `, [fragmentId]);

      if (!fragmentToUpdate || fragmentToUpdate.length === 0) {
        return NextResponse.json({ error: 'Fragment non trouvé' }, { status: 404 });
      }

      const fragment = fragmentToUpdate[0];
      const activityId = fragment.activity_id;
      const currentPosition = fragment.position_order || 0;

      // Commencer une transaction
      await connection.beginTransaction();

      try {
        // Première étape: corriger les doublons de position_order
        // Réindexer tous les fragments de l'activité pour s'assurer qu'il n'y a pas de doublons
        const allFragments = await query<any[]>(`
          SELECT id, position_order 
          FROM fragments 
          WHERE activity_id = ? 
          ORDER BY position_order ASC, id ASC
        `, [activityId]);

        // Si nous avons des fragments, corrigeons les positions
        if (allFragments.length > 0) {
          // Créer un tableau de mises à jour pour corriger les positions
          const updates = [];
          let currentIdx = 0;
          
          for (let i = 0; i < allFragments.length; i++) {
            const frag = allFragments[i];
            // Si ce n'est pas le fragment que nous voulons déplacer, et que sa position n'est pas correcte
            if (frag.id !== fragmentId && frag.position_order !== currentIdx) {
              updates.push([currentIdx, frag.id]);
            }
            currentIdx++;
          }

          // Appliquer les corrections si nécessaire
          if (updates.length > 0) {
            for (const [newPos, id] of updates) {
              await connection.execute(`
                UPDATE fragments 
                SET position_order = ? 
                WHERE id = ?
              `, [newPos, id]);
            }
          }
        }

        // Maintenant, déplacer le fragment à la nouvelle position
        if (newPosition < currentPosition) {
          await connection.execute(`
            UPDATE fragments 
            SET position_order = position_order + 1 
            WHERE activity_id = ? AND position_order >= ? AND position_order < ?
          `, [activityId, newPosition, currentPosition]);
        } 
        else if (newPosition > currentPosition) {
          await connection.execute(`
            UPDATE fragments 
            SET position_order = position_order - 1 
            WHERE activity_id = ? AND position_order > ? AND position_order <= ?
          `, [activityId, currentPosition, newPosition]);
        }

        // Mise à jour de la position du fragment
        await connection.execute(`
          UPDATE fragments 
          SET position_order = ? 
          WHERE id = ?
        `, [newPosition, fragmentId]);

        // Valider la transaction
        await connection.commit();

        // Récupérer tous les fragments mis à jour pour les renvoyer
        const updatedFragments = await query<any[]>(`
          SELECT * FROM fragments 
          WHERE activity_id = ? 
          ORDER BY position_order ASC
        `, [activityId]);

        return NextResponse.json({ 
          message: 'Position mise à jour avec succès',
          fragments: updatedFragments
        });
      } catch (error) {
        // En cas d'erreur, annuler la transaction
        await connection.rollback();
        throw error;
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la position:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}