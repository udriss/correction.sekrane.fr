import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcrypt';
import { withConnection } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Vérifier si l'utilisateur est connecté
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    // Valider les données
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' },
        { status: 400 }
      );
    }

    return await withConnection(async (connection) => {
      // Récupérer les informations actuelles de l'utilisateur
      const [rows] = await connection.query(
        'SELECT password FROM users WHERE id = ?',
        [user.id]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      const userData = rows[0] as any;
      
      // Vérifier que le mot de passe actuel est correct
      const passwordMatch = await compare(currentPassword, userData.password);
      
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 401 }
        );
      }

      // Hasher le nouveau mot de passe
      const hashedNewPassword = await hash(newPassword, 10);
      
      // Mettre à jour le mot de passe dans la base de données
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, user.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès'
      });
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    );
  }
}