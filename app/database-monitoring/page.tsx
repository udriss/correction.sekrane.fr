'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Card, 
  CardContent,
  Divider,
  Grid,
  Button,
  Alert,
  Chip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Type pour les données de statut du pool
interface PoolStatus {
  timestamp: string;
  mysqlStatus: Record<string, string>;
  poolInfo: {
    totalConnections: number | string;
    freeConnections: number | string;
    connectionLimit: number;
    waitingCount: number | string;
  };
  connectionCount: number;
  processesByState: Record<string, number>;
  processesByUser: Record<string, number>;
  processesByDb: Record<string, number>;
  slowQueries: Array<{
    id: number;
    time: number;
    state: string;
    info: string;
  }>;
  error?: string;
  details?: any;
}

export default function DatabaseMonitoringPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Vérifier si l'utilisateur est admin (id === 1)
  const isAdmin = user?.id === 1;

  // Fonction pour récupérer le statut du pool
  const fetchPoolStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/db-status');
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération du statut: ${response.status}`);
      }
      
      const data = await response.json();
      setPoolStatus(data);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Auto-rafraîchissement
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchPoolStatus();
      }, 5000); // Rafraîchir toutes les 5 secondes
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  // Récupérer les données initiales
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPoolStatus();
    }
  }, [status]);

  // Rediriger si l'utilisateur n'est pas authentifié ou n'est pas admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !isAdmin) {
      router.push('/');
    }
  }, [status, isAdmin, router]);

  // Calculer le pourcentage d'utilisation des connexions
  const getConnectionUsagePercent = () => {
    if (!poolStatus?.mysqlStatus) return 0;
    
    const threadsConnected = parseInt(poolStatus.mysqlStatus['Threads_connected'] || '0');
    const maxConnections = 151; // Valeur par défaut de MySQL
    
    return Math.min(Math.round((threadsConnected / maxConnections) * 100), 100);
  };

  // Fonction pour calculer une couleur basée sur le pourcentage
  const getColorByPercent = (percent: number) => {
    if (percent < 50) return 'success.main';
    if (percent < 80) return 'warning.main';
    return 'error.main';
  };

  // Si l'utilisateur n'est pas authentifié ou si le statut est en cours de chargement
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Si l'utilisateur n'est pas admin
  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Vous n'avez pas les droits d'accès à cette page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Monitoring de la base de données MySQL
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              onClick={fetchPoolStatus} 
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Rafraîchir
            </Button>
            <Button 
              variant={autoRefresh ? "contained" : "outlined"} 
              color={autoRefresh ? "primary" : "inherit"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Désactiver auto" : "Activer auto"}
            </Button>
          </Box>
        </Box>
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !poolStatus && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aucune donnée disponible. Veuillez rafraîchir la page.
          </Alert>
        )}

        {poolStatus && (
          <>
            <Grid container spacing={3}>
              {/* Carte de statut général */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Utilisation des connexions
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Connexions actives: {poolStatus.mysqlStatus['Threads_connected'] || '0'}
                        </Typography>
                        <Typography variant="body2" color={getColorByPercent(getConnectionUsagePercent())}>
                          {getConnectionUsagePercent()}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={getConnectionUsagePercent()} 
                        color={getConnectionUsagePercent() > 80 ? "error" : getConnectionUsagePercent() > 50 ? "warning" : "success"}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      Maximum utilisé: {poolStatus.mysqlStatus['Max_used_connections'] || '0'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Total des connexions depuis le démarrage: {poolStatus.mysqlStatus['Connections'] || '0'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Connexions abandonnées: {poolStatus.mysqlStatus['Aborted_connects'] || '0'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Erreurs max_connections: {poolStatus.mysqlStatus['Connection_errors_max_connections'] || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem' }}>
                      Dernière mise à jour: {new Date(poolStatus.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Carte d'info du pool */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      État du pool de connexions
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Connexions totales dans le pool: {poolStatus.poolInfo.totalConnections}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Connexions libres: {poolStatus.poolInfo.freeConnections}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Limite de connexions du pool: {poolStatus.poolInfo.connectionLimit}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Connexions en attente: {poolStatus.poolInfo.waitingCount}
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        État des processus:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Object.entries(poolStatus.processesByState).map(([state, count]) => (
                          <Chip 
                            key={state} 
                            label={`${state}: ${count}`} 
                            size="small" 
                            color={state === 'null' ? 'default' : 'primary'}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Requêtes lentes */}
              {poolStatus.slowQueries.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Requêtes lentes ({'>'}5s)
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>ID</TableCell>
                              <TableCell>Temps (s)</TableCell>
                              <TableCell>État</TableCell>
                              <TableCell>Requête</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {poolStatus.slowQueries.map((query) => (
                              <TableRow key={query.id}>
                                <TableCell>{query.id}</TableCell>
                                <TableCell>{query.time}</TableCell>
                                <TableCell>{query.state}</TableCell>
                                <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {query.info}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Détails par utilisateur */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Connexions par utilisateur
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Utilisateur</TableCell>
                            <TableCell align="right">Nombre</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(poolStatus.processesByUser).map(([user, count]) => (
                            <TableRow key={user}>
                              <TableCell>{user}</TableCell>
                              <TableCell align="right">{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Détails par base de données */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Connexions par base de données
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Base de données</TableCell>
                            <TableCell align="right">Nombre</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(poolStatus.processesByDb).map(([db, count]) => (
                            <TableRow key={db}>
                              <TableCell>{db}</TableCell>
                              <TableCell align="right">{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Section explicative */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Comment interpréter ces données?
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" paragraph>
          <strong>Connexions actives</strong>: Le nombre actuel de connexions à la base de données. Si ce nombre est proche de la limite (151 par défaut pour MySQL), vous risquez de rencontrer l'erreur "Too many connections".
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Maximum utilisé</strong>: Le nombre maximum de connexions simultanées depuis le démarrage du serveur MySQL.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Erreurs max_connections</strong>: Le nombre de fois où l'erreur "Too many connections" s'est produite.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Connexions du pool</strong>: Informations sur le pool de connexions de l'application. Si le nombre de connexions libres est faible ou nul, cela peut indiquer une fuite de connexions.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Requêtes lentes</strong>: Les requêtes qui prennent plus de 5 secondes à s'exécuter. Ces requêtes peuvent bloquer des connexions inutilement.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Solutions possibles</strong>: Augmenter la limite de connexions dans MySQL, optimiser les requêtes lentes, fermer correctement les connexions, ou utiliser une mise en cache côté client pour réduire le nombre de requêtes.
        </Typography>
      </Paper>

      {/* Recommandations de paramétrage */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recommandations pour optimiser les connexions MySQL
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          1. Configuration du pool de connexions
        </Typography>
        <Box component="pre" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 3, overflow: 'auto' }}>
          <code>{`// Dans lib/db.ts
