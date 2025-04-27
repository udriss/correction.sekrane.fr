import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUser } from '@/lib/auth';
import pool from '@/lib/db';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }
    // Vérifier l'authentification et les droits d'administrateur
    
    // Vérifier si l'utilisateur est admin
    if (customUser?.id !== 1) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    // Récupérer le statut du pool de connexions manuellement
    const status = await getPoolStatusManual();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut du pool:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération du statut',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Fonction de récupération du statut du pool
async function getPoolStatusManual() {
  try {
    // Variables pour stocker les informations du pool
    let totalConnections = 'N/A';
    let freeConnections = 'N/A';
    let waitingConnections = 'N/A';
    
    // Récupérer des informations directement via des requêtes SQL plutôt que via les propriétés du pool
    
    // 1. Requête pour obtenir des statistiques MySQL sur les connexions
    const mysqlStatusResults = await query<Array<{Variable_name: string, Value: string}>>(
      'SHOW STATUS WHERE Variable_name IN (\'Threads_connected\', \'Max_used_connections\', \'Connections\', \'Aborted_connects\', \'Connection_errors_max_connections\')'
    );
    
    // Transformer les résultats en objet
    const mysqlStatus: Record<string, string> = {
      'Threads_connected': '0',
      'Max_used_connections': '0',
      'Connections': '0',
      'Aborted_connects': '0',
      'Connection_errors_max_connections': '0'
    };
    
    if (Array.isArray(mysqlStatusResults)) {
      mysqlStatusResults.forEach(item => {
        mysqlStatus[item.Variable_name] = item.Value;
      });
    }
    
    // 2. Récupérer la liste des processus actifs pour des statistiques plus détaillées
    const processlist = await query<Array<{Id: number, User: string, Host: string, db: string, Command: string, Time: number, State: string, Info: string}>>(
      'SHOW FULL PROCESSLIST'
    );
    
    // Calculer le nombre total de connexions actives
    totalConnections = mysqlStatus['Threads_connected'] || '0';
    
    // Estimer les connexions libres (difficile à obtenir directement)
    // On peut estimer en se basant sur la limite du pool et les connexions actives
    const connLimit = 30; // Valeur fixe basée sur la configuration connue
    const activeConns = parseInt(totalConnections);
    if (!isNaN(activeConns)) {
      const freeConns = Math.max(0, connLimit - activeConns);
      freeConnections = freeConns.toString();
    }
    
    // Regrouper les processus par état
    const processesByState: Record<string, number> = {};
    const processesByUser: Record<string, number> = {};
    const processesByDb: Record<string, number> = {};
    
    if (Array.isArray(processlist)) {
      processlist.forEach(process => {
        // Par état
        const state = process.State || 'null';
        processesByState[state] = (processesByState[state] || 0) + 1;
        
        // Par utilisateur
        const user = process.User || 'unknown';
        processesByUser[user] = (processesByUser[user] || 0) + 1;
        
        // Par base de données
        const db = process.db || 'null';
        processesByDb[db] = (processesByDb[db] || 0) + 1;
      });
    } else {
      // Valeurs par défaut si la liste des processus n'est pas disponible
      processesByState['null'] = 0;
      processesByUser['unknown'] = 0;
      processesByDb['null'] = 0;
    }
    
    // Créer l'objet poolInfo avec les informations collectées
    const poolInfo = {
      totalConnections: totalConnections,
      freeConnections: freeConnections,
      connectionLimit: connLimit,
      waitingCount: waitingConnections
    };
    
    // Identifier les requêtes lentes (plus de 5 secondes)
    const slowQueries = Array.isArray(processlist) ? 
      processlist
        .filter(p => p.Time > 5 && p.Info) // Filtrer les requêtes de plus de 5 secondes
        .map(p => ({
          id: p.Id,
          time: p.Time,
          state: p.State,
          info: p.Info
        })) : [];
    
    // Filtrer la liste des processus pour ne garder que ceux de la base 'correction'
    const correctionConnections = Array.isArray(processlist) 
      ? processlist.filter(process => process.db === 'correction')
      : [];
      
    // Récupérer des informations plus détaillées sur les connexions
    const detailedConnections = [];
    
    // Si nous avons des connexions à la base 'correction', récupérer plus d'informations
    if (correctionConnections.length > 0) {
      for (const conn of correctionConnections) {
        try {
          // Récupérer des informations sur les variables de session de cette connexion
          const sessionVarsResult = await query<Array<Record<string, any>>>(
            `SELECT * FROM performance_schema.session_variables 
             WHERE VARIABLE_NAME IN (
               'wait_timeout', 'interactive_timeout', 'max_execution_time', 
               'net_read_timeout', 'net_write_timeout', 'lock_wait_timeout'
             )
             AND VARIABLE_VALUE > 0`
          );
          const sessionVars = Array.isArray(sessionVarsResult) ? sessionVarsResult[0] : null;
          
          // Récupérer la mémoire utilisée par la connexion (si disponible)
          const memoryInfoResult = await query<Array<Record<string, any>>>(
            `SELECT * FROM performance_schema.memory_summary_by_thread_by_event_name 
             WHERE THREAD_ID = ${conn.Id} 
             LIMIT 10`
          );
          const memoryInfo = Array.isArray(memoryInfoResult) ? memoryInfoResult[0] : null;
          
          // Ajouter des informations sur les verrous (si disponible)
          const lockInfoResult = await query<Array<Record<string, any>>>(
            `SELECT * FROM performance_schema.data_locks 
             WHERE THREAD_ID = ${conn.Id} 
             LIMIT 10`
          );
          const lockInfo = Array.isArray(lockInfoResult) ? lockInfoResult[0] : null;
          
          // Ajouter toutes ces informations à notre connexion
          detailedConnections.push({
            ...conn,
            sessionVariables: sessionVars || [],
            memoryInfo: memoryInfo || [],
            lockInfo: lockInfo || []
          });
        } catch (err) {
          // Si nous ne pouvons pas récupérer les informations détaillées, 
          // ajouter juste les informations de base
          detailedConnections.push(conn);
        }
      }
    }
    
    // Ajouter les connexions à la base 'correction' à l'objet de retour
    return {
      timestamp: new Date().toISOString(),
      mysqlStatus,
      poolInfo,
      connectionCount: parseInt(totalConnections) || 0,
      processesByState,
      processesByUser,
      processesByDb,
      slowQueries,
      correctionConnections: detailedConnections
    };
  } catch (error) {
    console.error('Error getting pool status:', error);
    
    // En cas d'erreur, retourner un objet avec des valeurs par défaut
    // pour éviter les erreurs côté client
    return { 
      error: 'Failed to get pool status', 
      details: error,
      timestamp: new Date().toISOString(),
      mysqlStatus: {
        'Threads_connected': '0',
        'Max_used_connections': '0',
        'Connections': '0',
        'Aborted_connects': '0',
        'Connection_errors_max_connections': '0'
      },
      poolInfo: {
        totalConnections: '0',
        freeConnections: '0',
        connectionLimit: 10,
        waitingCount: '0'
      },
      connectionCount: 0,
      processesByState: { 'null': 0 },
      processesByUser: { 'unknown': 0 },
      processesByDb: { 'null': 0 },
      slowQueries: [],
      correctionConnections: []
    };
  }
}

