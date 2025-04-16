import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import pool, { query } from '@/lib/db';  // Correction de l'import pour correspondre aux exports réels
import { createLogEntry } from '@/lib/services/logsService';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, studentId, studentName, customMessage, htmlMessage, subject } = await request.json();
    
    // Validation de base
    if (!email || !studentId || !subject) {
      return NextResponse.json(
        { message: 'Certains champs requis sont manquants.' }, 
        { status: 400 }
      );
    }

    // Vérifier l'existence de l'étudiant
    const student = await query(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    ) as any[];

    if (!student || student.length === 0) {
      return NextResponse.json(
        { message: 'Étudiant non trouvé.' },
        { status: 404 }
      );
    }

    // Construction de l'URL de correction
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://correction.sekrane.fr';
    const correctionsUrl = `${baseUrl}/students/${studentId}/corrections`;
    
    // Configure email transport avec la bonne configuration de port/secure
    const transportOptions = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465, // Secure=true pour le port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    };
    
    const transporter = nodemailer.createTransport(transportOptions);

    // Vérification de la configuration SMTP
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Échec de vérification SMTP:', verifyError);
      return NextResponse.json(
        { message: 'Erreur de connexion au serveur SMTP' },
        { status: 500 }
      );
    }
    
    // Message par défaut si aucun message personnalisé n'est fourni
    const defaultMessage = `Bonjour ${studentName},\n\nVeuillez trouver ci-dessous le lien vous permettant d'accéder à l'ensemble de vos corrections :\n${correctionsUrl}\n\nCordialement,\nM. Sekrane`;

    // Préparation du contenu de l'email avec HTML
    const emailContent = customMessage || defaultMessage;
    const htmlContent = htmlMessage || `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${emailContent.replace(/\n/g, '<br>')}
        <p style="margin-top: 20px;">
          <a href="${correctionsUrl}" 
             style="display: inline-block; padding: 10px 20px; 
                    background-color: #2196f3; color: white; 
                    text-decoration: none; border-radius: 4px;">
            Voir mes corrections
          </a>
        </p>
      </div>`;

    // Construction de l'email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Système de Correction'}" <${process.env.EMAIL_FROM || 'admin@sekrane.fr'}>`,
      to: email,
      subject: subject,
      text: emailContent,
      html: htmlContent,
    };

    // Envoi de l'email avec une meilleure gestion des erreurs
    try {
      const info = await transporter.sendMail(mailOptions);

      // Récupérer les informations de l'utilisateur actuel pour le log
      const user = await getUser(request);
      
      // Enregistrer le log d'envoi d'email
      await createLogEntry({
        action_type: 'SEND_CORRECTIONS_EMAIL',
        description: `Email de lien vers les corrections envoyé à ${studentName}`,
        entity_type: 'student',
        entity_id: parseInt(studentId),
        user_id: user?.id,
        username: user?.username,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        metadata: {
          recipient: email,
          student_name: studentName,
          has_custom_message: !!customMessage
        }
      });

      return NextResponse.json(
        { message: 'Email envoyé avec succès à ' + email },
        { status: 200 }
      );
    } catch (sendError) {
      const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
      
      return NextResponse.json(
        { message: `Erreur d'envoi du mail : ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json(
      { 
        message: 'Erreur lors de l\'envoi de l\'email',
        details: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
}