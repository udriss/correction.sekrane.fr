import { NextResponse } from 'next/server';
import { updateFragmentPosition } from '../../../../lib/fragment';
import { withConnection } from 'lib/db';

export async function POST(request: Request) {
  try {
    const updates = await request.json();

    if (!Array.isArray(updates)) {
      return new NextResponse(JSON.stringify({ error: 'Expected an array of updates' }), {
        status: 400,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Utiliser withConnection pour gérer la transaction et la connexion
    const result = await withConnection(async (connection: any) => {
      try {
        await connection.beginTransaction();

        for (const update of updates) {
          const { fragmentId, newPosition } = update;

          if (!fragmentId || newPosition === undefined) {
            throw new Error('fragmentId and newPosition are required');
          }

          const success = await updateFragmentPosition(fragmentId, newPosition, connection);

          if (!success) {
            throw new Error(`Failed to update fragment ${fragmentId}`);
          }
        }

        await connection.commit();
        return { success: true };
      } catch (error: any) {
        await connection.rollback();
        throw error;
      }
    });

    return new NextResponse(JSON.stringify(result), {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
