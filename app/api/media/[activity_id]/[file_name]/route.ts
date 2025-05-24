import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Route API pour servir les fichiers uploadés (images et audio) en production
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activity_id: string; file_name: string }> }
) {
  try {
    // Await the params
    const { activity_id, file_name } = await params;
    
    // Construire le chemin du fichier
    const filePath = path.join(process.cwd(), 'public', 'uploads', activity_id, file_name);
    
    // Vérifier que le fichier existe
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`Fichier non trouvé: ${filePath}`);
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }
    
    // Lire le contenu du fichier
    const fileBuffer = await fs.readFile(filePath);
    
    // Déterminer le type MIME basé sur l'extension du fichier
    const fileExtension = path.extname(file_name).toLowerCase();
    let contentType = 'application/octet-stream'; // Type par défaut
    
    console.log(`File: ${file_name}, Extension: ${fileExtension}`);
    
    // Déterminer le type MIME approprié avec un mapping plus complet pour audio et images
    const mimeTypes: {[key: string]: string} = {
      // Types audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.oga': 'audio/ogg',
      '.webm': 'audio/webm',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      // Types image
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon'
    };

    contentType = mimeTypes[fileExtension] || contentType;
    
    console.log(`Serving media file: ${file_name} with extension: ${fileExtension} and content type: ${contentType}`);
    
    // Créer et retourner la réponse avec le contenu du fichier et les en-têtes appropriés
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${file_name}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache d'un an pour les fichiers statiques
        'Accept-Ranges': 'bytes' // Support pour le streaming partiel
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du fichier média' },
      { status: 500 }
    );
  }
}
