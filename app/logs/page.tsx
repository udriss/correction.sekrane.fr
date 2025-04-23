'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  IconButton,
  Box,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  alpha
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import ClearIcon from '@mui/icons-material/Clear';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import LoadingSpinner from '@/components/LoadingSpinner';
import GradientBackground from '@/components/ui/GradientBackground';
import PatternBackground from '@/components/ui/PatternBackground';

// Types pour les entrées de logs
interface LogEntry {
  id: number;
  action_type: string;
  description: string;
  entity_type: string | null;
  entity_id: number | null;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  metadata: any;
  created_at: string;
}

// Types pour la pagination
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types pour les options de filtre
interface FilterOptions {
  actionTypes: string[];
  entityTypes: string[];
}

// Page principale des logs
export default function LogsPage() {
  // États pour les données et le chargement
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    actionTypes: [],
    entityTypes: []
  });
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorQuery, setErrorQuery] = useState<string | null>(null);
  const [errorParams, setErrorParams] = useState<any | null>(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    actionType: '',
    entityType: '',
    entityId: '',
    username: '',
    startDate: dayjs().subtract(7, 'day'),
    endDate: dayjs(),
    searchTerm: ''
  });
  
  // État pour le dialogue de détails
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Hook de notification
  const { enqueueSnackbar } = useSnackbar();
  
  // Charger les logs au chargement de la page et lorsque les filtres changent
  useEffect(() => {
    fetchLogs();
    fetchFilterOptions();
  }, [pagination.page, pagination.limit]);
  
  // Fonction pour récupérer les logs
  const fetchLogs = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    setError(null);
    // Réinitialiser les détails d'erreur
    setErrorDetails(null);
    setErrorQuery(null);
    setErrorParams(null);
    
    try {
      // Construire l'URL avec les filtres
      let url = `/api/logs?page=${page}&limit=${limit}`;
      
      if (filters.actionType) url += `&actionType=${encodeURIComponent(filters.actionType)}`;
      if (filters.entityType) url += `&entityType=${encodeURIComponent(filters.entityType)}`;
      if (filters.entityId) url += `&entityId=${encodeURIComponent(filters.entityId)}`;
      if (filters.username) url += `&username=${encodeURIComponent(filters.username)}`;
      if (filters.startDate) url += `&startDate=${encodeURIComponent(filters.startDate.format('YYYY-MM-DD'))}`;
      if (filters.endDate) url += `&endDate=${encodeURIComponent(filters.endDate.format('YYYY-MM-DD'))}`;
      if (filters.searchTerm) url += `&search=${encodeURIComponent(filters.searchTerm)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        const errorMessages: Record<number, string> = {
          401: 'Authentification requise pour accéder aux logs du système',
          403: 'Vous n\'avez pas les permissions nécessaires pour accéder aux logs',
          404: 'La page de logs demandée n\'existe pas',
          500: 'Erreur interne du serveur lors de la récupération des logs'
        };
        
        const defaultErrorMessage = `Erreur lors de la récupération des logs: ${response.statusText}`;
        const errorMessage = errorMessages[response.status] || defaultErrorMessage;
        
        // Extraire les détails d'erreur s'ils existent
        if (errorData.details) {
          setErrorDetails(errorData.details);
        }
        if (errorData.query) {
          setErrorQuery(errorData.query);
        }
        if (errorData.params) {
          setErrorParams(errorData.params);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération des logs');
      enqueueSnackbar('Erreur lors du chargement des logs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les options de filtre
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/logs?getFilterOptions=true');
      
      if (!response.ok) {
        const errorMessages: Record<number, string> = {
          401: 'Authentification requise pour accéder aux options de filtre',
          403: 'Vous n\'avez pas les permissions nécessaires pour accéder aux options de filtre',
          500: 'Erreur interne du serveur lors de la récupération des options de filtre'
        };
        
        const defaultErrorMessage = `Erreur lors de la récupération des options de filtre: ${response.statusText}`;
        const errorMessage = errorMessages[response.status] || defaultErrorMessage;
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setFilterOptions(data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      enqueueSnackbar('Erreur lors du chargement des options de filtre', { variant: 'error' });
    }
  };
  
  // Gestionnaire de changement de page de pagination
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination({ ...pagination, page: value });
    fetchLogs(value, pagination.limit);
  };
  
  // Gestionnaire de changement de limite par page
  const handleLimitChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newLimit = Number(event.target.value);
    setPagination({ ...pagination, limit: newLimit, page: 1 });
    fetchLogs(1, newLimit);
  };
  
  // Gestionnaire pour appliquer les filtres
  const handleApplyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    fetchLogs(1, pagination.limit);
  };
  
  // Gestionnaire pour réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({
      actionType: '',
      entityType: '',
      entityId: '',
      username: '',
      startDate: dayjs().subtract(7, 'day'),
      endDate: dayjs(),
      searchTerm: ''
    });
    
    // Appliquer les filtres réinitialisés
    setPagination({ ...pagination, page: 1 });
    fetchLogs(1, pagination.limit);
  };
  
  // Gestionnaire pour le changement des valeurs de filtre
  const handleFilterChange = (field: string, value: any) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  // Gestionnaire pour ouvrir le dialogue de détails
  const handleOpenDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };
  
  // Gestionnaire pour fermer le dialogue de détails
  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };
  
  // Fonction pour formater la date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  // Fonction pour déterminer la couleur du chip du type d'action
  const getActionTypeColor = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'create':
      case 'add':
      case 'insert':
        return 'success';
      case 'update':
      case 'edit':
      case 'modify':
        return 'info';
      case 'delete':
      case 'remove':
        return 'error';
      case 'login':
      case 'logout':
      case 'auth':
        return 'secondary';
      case 'email':
      case 'mail':
      case 'send':
        return 'primary';
      case 'error':
      case 'fail':
      case 'exception':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <GradientBackground variant="primary">
          <PatternBackground 
            pattern="dots" 
            opacity={0.05} 
            color="black" 
            size={100}
            sx={{ p: 4, borderRadius: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  p: 1.5,
                  borderRadius: '50%',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <DescriptionIcon sx={{ fontSize: 50, color: 'white' }} />
              </Box>
              
              <Box>
                <Typography variant="h4" fontWeight={700} color="text.primary">Logs du système</Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.9 }}>
                  Visualisez et analysez les actions importantes effectuées dans l'application
                </Typography>
              </Box>
            </Box>
          </PatternBackground>
        </GradientBackground>
        
        {/* Statistiques */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  minHeight: 105,
                  textAlign: 'center',
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.1)
                }}
              >
                <Typography variant="overline">Total des logs</Typography>
                <Typography variant="h4" fontWeight="bold">{pagination.total}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  minHeight: 105,
                  textAlign: 'center',
                  bgcolor: theme => alpha(theme.palette.secondary.main, 0.1)
                }}
              >
                <Typography variant="overline">Types d'actions</Typography>
                <Typography variant="h4" fontWeight="bold">{filterOptions.actionTypes.length}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  minHeight: 105,
                  textAlign: 'center',
                  bgcolor: theme => alpha(theme.palette.info.main, 0.1)
                }}
              >
                <Typography variant="overline">Types d'entités</Typography>
                <Typography variant="h4" fontWeight="bold">{filterOptions.entityTypes.length}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  minHeight: 105,
                  bgcolor: theme => alpha(theme.palette.success.main, 0.1)
                }}
              >
                <Typography variant="overline">Période actuelle</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {filters.startDate.format('DD/MM/YYYY')} - {filters.endDate.format('DD/MM/YYYY')}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Filtres */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="primary" />
          Filtres
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type d'action</InputLabel>
              <Select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                label="Type d'action"
              >
                <MenuItem value="">Tous</MenuItem>
                {filterOptions.actionTypes
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
                  .map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type d'entité</InputLabel>
              <Select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                label="Type d'entité"
              >
                <MenuItem value="">Tous</MenuItem>
                {filterOptions.entityTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="ID d'entité"
              type="number"
              value={filters.entityId}
              onChange={(e) => handleFilterChange('entityId', e.target.value)}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Nom d'utilisateur"
              value={filters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
            />
          </Grid>
          
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Date de début"
                value={filters.startDate}
                onChange={(newValue) => handleFilterChange('startDate', newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Date de fin"
                value={filters.endDate}
                onChange={(newValue) => handleFilterChange('endDate', newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </LocalizationProvider>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Rechercher"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="success" 
              onClick={handleApplyFilters}
              startIcon={<FilterListIcon />}
              fullWidth
            >
              Appliquer les filtres
            </Button>
            

          </Grid>
        </Grid>
      </Paper>
      
      {/* Tableau des logs */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <LoadingSpinner size="md" text="Chargement des logs..." />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {error}
            </Typography>
            {errorDetails && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha('#000', 0.05), borderRadius: 1, overflow: 'auto' }}>
                <Typography variant="body2" fontFamily="monospace" style={{ whiteSpace: 'pre-wrap' }}>
                  {errorDetails}
                </Typography>
                {errorQuery && (
                  <>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Requête SQL:</Typography>
                    <Typography variant="body2" fontFamily="monospace" style={{ whiteSpace: 'pre-wrap' }}>
                      {errorQuery}
                    </Typography>
                  </>
                )}
                {errorParams && (
                  <>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Paramètres:</Typography>
                    <Typography variant="body2" fontFamily="monospace" style={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(errorParams, null, 2)}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Alert>
        ) : logs.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aucun log trouvé pour les filtres sélectionnés.
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Affichage de {(pagination.page - 1) * pagination.limit + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} logs
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button 
              color='error'
              variant="outlined" 
              startIcon={<ClearIcon />}
              onClick={handleResetFilters}
            >
              Réinitialiser
            </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<RefreshIcon />}
                onClick={() => fetchLogs()}
              >
                Actualiser
              </Button>
              </Box>  
            </Box>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type d'action</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Entité</TableCell>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action_type} 
                          size="small" 
                          color={getActionTypeColor(log.action_type) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description}
                      </TableCell>
                      <TableCell>
                        {log.entity_type ? (
                          <Typography variant="body2">
                            {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {log.username || '-'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Voir les détails">
                          <IconButton size="small" onClick={() => handleOpenDetails(log)}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Lignes par page</InputLabel>
                <Select
                  value={pagination.limit}
                  onChange={handleLimitChange as any}
                  label="Lignes par page"
                >
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
              
              <Pagination 
                count={pagination.totalPages} 
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          </>
        )}
      </Paper>
      
      {/* Dialogue de détails du log */}
      <Dialog 
        open={detailsOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedLog && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              Détails du log #{selectedLog.id}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, }}>
                  <Typography variant="overline" color="text.secondary">Type d'action</Typography>
                  {/* Retrait du Typography qui causait l'erreur d'hydratation */}
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Chip 
                      label={selectedLog.action_type} 
                      size="small" 
                      color={getActionTypeColor(selectedLog.action_type) as any}
                    />
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, }}>
                  <Typography variant="overline" color="text.secondary">Date</Typography>
                  <Typography variant="body1" gutterBottom>{formatDate(selectedLog.created_at)}</Typography>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="overline" color="text.secondary">Description</Typography>
                  <Typography variant="body1" gutterBottom>{selectedLog.description}</Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, }}>
                  <Typography variant="overline" color="text.secondary">Type d'entité</Typography>
                  <Typography variant="body1" gutterBottom>{selectedLog.entity_type || '-'}</Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, }}>
                  <Typography variant="overline" color="text.secondary">ID d'entité</Typography>
                  <Typography variant="body1" gutterBottom>{selectedLog.entity_id || '-'}</Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, }}>
                  <Typography variant="overline" color="text.secondary">Utilisateur</Typography>
                  <Typography variant="body1" gutterBottom>{selectedLog.username || '-'}</Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, }}>
                  <Typography variant="overline" color="text.secondary">Adresse IP</Typography>
                  <Typography variant="body1" gutterBottom>{selectedLog.ip_address || '-'}</Typography>
                </Grid>
                
                {selectedLog.metadata && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="overline" color="text.secondary">Métadonnées</Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        bgcolor: theme => alpha(theme.palette.background.default, 0.5),
                        overflow: 'auto'
                      }}
                    >
                      <pre style={{ margin: 0, overflowX: 'auto' }}>
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails} color="primary">
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}