import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface FragmentRow extends RowDataPacket {
  id: number;
  user_id: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fragmentIds } = body;

    if (!fragmentIds || !Array.isArray(fragmentIds) || fragmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste des IDs de fragments requise' },
        { status: 400 }
      );
    }

    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    return await withConnection(async (connection) => {
      try {
        // Start transaction
        await connection.beginTransaction();

        // First, check if all fragments belong to the user
        const placeholders = fragmentIds.map(() => '?').join(',');
        const [fragments] = await connection.query<FragmentRow[]>(
          `SELECT id, user_id, content FROM fragments WHERE id IN (${placeholders})`,
          fragmentIds
        );

        if (fragments.length !== fragmentIds.length) {
          await connection.rollback();
          return NextResponse.json(
            { error: 'Certains fragments n\'existent pas' },
            { status: 404 }
          );
        }

        // Check ownership for all fragments
        const unauthorizedFragments = fragments.filter(fragment => fragment.user_id !== userId);
        if (unauthorizedFragments.length > 0) {
          await connection.rollback();
          return NextResponse.json(
            { error: 'Vous n\'avez pas l\'autorisation de supprimer certains fragments' },
            { status: 403 }
          );
        }

        // Check if any fragments are used in corrections
        const [usageResults] = await connection.query<RowDataPacket[]>(
          `SELECT fragment_id, COUNT(*) as usage_count 
           FROM correction_fragments 
           WHERE fragment_id IN (${placeholders}) 
           GROUP BY fragment_id`,
          fragmentIds
        );

        if (usageResults.length > 0) {
          const usedFragments = usageResults.map(row => ({
            id: row.fragment_id,
            count: row.usage_count
          }));
          
          await connection.rollback();
          return NextResponse.json(
            { 
              error: 'Certains fragments sont utilisés dans des corrections et ne peuvent pas être supprimés',
              usedFragments
            },
            { status: 409 }
          );
        }

        // Delete all fragments
        const [deleteResult] = await connection.query(
          `DELETE FROM fragments WHERE id IN (${placeholders})`,
          fragmentIds
        );

        await connection.commit();

        return NextResponse.json({
          message: `${fragmentIds.length} fragments supprimés avec succès`,
          deletedCount: fragmentIds.length
        });

      } catch (error) {
        await connection.rollback();
        console.error('Error in batch delete transaction:', error);
        throw error;
      }
    });
    
  } catch (error) {
    console.error('Error batch deleting fragments:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