const pool: Pool = mysql.createPool({
  // Configuration existante...
  connectionLimit: 25,     // Augmenter de 10 à 25-30
  queueLimit: 50,          // Définir une limite pour éviter la surcharge
  waitForConnections: true,
  connectTimeout: 10000,   // 10 secondes
  idleTimeout: 30000,      // Réduire à 30 secondes pour libérer plus vite les connexions inactives
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});`}</code>
        </Box>
        
        <Typography variant="subtitle1" gutterBottom>
          2. Configuration MySQL côté serveur (my.cnf)
        </Typography>
        <Box component="pre" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 3, overflow: 'auto' }}>
          <code>{`[mysqld]
max_connections = 200      # Augmenter selon vos besoins
connect_timeout = 10       # Délai d'attente en secondes
wait_timeout = 120         # Temps avant déconnexion des sessions inactives (secondes)
interactive_timeout = 180  # Temps avant déconnexion des sessions interactives
`}</code>
        </Box>
        
        <Typography variant="subtitle1" gutterBottom>
          3. Bonnes pratiques de code
        </Typography>
        <Box sx={{ ml: 2, mb: 2 }}>
          <Typography variant="body2" paragraph>
            • Toujours utiliser <code>withConnection</code> ou <code>query</code> pour les requêtes SQL
          </Typography>
          <Typography variant="body2" paragraph>
            • Éviter les requêtes dans les boucles ou les rendus de composants React
          </Typography>
          <Typography variant="body2" paragraph>
            • Implémenter un mécanisme de cache pour les requêtes fréquentes
          </Typography>
          <Typography variant="body2" paragraph>
            • Utiliser des techniques comme le debouncing pour les recherches en temps réel
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Pour appliquer ces recommandations, contactez votre administrateur système ou effectuez les modifications dans les fichiers de configuration appropriés.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}