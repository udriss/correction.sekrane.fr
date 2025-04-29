import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { createLogEntry } from '@/lib/services/logsService';
import { createFeedbackNotification } from '@/lib/services/notificationService';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    //if (!userId) {
    //  return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    //}

    // Get the code parameter using the new async pattern
    const { code } = await params;
    
    // Validate that code is not empty or undefined
    if (!code || code === 'undefined' || code === 'null') {
      return NextResponse.json({ error: 'Code de partage invalide' }, { status: 400 });
    }

    return await withConnection(async (connection) => {
      // Use parameterized query with the code as string
      const [shares] = await connection.query(
        `SELECT correction_id FROM share_codes 
         WHERE code = ? AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [code]
      );

      if (!Array.isArray(shares) || shares.length === 0) {
        return NextResponse.json(
          { error: 'Code de partage invalide ou expiré' },
          { status: 404 }
        );
      }

      const correctionId = (shares[0] as any).correction_id;

      // Vérifiez d'abord si c'est une correction dans la table corrections_autres (nouveau système)
      const [autreResult] = await connection.query(
        `SELECT 1 FROM corrections_autres WHERE id = ?`,
        [correctionId]
      );

      let correction;
      

      // Récupérer la correction avec les tableaux points et parts_names pour le nouveau système
      const [rows] = await connection.query(
        `SELECT 
          c.*, 
          a.name as activity_name, 
          a.points, 
          a.parts_names,
          CONCAT(s.first_name, ' ', LEFT(s.last_name, 1), '.') as student_name,
          IFNULL(c.grade, 
                 (SELECT SUM(point) FROM JSON_TABLE(
                   c.points_earned,
                   '$[*]' COLUMNS (
                     point DECIMAL(10,2) PATH '$'
                   )
                 ) as points_table)
          ) as grade,
          IFNULL(c.penalty, 0) as penalty,
          IFNULL(c.final_grade, 
                CASE 
                  WHEN IFNULL(c.grade, 
                             (SELECT SUM(point) FROM JSON_TABLE(
                               c.points_earned,
                               '$[*]' COLUMNS (
                                 point DECIMAL(10,2) PATH '$'
                               )
                             ) as points_table)
                  ) < 5 
                    THEN IFNULL(c.grade, 
                               (SELECT SUM(point) FROM JSON_TABLE(
                                 c.points_earned,
                                 '$[*]' COLUMNS (
                                   point DECIMAL(10,2) PATH '$'
                                 )
                               ) as points_table)
                    )
                  ELSE GREATEST((IFNULL(c.grade, 
                                       (SELECT SUM(point) FROM JSON_TABLE(
                                         c.points_earned,
                                         '$[*]' COLUMNS (
                                           point DECIMAL(10,2) PATH '$'
                                         )
                                       ) as points_table)
                                ) - IFNULL(c.penalty, 0)), 5)
                END
          ) as final_grade,
          sc.code as shareCode
        FROM corrections_autres c 
        JOIN activities_autres a ON c.activity_id = a.id 
        LEFT JOIN students s ON c.student_id = s.id
        LEFT JOIN share_codes sc ON sc.correction_id = c.id AND sc.is_active = TRUE AND sc.code = ?
        WHERE c.id = ?`,
        [code, correctionId]
      );


      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'Correction introuvable' },
          { status: 404 }
        );
      }

      correction = rows[0] as any;

      // Conversion des points_earned et points de JSON à tableau
      try {
        correction.points_earned = correction.points_earned;
      } catch (e) {
        console.error('Erreur de parsing points_earned:', e);
        correction.points_earned = [];
      }

      try {
        correction.points = correction.points;
      } catch (e) {
        console.error('Erreur de parsing points:', e);
        correction.points = [];
      }

      try {
        correction.parts_names = correction.parts_names;
      } catch (e) {
        console.error('Erreur de parsing parts_names:', e);
        correction.parts_names = [];
      }



      // Si content_data existe et est une string, parser en JSON
      if (correction.content_data && typeof correction.content_data === 'string') {
        try {
          correction.content_data = JSON.parse(correction.content_data);
        } catch (e) {
          console.error('Erreur de parsing content_data:', e);
        }
      }

      // Ajouter l'information que cette correction est accédée via un lien de partage
      correction.shared = true;

      // Journaliser l'accès au feedback seulement si ce n'est pas l'administrateur
      // Admin a userId = 1, on ne journalise pas ses vues pour éviter de polluer les logs
      if (userId !== 1) {
        const userAgent = (request as NextRequest).headers.get('user-agent') || 'unknown';
        const ipAddress = (request as NextRequest).headers.get('x-forwarded-for') || 
                          (request as NextRequest).headers.get('x-real-ip') || 'unknown';
        const referer = (request as NextRequest).headers.get('referer') || 'direct';
        
        // Créer une entrée de log pour la consultation du feedback
        const logEntry = {
          action_type: 'VIEW_FEEDBACK',
          description: `Consultation de la correction partagée #${correctionId} pour ${correction.student_name}`,
          entity_type: 'correction',
          entity_id: correctionId,
          ip_address: ipAddress,
          metadata: {
            share_code: code,
            activity_name: correction.activity_name,
            activity_id: correction.activity_id,
            student_name: correction.student_name,
            student_id: correction.student_id,
            grade: correction.grade,
            final_grade: correction.final_grade,
            correction_id: correctionId,
            browser: userAgent,
            referer: referer,
            timestamp: new Date().toISOString()
          }
        };
        
        try {
          // Enregistrer le log et récupérer son ID
          const logId = await createLogEntry(logEntry);
          
          // Vérifier si l'ID est un nombre (cas de succès)
          if (typeof logId === 'number') {
            
            // Créer une notification avec l'ID du log
            const notificationId = await createFeedbackNotification(logId);
            
          } else if (logId === true) {
            // Le log a été créé mais on n'a pas récupéré son ID, chercher le dernier
            const [lastLog] = await connection.query(
              `SELECT id FROM system_logs 
               WHERE action_type = 'VIEW_FEEDBACK' 
               AND entity_id = ? 
               ORDER BY created_at DESC LIMIT 1`,
              [correctionId]
            );
            
            if (Array.isArray(lastLog) && lastLog.length > 0) {
              const lastLogId = (lastLog[0] as any).id;
              const notificationId = await createFeedbackNotification(lastLogId);
              
            }
          }
        } catch (error) {
          console.error('Erreur lors de la création de la notification:', error);
        }
      }

      return NextResponse.json(correction);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la correction partagée:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

