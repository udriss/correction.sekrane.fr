import React, { useState, useEffect } from 'react';
import { 
  Box, 
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
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StorageIcon from '@mui/icons-material/Storage';
import useAuth from '@/hooks/useAuth';
import { cleanupIdleConnections } from '@/lib/db';

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
  // Nouvelle propriété pour les connexions détaillées à la base 'correction'
  correctionConnections: Array<{
    Id: number;
    User: string;
    Host: string;
    db: string;
    Command: string;
    Time: number;
    State: string;
    Info: string;
    sessionVariables?: any[];
    memoryInfo?: any[];
    lockInfo?: any[];
  }>;
  error?: string;
  details?: any;
}

interface DatabaseMonitoringProps {
  expanded?: boolean;
}

export default function DatabaseMonitoring({ expanded = true }: DatabaseMonitoringProps) {
  const { user } = useAuth();
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Vérifier si l'utilisateur est admin (id === 1)
  const isAdmin = user?.id === 1;
  const [killingConnections, setKillingConnections] = useState(false);
  const [killMessage, setKillMessage] = useState<string | null>(null);
  const [cleaningSleepConnections, setCleaningSleepConnections] = useState(false);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(false);


  // Fonction pour nettoyer les connexions dormantes
const cleanSleepConnections = async (minIdleTime = 30) => {
    if (!isAdmin) return;
    
    try {
      setCleaningSleepConnections(true);
      setKillMessage(null);
      
      // Appel à l'API pour nettoyer les connexions dormantes
      const response = await fetch('/api/admin/db-status/cleanup-sleep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minIdleTimeSeconds: minIdleTime }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors du nettoyage des connexions dormantes: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Afficher un message avec le nombre de connexions fermées
      setKillMessage(`${data.killedCount} connexion(s) dormante(s) fermée(s) - Inactives depuis plus de ${minIdleTime} secondes`);
      
      // Rafraîchir les données après la fermeture des connexions
      fetchPoolStatus();
      
      // Masquer le message après quelques secondes
      setTimeout(() => {
        setKillMessage(null);
      }, 5000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setCleaningSleepConnections(false);
    }
  };
  // Fonction pour fermer toutes les connexions à la base de données 'correction'
  const killCorrectionConnections = async () => {
    if (!isAdmin) return;
    
    try {
      setKillingConnections(true);
      setKillMessage(null);
      
      const response = await fetch('/api/admin/db-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'killConnections' }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la fermeture des connexions: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Afficher un message temporaire
      setKillMessage(`${data.killedCount} connexion(s) fermée(s) avec succès`);
      
      // Rafraîchir les données après la fermeture des connexions
      fetchPoolStatus();
      
      // Masquer le message après quelques secondes
      setTimeout(() => {
        setKillMessage(null);
      }, 5000);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setKillMessage(null);
    } finally {
      setKillingConnections(false);
    }
  };

  // Fonction pour récupérer le statut du pool
  const fetchPoolStatus = async () => {
    if (!isAdmin) return;
    
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

  // Auto-rafraîchissement - Modifié pour rafraîchir toutes les sections, y compris les détails des connexions
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh && isAdmin) {
      intervalId = setInterval(() => {
        // Cette fonction fetchPoolStatus est appelée périodiquement et récupère toutes les données
        // y compris les détails des connexions à la base 'correction'
        fetchPoolStatus();
      }, 5000); // Rafraîchir toutes les 5 secondes
      
      // Ajouter un message informant l'utilisateur que la mise à jour automatique est active
      console.log('Mise à jour automatique activée - toutes les sections sont rafraîchies, y compris les détails des connexions');
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, isAdmin]);

  // Récupérer les données initiales
  useEffect(() => {
    if (isAdmin) {
      fetchPoolStatus();
    }
  }, [isAdmin]);

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

  // Si l'utilisateur n'est pas admin
  if (!isAdmin) {
    return null;
  }

  // Contenu principal du composant
  const monitoringContent = (
    <>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {killMessage && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {killMessage}
        </Alert>
      )}

      {!loading && !error && !poolStatus && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucune donnée disponible. Veuillez rafraîchir.
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

            {/* Nouveau Paper pour afficher les détails des connexions à la base 'correction' */}
            {poolStatus.correctionConnections && poolStatus.correctionConnections.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    mt: 3
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorageIcon fontSize="small" />
                      Détails des connexions à la base 'correction' ({poolStatus.correctionConnections.length})
                    </Typography>
                    <Tooltip title="Rafraîchir les détails des connexions">
                      <IconButton 
                        size="small" 
                        onClick={fetchPoolStatus} 
                        color="primary"
                        disabled={loading}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {poolStatus.correctionConnections.map((conn) => (
                    <Box 
                      key={conn.Id} 
                      sx={{ 
                        mb: 3, 
                        p: 2, 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                        boxShadow: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Connexion ID: {conn.Id}
                        </Typography>
                        <Chip 
                          label={`${conn.State || 'Inactif'}`} 
                          color={conn.State ? 'primary' : 'default'} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm:6, md: 4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Utilisateur:</Typography>
                          <Typography variant="body2">{conn.User}@{conn.Host}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm:6, md: 4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Base de données:</Typography>
                          <Typography variant="body2">{conn.db}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm:6, md: 4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Commande:</Typography>
                          <Typography variant="body2">{conn.Command}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm:6, md: 4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Temps d'exécution:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" component="span">
                              {conn.Time} secondes
                            </Typography>
                            {conn.Time > 10 && (
                              <Chip 
                                label="Longue durée" 
                                color="warning" 
                                size="small" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm:6, md: 4 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>État:</Typography>
                          <Typography variant="body2">{conn.State || 'Aucun'}</Typography>
                        </Grid>
                      </Grid>
                      
                      {conn.Info && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Requête en cours:</Typography>
                          <Paper 
                            sx={{ 
                              p: 1.5, 
                              mt: 1, 
                              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                              overflowX: 'auto',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem'
                            }}
                          >
                            {conn.Info}
                          </Paper>
                        </>
                      )}
                      
                      {/* Afficher les variables de session si disponibles */}
                      {conn.sessionVariables && conn.sessionVariables.length > 0 && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Variables de session:</Typography>
                          <TableContainer sx={{ maxHeight: 200 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Variable</TableCell>
                                  <TableCell>Valeur</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {conn.sessionVariables.map((variable: any, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{variable.VARIABLE_NAME}</TableCell>
                                    <TableCell>{variable.VARIABLE_VALUE}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                      
                      {/* Afficher les informations de mémoire si disponibles */}
                      {conn.memoryInfo && conn.memoryInfo.length > 0 && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Utilisation mémoire:</Typography>
                          <TableContainer sx={{ maxHeight: 200 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Événement</TableCell>
                                  <TableCell>Mémoire allouée</TableCell>
                                  <TableCell>Mémoire utilisée</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {conn.memoryInfo.map((info: any, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{info.EVENT_NAME}</TableCell>
                                    <TableCell>{info.SUM_NUMBER_OF_BYTES_ALLOC || 'N/A'}</TableCell>
                                    <TableCell>{info.CURRENT_NUMBER_OF_BYTES_USED || 'N/A'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                      
                      {/* Afficher les informations de verrous si disponibles */}
                      {conn.lockInfo && conn.lockInfo.length > 0 && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Verrous:</Typography>
                          <TableContainer sx={{ maxHeight: 200 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Mode</TableCell>
                                  <TableCell>Table</TableCell>
                                  <TableCell>Durée</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {conn.lockInfo.map((lock: any, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{lock.LOCK_TYPE}</TableCell>
                                    <TableCell>{lock.LOCK_MODE}</TableCell>
                                    <TableCell>{lock.OBJECT_NAME || 'N/A'}</TableCell>
                                    <TableCell>{lock.LOCK_DURATION || 'N/A'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                      
                      {/* Bouton pour fermer cette connexion spécifique */}
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/admin/db-status', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                  action: 'killConnection', 
                                  connectionId: conn.Id 
                                }),
                              });
                              
                              if (response.ok) {
                                fetchPoolStatus();
                              }
                            } catch (err) {
                              console.error('Erreur lors de la fermeture de la connexion:', err);
                            }
                          }}
                        >
                          Fermer cette connexion
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </>
  );

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        mb: 4,
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorageIcon />
          <Typography variant="h6">Monitoring de la base de données</Typography>
        </Box>
        <Box>
          {/* Fix for the Tooltip wrapping disabled button issue */}
          {loading ? (
            <Tooltip title="Rafraîchir">
              <span>
                <IconButton 
                  color="inherit" 
                  disabled={true}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="Rafraîchir">
              <IconButton 
                color="inherit" 
                onClick={fetchPoolStatus}
                size="small"
                sx={{ mr: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          <Button 
            variant="contained" 
            color="info" 
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{ mr: 1, fontSize: '0.75rem' }}
          >
            {autoRefresh ? "Désactiver auto" : "Activer auto"}
          </Button>
          
          {/* Bouton pour le nettoyage automatique des connexions Sleep */}
          <Button 
            variant="contained" 
            color={autoCleanupEnabled ? "success" : "warning"} 
            size="small"
            onClick={() => setAutoCleanupEnabled(!autoCleanupEnabled)}
            sx={{ mr: 1, fontSize: '0.75rem' }}
          >
            {autoCleanupEnabled ? "Auto-nettoyage ON" : "Auto-nettoyage OFF"}
          </Button>
          
          {/* Bouton pour nettoyer les connexions dormantes */}
          {cleaningSleepConnections ? (
            <Tooltip title="Nettoyage des connexions dormantes">
              <span>
                <Button 
                  variant="contained" 
                  color="warning" 
                  size="small"
                  disabled={true}
                  sx={{ mr: 1, fontSize: '0.75rem' }}
                >
                  Nettoyage Sleep...
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button 
              variant="contained" 
              color="warning" 
              size="small"
              onClick={() => cleanSleepConnections(30)}
              disabled={false}
              sx={{ mr: 1, fontSize: '0.75rem' }}
            >
              Nettoyer Sleep
            </Button>
          )}
          
          {/* Bouton pour fermer toutes les connexions */}
          {loading ? (
            <Tooltip title="Fermer connexions">
              <span>
                <Button 
                  variant="contained" 
                  color="error" 
                  size="small"
                  disabled={true}
                  sx={{ mr: 1, fontSize: '0.75rem' }}
                >
                  Fermer connexions
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button 
              variant="contained" 
              color="error" 
              size="small"
              onClick={killCorrectionConnections}
              disabled={false}
              sx={{ mr: 1, fontSize: '0.75rem' }}
            >
              Fermer connexions
            </Button>
          )}
          <IconButton 
            color="inherit" 
            onClick={() => setIsExpanded(!isExpanded)}
            size="small"
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      <Collapse in={isExpanded}>
        <Box sx={{ p: 3 }}>
          {monitoringContent}
        </Box>
      </Collapse>
    </Paper>
  );
}