import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import pool, { query } from '@/lib/db';  // Fix the import to match the actual exports
import { createLogEntry } from '@/lib/services/logsService';
import { getUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, correctionId, studentName, customMessage, htmlMessage, subject } = await request.json();

    if (!email || !correctionId) {
      return NextResponse.json(
        { message: 'Email et ID de correction requis' },
        { status: 400 }
      );
    }

    // Récupérer les informations de l'activité
    const [activityInfo] = await query(`
      SELECT a.name as activity_name
      FROM corrections_autres c
      JOIN activities_autres a ON c.activity_id = a.id
      WHERE c.id = ?
    `, [correctionId]) as any[];

    if (!activityInfo) {
      return NextResponse.json(
        { message: 'Activité non trouvée' },
        { status: 404 }
      );
    }
    
    // Get the share_code from the database for this correction
    let shareCode;
    try {
      // Query share_codes table using the raw SQL query function
      const shareCodeRecords = await query(
        'SELECT code FROM share_codes WHERE correction_id = ?',
        [correctionId]
      ) as any[];

      if (!shareCodeRecords || shareCodeRecords.length === 0) {
        // If no share code exists, create one
        const newCode = Math.random().toString(36).substring(2, 10);
        await query(
          'INSERT INTO share_codes (correction_id, code, created_at) VALUES (?, ?, NOW())',
          [correctionId, newCode]
        );
        shareCode = newCode;
      } else {
        shareCode = shareCodeRecords[0].code;
      }
    } catch (dbError) {
      console.error('Database error when fetching share code:', dbError);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération du code de partage' },
        { status: 500 }
      );
    }
    
    // Create feedback URL with the share code
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://correction.sekrane.fr';
    const feedbackUrl = `${baseUrl}/feedback/${shareCode}`;

    
    // Configure email transport with proper port/secure configuration
    const transportOptions = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465, // Set secure to true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    };

    
    const transporter = nodemailer.createTransport(transportOptions);


    // Verify SMTP connection configuration
    try {
      await transporter.verify();

    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json(
        { message: 'Erreur de connexion au serveur SMTP' },
        { status: 500 }
      );
    }
    
    // Default message if no custom message is provided
    const defaultMessage = `Bonjour ${studentName},\n\La correction de votre activité est disponible en ligne.\nVous pouvez la consulter en cliquant sur le lien suivant : ${feedbackUrl}\n\nCordialement,\M. Sekrane`;

    // Prepare email content with HTML
    const emailContent = customMessage || defaultMessage;
    const htmlContent = htmlMessage || `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${emailContent.replace(/\n/g, '<br>')}
        <p style="margin-top: 20px;">
          <a href="${feedbackUrl}" 
             style="display: inline-block; padding: 10px 20px; 
                    background-color: #2196f3; color: white; 
                    text-decoration: none; border-radius: 4px;">
            Voir ma correction
          </a>
        </p>
      </div>`;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Système de Correction'}" <${process.env.EMAIL_FROM || 'admin@sekrane.fr'}>`,
      to: email,
      subject: subject || `Correction de l'activité ${activityInfo.activity_name}`,
      text: emailContent,
      html: htmlContent
    };

    
    // Send email with better error handling
    try {
      const info = await transporter.sendMail(mailOptions);

      // Récupérer les informations de l'utilisateur actuel pour le log
      const user = await getUser(request as NextRequest);
      
      // Enregistrer le log d'envoi d'email
      await createLogEntry({
        action_type: 'SEND_FEEDBACK_EMAIL',
        description: `Email de feedback envoyé à ${studentName} pour l'activité "${activityInfo.activity_name}"`,
        entity_type: 'correction',
        entity_id: parseInt(correctionId),
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: {
          activity_name: activityInfo.activity_name,
          recipient: email,
          student_name: studentName,
          has_custom_message: !!customMessage
        }
      });
      
      return NextResponse.json({ message: 'Email envoyé avec succès' });
    } catch (sendError) {
      // console.error('Error in sendMail :', sendError);
      const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
      
      return NextResponse.json(
        { message: `Erreur d'envoi du mail : ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in email API route :', error);
    return NextResponse.json(
      { message: `Erreur lors de l'envoi du mail : ${error.message}` },
      { status: 500 }
    );
  }
}
