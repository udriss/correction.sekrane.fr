import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
): Promise<NextResponse> {
  try {
    const { id } = await params; 
    
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT c.*, a.name as activity_name 
       FROM corrections c 
       JOIN activities a ON c.activity_id = a.id 
       WHERE c.id = ?`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Correction non trouvée' }), {
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
    
    const correction = rows[0] as any;
    
    // Si content_data existe et est une string, parser en JSON
    if (correction.content_data && typeof correction.content_data === 'string') {
      try {
        correction.content_data = JSON.parse(correction.content_data);
      } catch (e) {
        console.error('Erreur de parsing content_data:', e);
      }
    }
    
    return new NextResponse(JSON.stringify(correction), {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la correction:', error);
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    const body = await request.json();
    const { student_name, content, content_data } = body;
    
    // Sauvegarder content_data en JSON si c'est un objet
    const dataToSave = typeof content_data === 'object' 
      ? JSON.stringify(content_data) 
      : content_data;
    
    const pool = getPool();
    const [result] = await pool.query(
      `UPDATE corrections 
       SET student_name = ?, content = ?, content_data = ? 
       WHERE id = ?`,
      [student_name, content, dataToSave, id]
    );
    
    // Récupérer la correction mise à jour
    const [rows] = await pool.query(
      `SELECT c.*, a.name as activity_name 
       FROM corrections c 
       JOIN activities a ON c.activity_id = a.id 
       WHERE c.id = ?`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Correction non trouvée après mise à jour' }), {
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
    
    const updatedCorrection = rows[0] as any;
    
    // Parser content_data pour le retour
    if (updatedCorrection.content_data && typeof updatedCorrection.content_data === 'string') {
      try {
        updatedCorrection.content_data = JSON.parse(updatedCorrection.content_data);
      } catch (e) {
        console.error('Erreur de parsing content_data après mise à jour:', e);
      }
    }
    
    return new NextResponse(JSON.stringify(updatedCorrection), {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la correction:', error);
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    const pool = getPool();
    
    // Récupérer d'abord la correction pour la retourner après suppression
    const [rows] = await pool.query('SELECT * FROM corrections WHERE id = ?', [id]);
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Correction non trouvée' }), {
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
    
    const correction = rows[0] as any;
    
    // Supprimer la correction
    await pool.query('DELETE FROM corrections WHERE id = ?', [id]);
    
    return new NextResponse(JSON.stringify(correction), {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la correction:', error);
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    const body = await request.json();
    const { student_name, content, content_data } = body;
    
    // Sauvegarder content_data en JSON si c'est un objet
    const dataToSave = typeof content_data === 'object' 
      ? JSON.stringify(content_data) 
      : content_data;
    
    const pool = getPool();
    const [result] = await pool.query(
      `UPDATE corrections 
       SET student_name = ?, content = ?, content_data = ? 
       WHERE id = ?`,
      [student_name, content, dataToSave, id]
    );
    
    // Récupérer la correction mise à jour
    const [rows] = await pool.query(
      `SELECT c.*, a.name as activity_name 
       FROM corrections c 
       JOIN activities a ON c.activity_id = a.id 
       WHERE c.id = ?`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Correction non trouvée après mise à jour' }), {
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
    
    const updatedCorrection = rows[0] as any;
    
    // Parser content_data pour le retour
    if (updatedCorrection.content_data && typeof updatedCorrection.content_data === 'string') {
      try {
        updatedCorrection.content_data = JSON.parse(updatedCorrection.content_data);
      } catch (e) {
        console.error('Erreur de parsing content_data après mise à jour:', e);
      }
    }
    
    return new NextResponse(JSON.stringify(updatedCorrection), {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la correction:', error);
    return new NextResponse(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}