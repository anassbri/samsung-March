import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Avatar,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { getStores, getAssignments, createAssignment, updateAssignment, deleteAssignment, importAssignmentsBulk } from '../services/api';
import { Role } from '../types/user';
import { getUsers } from '../api/usersApi';

function Affectations() {
  const [assignments, setAssignments] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [stores, setStoresState] = useState([]);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [filterRole, setFilterRole] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStoreId, setFilterStoreId] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    date: dayjs(),
    userId: '',
    storeId: '',
    tasks: [{ description: '', status: 'TODO' }],
  });

  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('list'); // list | calendar | board

  const loadUsersAndStores = async () => {
    try {
      const [usersPage, storesData] = await Promise.all([
        getUsers(0, 500), // server-side pagination
        getStores(),
      ]);
      setUsers(usersPage.content || []);
      setStoresState(Array.isArray(storesData) ? storesData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs / magasins:', err);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateParam = selectedDate ? selectedDate.format('YYYY-MM-DD') : null;
      const data = await getAssignments({
        date: dateParam,
        userId: filterUserId || null,
        storeId: filterStoreId || null,
        page,
        size: pageSize,
      });
      setAssignments(data.content || []);
      setTotalRows(data.totalElements || 0);
    } catch (err) {
      console.error('Erreur lors du chargement des affectations:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndStores();
  }, []);

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, filterUserId, filterStoreId, page, pageSize]);

  const handleOpenDialog = (assignment = null) => {
    setEditingAssignment(assignment);
    if (assignment) {
      setFormData({
        date: dayjs(assignment.date),
        userId: assignment.userId,
        storeId: assignment.storeId,
        tasks: assignment.tasks && assignment.tasks.length
          ? assignment.tasks.map((t) => ({ description: t.description, status: t.status || 'TODO' }))
          : [{ description: '', status: 'TODO' }],
      });
    } else {
      setFormData({
        date: selectedDate || dayjs(),
        userId: '',
        storeId: '',
        tasks: [{ description: '', status: 'TODO' }],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAssignment(null);
  };

  const handleSaveAssignment = async () => {
    if (!formData.date || !formData.userId || !formData.storeId) {
      setSnackbar({ open: true, message: 'Date, utilisateur et magasin sont obligatoires.', severity: 'error' });
      return;
    }
    const payload = {
      date: formData.date.format('YYYY-MM-DD'),
      userId: Number(formData.userId),
      storeId: Number(formData.storeId),
      tasks: formData.tasks
        .filter((t) => t.description && t.description.trim().length > 0)
        .map((t) => ({
          description: t.description.trim(),
          status: t.status || 'TODO',
        })),
    };
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, payload);
        setSnackbar({ open: true, message: 'Affectation mise à jour.', severity: 'success' });
      } else {
        await createAssignment(payload);
        setSnackbar({ open: true, message: 'Affectation créée.', severity: 'success' });
      }
      handleCloseDialog();
      await loadAssignments();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'affectation:', err);
      const message = err.response?.data?.error || err.response?.data || 'Erreur lors de la sauvegarde.';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!window.confirm(`Supprimer l'affectation de ${assignment.userName} au magasin ${assignment.storeName} ?`)) {
      return;
    }
    try {
      await deleteAssignment(assignment.id);
      setSnackbar({ open: true, message: 'Affectation supprimée.', severity: 'success' });
      await loadAssignments();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'affectation:', err);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression.', severity: 'error' });
    }
  };

  const handleCsvImport = () => {
    setCsvDialogOpen(true);
  };

  const handleCsvFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data || [];
          const mapped = rows
            .map((row) => {
              const dateStr = row.date || row.Date;
              const userEmail = row.userEmail || row.email || row.Email;
              const storeName = row.storeName || row.store || row.Store;
              const tasksStr = row.tasks || row.Tasks || '';
              if (!dateStr || !userEmail || !storeName) {
                return null;
              }
              const user = users.find((u) => u.email === userEmail);
              const store = stores.find((s) => s.name === storeName);
              if (!user || !store) {
                return null;
              }
              const tasks = String(tasksStr || '')
                .split(';')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((desc) => ({ description: desc, status: 'TODO' }));
              return {
                date: dayjs(dateStr).format('YYYY-MM-DD'),
                userId: user.id,
                storeId: store.id,
                tasks,
              };
            })
            .filter(Boolean);

          if (!mapped.length) {
            setSnackbar({ open: true, message: 'Aucune ligne valide trouvée (email/nom magasin).', severity: 'error' });
            setCsvLoading(false);
            return;
          }

          await importAssignmentsBulk(mapped);
          setSnackbar({ open: true, message: `${mapped.length} affectations importées.`, severity: 'success' });
          setCsvDialogOpen(false);
          await loadAssignments();
        } catch (err) {
          console.error('Erreur lors de l\'import des affectations:', err);
          const message = err.response?.data?.error || 'Erreur lors de l\'import.';
          setSnackbar({ open: true, message, severity: 'error' });
        } finally {
          setCsvLoading(false);
        }
      },
      error: (err) => {
        console.error('Erreur de lecture CSV:', err);
        setSnackbar({ open: true, message: 'Erreur de lecture du fichier CSV.', severity: 'error' });
        setCsvLoading(false);
      },
    });
  };

  const filteredUsersByRole = useMemo(() => {
    if (!filterRole) return users;
    return users.filter((u) => u.role === filterRole);
  }, [users, filterRole]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'date', headerName: 'Date', width: 110, valueGetter: (v, row) => row.date },
    { field: 'userName', headerName: 'Utilisateur', flex: 1, minWidth: 180 },
    { field: 'userRole', headerName: 'Rôle', width: 120 },
    { field: 'storeName', headerName: 'Magasin', flex: 1, minWidth: 180 },
    { field: 'storeCity', headerName: 'Ville', width: 130 },
    { field: 'storeType', headerName: 'Type', width: 90 },
    {
      field: 'status',
      headerName: 'Statut',
      width: 130,
      renderCell: (params) => {
        const status = params.row.status;
        let color = 'default';
        let label = status;
        if (status === 'PLANNED') {
          color = 'default';
          label = 'À faire';
        } else if (status === 'IN_PROGRESS') {
          color = 'primary';
          label = 'En cours';
        } else if (status === 'DONE') {
          color = 'success';
          label = 'Terminé';
        } else if (status === 'CANCELLED') {
          color = 'error';
          label = 'Annulé';
        }
        return <Chip label={label} size="small" color={color} />;
      },
    },
    {
      field: 'taskProgress',
      headerName: 'Tâches',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        const total = params.row.totalTasks || 0;
        const completed = params.row.completedTasks || 0;
        const value = total > 0 ? (completed / total) * 100 : 0;
        return (
          <Box sx={{ width: '100%' }}>
            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
              {completed}/{total} terminées
            </Typography>
            <LinearProgress variant="determinate" value={value} />
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => handleOpenDialog(params.row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteAssignment(params.row)}
          >
            Suppr.
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Affectations quotidiennes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Planification des promoteurs/SFOS par magasin et par jour
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
            >
              <ToggleButton value="list">Liste</ToggleButton>
              <ToggleButton value="calendar">Calendrier</ToggleButton>
              <ToggleButton value="board">Board</ToggleButton>
            </ToggleButtonGroup>
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog(null)}
              sx={{
                backgroundColor: '#1428a0',
                '&:hover': { backgroundColor: '#0d1c6e' },
              }}
            >
              Ajouter une affectation
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <DatePicker
            label="Date"
            value={selectedDate}
            onChange={(v) => {
              setSelectedDate(v || dayjs());
              setPage(0);
            }}
            slotProps={{ textField: { size: 'small' } }}
          />

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={filterRole}
              label="Rôle"
              size="small"
              onChange={(e) => {
                setFilterRole(e.target.value);
                setFilterUserId('');
              }}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value={Role.SFOS}>SFOS</MenuItem>
              <MenuItem value={Role.PROMOTER}>Promoter</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Utilisateur</InputLabel>
            <Select
              value={filterUserId}
              label="Utilisateur"
              size="small"
              onChange={(e) => {
                setFilterUserId(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Tous</MenuItem>
              {filteredUsersByRole.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Magasin</InputLabel>
            <Select
              value={filterStoreId}
              label="Magasin"
              size="small"
              onChange={(e) => {
                setFilterStoreId(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Tous</MenuItem>
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erreur lors du chargement des affectations.
          </Alert>
        )}

        {!loading && !error && assignments.length === 0 && viewMode === 'list' && (
          <Box
            sx={{
              mt: 4,
              p: 4,
              borderRadius: 2,
              border: '1px dashed #ccc',
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Aucune affectation planifiée pour cette journée
            </Typography>
            <Typography variant="body2">
              Utilisez le bouton &laquo; Ajouter une affectation &raquo; pour planifier vos équipes.
            </Typography>
          </Box>
        )}

        {viewMode === 'list' && (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={assignments}
              columns={columns}
              loading={loading}
              paginationMode="server"
              rowCount={totalRows}
              page={page}
              pageSize={pageSize}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              pageSizeOptions={[20, 50, 100]}
              disableRowSelectionOnClick
            />
          </Box>
        )}

        {viewMode === 'calendar' && (
          <Box sx={{ mt: 2 }}>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              height={650}
              events={assignments.map((a) => ({
                id: String(a.id),
                title: `${a.userName} @ ${a.storeName}`,
                start: a.date,
                color:
                  a.status === 'DONE'
                    ? '#4caf50'
                    : a.status === 'CANCELLED'
                    ? '#f44336'
                    : '#1428a0',
              }))}
            />
          </Box>
        )}

        {viewMode === 'board' && (
          <Box sx={{ mt: 2 }}>
            {assignments.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  borderRadius: 2,
                  border: '1px dashed #ccc',
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Aucun élément dans le board
                </Typography>
                <Typography variant="body2">
                  Créez une affectation pour voir apparaître des cartes dans le board.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {[
                  { key: 'PLANNED', label: 'À FAIRE', borderColor: '#ff9800' },
                  { key: 'IN_PROGRESS', label: 'EN COURS', borderColor: '#2196f3' },
                  { key: 'DONE', label: 'TERMINÉ', borderColor: '#4caf50' },
                ].map((column) => (
                  <Grid item xs={12} md={4} key={column.key}>
                    <Box
                      sx={{
                        backgroundColor: 'grey.100',
                        borderRadius: 2,
                        p: 2,
                        minHeight: 320,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold' }}>
                        {column.label}
                      </Typography>
                      {assignments
                        .filter((a) => a.status === column.key)
                        .map((a) => (
                          <Box
                            key={a.id}
                            sx={{
                              mb: 1.5,
                              p: 1.5,
                              backgroundColor: 'white',
                              borderRadius: 2,
                              boxShadow: 1,
                              borderLeft: `5px solid ${column.borderColor}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {a.storeName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mb: 0.5, gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {a.userName?.charAt(0) || '?'}
                              </Avatar>
                              <Typography variant="body2" color="text.secondary">
                                {a.userName} • {a.storeCity}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {a.date}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                Tâches: {a.completedTasks}/{a.totalTasks}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={a.totalTasks ? (a.completedTasks / a.totalTasks) * 100 : 0}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </Box>
                        ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Dialog création / édition */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingAssignment ? 'Modifier l\'affectation' : 'Nouvelle affectation'}</DialogTitle>
          <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(v) => setFormData((f) => ({ ...f, date: v || dayjs() }))}
            />
            <FormControl fullWidth required>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={filterRole}
                label="Rôle"
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setFormData((f) => ({ ...f, userId: '' }));
                }}
              >
                <MenuItem value={Role.SFOS}>SFOS</MenuItem>
                <MenuItem value={Role.PROMOTER}>Promoter</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Utilisateur</InputLabel>
              <Select
                value={formData.userId}
                label="Utilisateur"
                onChange={(e) => setFormData((f) => ({ ...f, userId: e.target.value }))}
              >
                {filteredUsersByRole.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Magasin</InputLabel>
              <Select
                value={formData.storeId}
                label="Magasin"
                onChange={(e) => setFormData((f) => ({ ...f, storeId: e.target.value }))}
              >
                {stores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="subtitle1">Tâches</Typography>
            {formData.tasks.map((task, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '4px',
                    border: '2px solid #ccc',
                    backgroundColor: task.status === 'DONE' ? '#4caf50' : 'transparent',
                  }}
                />
                <TextField
                  label={`Tâche ${idx + 1}`}
                  fullWidth
                  value={task.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((f) => {
                      const next = [...f.tasks];
                      next[idx] = { ...next[idx], description: value };
                      return { ...f, tasks: next };
                    });
                  }}
                />
                <FormControl sx={{ minWidth: 130 }} size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={task.status || 'TODO'}
                    label="Statut"
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((f) => {
                        const next = [...f.tasks];
                        next[idx] = { ...next[idx], status: value };
                        return { ...f, tasks: next };
                      });
                    }}
                  >
                    <MenuItem value="TODO">À faire</MenuItem>
                    <MenuItem value="IN_PROGRESS">En cours</MenuItem>
                    <MenuItem value="DONE">Terminé</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  color="error"
                  onClick={() =>
                    setFormData((f) => ({
                      ...f,
                      tasks: f.tasks.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  X
                </Button>
              </Box>
            ))}
            <Button
              size="small"
              variant="outlined"
              sx={{
                alignSelf: 'flex-start',
                mt: 1,
                borderColor: '#1428a0',
                color: '#1428a0',
                '&:hover': { borderColor: '#0d1c6e', backgroundColor: 'rgba(20, 40, 160, 0.04)' },
              }}
              onClick={() =>
                setFormData((f) => ({
                  ...f,
                  tasks: [...f.tasks, { description: '', status: 'TODO' }],
                }))
              }
            >
              Ajouter une tâche
            </Button>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button variant="contained" onClick={handleSaveAssignment}>
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* CSV Import Dialog */}
        <Dialog open={csvDialogOpen} onClose={() => !csvLoading && setCsvDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Importer des affectations (CSV)</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Format attendu (en-têtes) :
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: '0.75rem', mb: 2 }}
            >
{`date,userEmail,storeName,tasks
2026-02-01,anass.promoter@samsung.ma,ElectroPlanet Marjane Californie,Ronde du matin;Audit rayon`}
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              disabled={csvLoading}
              sx={{ backgroundColor: '#1428a0', '&:hover': { backgroundColor: '#0d1c6e' } }}
            >
              {csvLoading ? 'Import en cours...' : 'Sélectionner un fichier CSV'}
              <input type="file" accept=".csv" hidden onChange={handleCsvFile} />
            </Button>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCsvDialogOpen(false)} disabled={csvLoading}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}

export default Affectations;

