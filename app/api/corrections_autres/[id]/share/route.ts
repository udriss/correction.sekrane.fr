import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { nanoid } from 'nanoid';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

// Fonction pour générer un code unique
function generateUniqueCode(): string {
  // Génère un code de 8 caractères
  return nanoid(8);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Await the params
    const { id } = await params;
    const correctionId = parseInt(id);

    return await withConnection(async (connection) => {
      // Vérifier si la correction existe
      const [rows] = await connection.query(
        `SELECT id FROM corrections_autres WHERE id = ?`,
        [correctionId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'correction autre introuvable' },
          { status: 404 }
        );
      }

      // Vérifier si un code actif existe déjà
      const [existingCodes] = await connection.query(
        `SELECT code FROM share_codes WHERE correction_id = ? AND is_active = TRUE`,
        [correctionId]
      );

      // Si un code existe, le retourner
      if (Array.isArray(existingCodes) && existingCodes.length > 0) {
        return NextResponse.json({
          code: (existingCodes[0] as any).code,
          message: 'code déjà utilisé dans une autre correction',
          isNew: false,
        });
      }

      // Générer un nouveau code unique
      const code = generateUniqueCode();

      // Stocker le code dans la base de données avec le type correction_autre
      await connection.query(
        `INSERT INTO share_codes (code, correction_id, type) VALUES (?, ?, 'correction_autre')`,
        [code, correctionId]
      );

      return NextResponse.json({
        code,
        message: 'code de partage généré avec succès',
        isNew: true,
      });
    });
  } catch (error) {
    console.error('Erreur lors de la génération du code de partage pour correction autre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Pour obtenir le code existant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Vérifier l'authentification
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Await the params
    const { id } = await params;
    const correctionId = parseInt(id);

    return await withConnection(async (connection) => {
      // Chercher le code actif pour cette correction autre
      const [rows] = await connection.query(
        `SELECT code FROM share_codes WHERE correction_id = ? AND is_active = TRUE`,
        [correctionId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { exists: false }
        );
      }

      return NextResponse.json({
        exists: true,
        code: (rows[0] as any).code
      });
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du code de partage pour correction autre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Pour désactiver un code de partage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }

    // Vérifier l'authentification
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Await the params
    const { id } = await params;
    const correctionId = parseInt(id);

    return await withConnection(async (connection) => {
      // Désactiver tous les codes pour cette correction autre
      await connection.query(
        `UPDATE share_codes SET is_active = FALSE WHERE correction_id = ?`,
        [correctionId]
      );

      return NextResponse.json({
        message: 'Codes de partage désactivés'
      });
    });
  } catch (error) {
    console.error('Erreur lors de la désactivation des codes de partage pour correction autre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}