import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { withConnection } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (optional but recommended)
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const activityId = formData.get('activityId') as string;
    const correctionId = formData.get('correctionId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }
    
    if (!activityId) {
      return NextResponse.json({ error: 'ID d\'activité requis' }, { status: 400 });
    }

    // Ensure we have a correction ID
    if (!correctionId) {
      return NextResponse.json({ error: 'ID de correction requis' }, { status: 400 });
    }
    
    // Create the destination path - simplified directory structure
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', activityId);
    
    // Make sure the directory exists
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Erreur lors de la création du répertoire:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
    
    // Generate unique filename with activity ID, correction ID and timestamp
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${activityId}_${correctionId}_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write the file
    await fs.writeFile(filePath, buffer);
    
    // Build the public URL
    const publicUrl = `/uploads/${activityId}/${uniqueFileName}`;
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      message: 'Fichier uploadé avec succès' 
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
