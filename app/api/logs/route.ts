import { NextRequest, NextResponse } from 'next/server';
import { createLogEntry, SystemLogEntry, getLogEntries, getLogFilterOptions } from '@/lib/services/logsService';
import { getUser } from '@/lib/auth';
import { withConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getUser(request);
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les données du log depuis le corps de la requête
    const data = await request.json();
    const {
      action_type,
      description,
      entity_type,
      entity_id,
      metadata
    } = data;

    // Valider les données minimales requises
    if (!action_type || !description) {
      return NextResponse.json(
        { error: 'Le type d\'action et la description sont requis' },
        { status: 400 }
      );
    }

    // Récupérer l'adresse IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Créer l'entrée de log
    const logEntry: SystemLogEntry = {
      action_type,
      description,
      entity_type,
      entity_id,
      user_id: user.id,
      username: user.username, // Utiliser le nom d'utilisateur au lieu de l'email
      ip_address: ip,
      metadata
    };

    const success = await createLogEntry(logEntry);

    if (success) {
      return NextResponse.json({ success: true }, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Erreur lors de la création du log' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        
        { error: 'Authentification requise pour accéder aux logs' }, 
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur a le rôle admin
    if (user.is_admin !== true) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions nécessaires pour accéder aux logs' }, 
        { status: 403 }
      );
    }

    // Récupérer les paramètres de la requête
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const actionType = url.searchParams.get('actionType');
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');
    const username = url.searchParams.get('username');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');
    const getFilterOptions = url.searchParams.get('getFilterOptions') === 'true';

    return await withConnection(async (connection) => {
      // Si on demande seulement les options de filtre
      if (getFilterOptions) {
        const [actionTypesResult] = await connection.query(
          'SELECT DISTINCT action_type FROM system_logs'
        );
        
        const [entityTypesResult] = await connection.query(
          'SELECT DISTINCT entity_type FROM system_logs WHERE entity_type IS NOT NULL'
        );
        
        const actionTypes = Array.isArray(actionTypesResult) 
          ? (actionTypesResult as any[]).map(row => row.action_type)
          : [];
        
        const entityTypes = Array.isArray(entityTypesResult)
          ? (entityTypesResult as any[]).map(row => row.entity_type)
          : [];
        
        return NextResponse.json({ 
          actionTypes, 
          entityTypes 
        });
      }
      
      // Construire la requête SQL
      let query = 'SELECT * FROM system_logs WHERE 1=1';
      const params: any[] = [];
      
      if (actionType) {
        query += ' AND action_type = ?';
        params.push(actionType);
      }
      
      if (entityType) {
        query += ' AND entity_type = ?';
        params.push(entityType);
      }
      
      if (entityId) {
        query += ' AND entity_id = ?';
        params.push(entityId);
      }
      
      if (username) {
        query += ' AND username LIKE ?';
        params.push(`%${username}%`);
      }
      
      if (startDate) {
        query += ' AND DATE(created_at) >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND DATE(created_at) <= ?';
        params.push(endDate);
      }
      
      if (search) {
        query += ' AND (description LIKE ? OR action_type LIKE ? OR entity_type LIKE ? OR username LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      // Compter le nombre total de résultats - CORRECTION : Créer une requête COUNT distincte
      // CORRECTION: Supprimer la duplication de "1=1"
      const countQuery = `SELECT COUNT(*) as total FROM system_logs WHERE 1=1`;
      // Créer une nouvelle clause WHERE sans inclure le "1=1" du début
      const whereClause = query.substring(query.indexOf('WHERE') + 5 + 4); // Ajouter 4 pour ignorer "1=1"
      const finalCountQuery = `${countQuery}${whereClause}`;
      
      try {
        const [countResult] = await connection.query(finalCountQuery, params);
        
        const total = Array.isArray(countResult) && countResult.length > 0
          ? (countResult[0] as any).total
          : 0;
        
        // Ajouter l'ordre et la pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, (page - 1) * limit];
        
        // Exécuter la requête
        const [rows] = await connection.query(query, queryParams);
        
        // Calculer les informations de pagination
        const totalPages = Math.ceil(total / limit);
        
        return NextResponse.json({
          logs: rows,
          pagination: {
            total,
            page,
            limit,
            totalPages
          }
        });
      } catch (error) {
        console.error('Error in SQL query:', error);
        console.error('Query:', finalCountQuery);
        console.error('Params:', params);
        
        // Remonter l'erreur détaillée au client
        return NextResponse.json(
          { 
            error: 'Erreur lors de la récupération des logs du système',
            details: (error as Error).message,
            query: finalCountQuery,
            params: params
          },
          { status: 500 }
        );
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des logs du système',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}