// Ajouter une méthode POST pour gérer les actions administratives sur la base de données
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    const customUser = await getUser();
    
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }
    
    // Vérifier si l'utilisateur est admin
    if (customUser?.id !== 1) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }
    
    // Récupérer l'action à effectuer
    const data = await request.json();
    const { action } = data;
    
    if (action === 'killConnections') {
      // Récupérer la liste des connexions actives (SHOW PROCESSLIST ne prend pas de WHERE)
      const processList = await query<Array<{Id: number, User: string, Host: string, db: string}>>(`
        SHOW PROCESSLIST
      `);
      
      let killedCount = 0;
      
      // Filtrer pour ne garder que les connexions à la base 'correction'
      // et exclure la connexion actuelle
      if (Array.isArray(processList) && processList.length > 0) {
        // Récupérer l'ID de la connexion actuelle
        const [currentConnResult] = await query<Array<{id: number}>>(`SELECT CONNECTION_ID() as id`);
        const currentConnId = currentConnResult?.id;
        
        // Filtrer en mémoire plutôt qu'avec WHERE dans la requête SQL
        const correctionProcesses = processList.filter(proc => 
          proc.db === 'correction' && proc.Id !== currentConnId
        );
        
        // Terminer chaque connexion
        for (const process of correctionProcesses) {
          try {
            // Tuer la connexion
            await query(`KILL ${process.Id}`);
            killedCount++;
          } catch (err) {
            console.error(`Erreur lors de la fermeture de la connexion ${process.Id}:`, err);
          }
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${killedCount} connexion(s) fermée(s)`,
        killedCount
      });
    }
    
    // Nouvelle action pour fermer une connexion spécifique
    if (action === 'killConnection' && data.connectionId) {
      try {
        // Vérifier que la connexion appartient à la base 'correction'
        const processList = await query<Array<{Id: number, db: string}>>(`
          SHOW PROCESSLIST
        `);
        
        const connectionId = data.connectionId;
        const connectionToKill = Array.isArray(processList) 
          ? processList.find(proc => proc.Id === connectionId && proc.db === 'correction')
          : null;
          
        if (connectionToKill) {
          // Fermer la connexion spécifique
          await query(`KILL ${connectionId}`);
          
          return NextResponse.json({ 
            success: true, 
            message: `Connexion ${connectionId} fermée avec succès`
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            error: `La connexion ${connectionId} n'a pas été trouvée ou n'appartient pas à la base 'correction'`
          }, { status: 404 });
        }
      } catch (err) {
        console.error(`Erreur lors de la fermeture de la connexion ${data.connectionId}:`, err);
        return NextResponse.json({ 
          success: false, 
          error: 'Erreur lors de la fermeture de la connexion',
          details: err instanceof Error ? err.message : 'Erreur inconnue'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Action non prise en charge' }, { status: 400 });
    
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    
    return NextResponse.json({
      error: 'Erreur lors du traitement de la requête',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}