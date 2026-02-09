import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Fab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { useUserStats } from '../hooks/useStats';
import { useUsersByRole } from '../hooks/useUsers';
import { Role, User, CreateUserDto } from '../types/user';
import UserFormModal from '../components/Equipe/UserFormModal';
import { importUsersBulk } from '../api/usersApi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Equipe() {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: loadingStats, error: statsError } = useUserStats();
  const {
    data: sfosData,
    isLoading: loadingSFOS,
    error: sfosError,
  } = useUsersByRole(Role.SFOS, page, pageSize);
  const {
    data: promotersData,
    isLoading: loadingPromoters,
    error: promotersError,
  } = useUsersByRole(Role.PROMOTER, page, pageSize);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset to first page when switching tabs
  };

  const handleCsvImport = () => {
    setCsvDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Map CSV columns to CreateUserDto
          const users: CreateUserDto[] = results.data.map((row: any) => {
            // Expected CSV columns: name, email, password, role, region, managerId (optional, for PROMOTER)
            const role = (row.role || row.Role || '').toUpperCase();
            const mappedRole = role === 'PROMOTER' ? Role.PROMOTER : 
                              role === 'SFOS' ? Role.SFOS : 
                              role === 'SUPERVISOR' ? Role.SUPERVISOR : Role.SFOS;

            return {
              name: row.name || row.Name || '',
              email: row.email || row.Email || '',
              password: row.password || row.Password || 'password123', // Default password
              role: mappedRole,
              region: row.region || row.Region || '',
              sfosId: row.managerId || row.manager_id || row.sfosId || row.sfos_id 
                ? Number(row.managerId || row.manager_id || row.sfosId || row.sfos_id) 
                : undefined,
            };
          }).filter((user: CreateUserDto) => user.name && user.email); // Filter out invalid rows

          if (users.length === 0) {
            toast.error('Aucune ligne valide trouvée dans le CSV');
            setCsvLoading(false);
            return;
          }

          // Send to backend
          await importUsersBulk(users);
          
          // Refresh data
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['userStats'] });
          
          toast.success(`${users.length} utilisateur(s) importé(s) avec succès !`);
          setCsvDialogOpen(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error: any) {
          const message = error.response?.data?.error || error.message || 'Erreur lors de l\'import';
          toast.error(message);
        } finally {
          setCsvLoading(false);
        }
      },
      error: (error) => {
        toast.error('Erreur lors de la lecture du fichier CSV: ' + error.message);
        setCsvLoading(false);
      },
    });
  };

  // SFOS columns
  const sfosColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 200 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 250 },
    { field: 'region', headerName: 'Région', width: 150 },
    {
      field: 'subordinatesCount',
      headerName: 'Promoters',
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
  ];

  // Promoters columns
  const promotersColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 200 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 250 },
    { field: 'region', headerName: 'Région', width: 150 },
    {
      field: 'managerName',
      headerName: 'Manager SFOS',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row: User) => row.managerName || 'N/A',
    },
  ];

  const sfosRows: GridRowsProp = sfosData?.content || [];
  const promotersRows: GridRowsProp = promotersData?.content || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Gestion de l'Équipe
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion des utilisateurs et hiérarchie
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={handleCsvImport}
          sx={{
            borderColor: '#1428a0',
            color: '#1428a0',
            '&:hover': { borderColor: '#0d1c6e', backgroundColor: 'rgba(20, 40, 160, 0.04)' },
          }}
        >
          Import CSV
        </Button>
      </Box>

      {/* Stats Cards */}
      {loadingStats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <CircularProgress />
        </Box>
      ) : statsError ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          Erreur lors du chargement des statistiques
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SupervisorAccountIcon sx={{ fontSize: 40, color: '#1428a0' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      SFOS
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats?.sfos || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Promoters
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats?.promoters || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Supervisors
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats?.supervisors || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`SFOS (${sfosData?.totalElements || 0})`} />
          <Tab label={`Promoters (${promotersData?.totalElements || 0})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {loadingSFOS ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : sfosError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Erreur lors du chargement des SFOS
            </Alert>
          ) : (
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={sfosRows}
                columns={sfosColumns}
                paginationMode="server"
                rowCount={sfosData?.totalElements || 0}
                page={page}
                pageSize={pageSize}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none',
                  },
                }}
              />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loadingPromoters ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : promotersError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Erreur lors du chargement des Promoters
            </Alert>
          ) : (
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={promotersRows}
                columns={promotersColumns}
                paginationMode="server"
                rowCount={promotersData?.totalElements || 0}
                page={page}
                pageSize={pageSize}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none',
                  },
                }}
              />
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#1428a0',
          '&:hover': { backgroundColor: '#0d1c6e' },
        }}
        onClick={() => setModalOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* User Form Modal */}
      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* CSV Import Dialog */}
      <Dialog open={csvDialogOpen} onClose={() => !csvLoading && setCsvDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1428a0', color: 'white' }}>
          Importer des utilisateurs (CSV)
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Format CSV attendu (avec en-têtes):
            </Typography>
            <Typography variant="body2" component="pre" sx={{ 
              backgroundColor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1, 
              fontSize: '0.75rem',
              overflow: 'auto',
            }}>
{`name,email,password,role,region,managerId
Ahmed Benali,ahmed.benali@samsung.ma,password123,SFOS,Casablanca,
Fatima Alami,fatima.alami@samsung.ma,password123,PROMOTER,Rabat,1`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Notes:</strong>
              <br />• Les colonnes peuvent être en minuscules ou majuscules
              <br />• Pour les PROMOTER, le managerId (ID d'un SFOS) est requis
              <br />• Le mot de passe par défaut est "password123" si non fourni
            </Typography>
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={csvLoading}
            fullWidth
            sx={{
              backgroundColor: '#1428a0',
              '&:hover': { backgroundColor: '#0d1c6e' },
            }}
          >
            {csvLoading ? 'Import en cours...' : 'Sélectionner un fichier CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCsvDialogOpen(false)} color="inherit" disabled={csvLoading}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
