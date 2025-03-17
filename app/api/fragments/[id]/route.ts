import { NextResponse } from 'next/server';
import { getFragmentById, updateFragment, deleteFragment } from '@/lib/fragment';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fragmentId = parseInt(id || '');
    
    if (isNaN(fragmentId)) {
      return NextResponse.json(
        { error: 'Invalid fragment ID' },
        { status: 400 }
      );
    }

    const fragment = await getFragmentById(fragmentId);
    if (!fragment) {
      return NextResponse.json(
        { error: 'Fragment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(fragment);
  } catch (error) {
    console.error('Erreur lors de la récupération du fragment:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fragmentId = parseInt(id || '');
    
    if (isNaN(fragmentId)) {
      return NextResponse.json(
        { error: 'Invalid fragment ID' },
        { status: 400 }
      );
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const success = await updateFragment(fragmentId, content);
    if (!success) {
      return NextResponse.json(
        { error: 'Fragment not found' },
        { status: 404 }
      );
    }

    const updatedFragment = await getFragmentById(fragmentId);
    return new NextResponse(JSON.stringify(updatedFragment), {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fragment:', error);
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fragmentId = parseInt(id || '');
    
    if (isNaN(fragmentId)) {
      return NextResponse.json(
        { error: 'Invalid fragment ID' },
        { status: 400 }
      );
    }

    const success = await deleteFragment(fragmentId);
    if (!success) {
      return NextResponse.json(
        { error: 'Fragment not found' },
        { status: 404 }
      );
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du fragment:', error);
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
