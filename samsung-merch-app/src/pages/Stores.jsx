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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Papa from 'papaparse';
import { getStores, createStore, updateStore, deleteStore, importStoresBulk } from '../services/api';

function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'OR',
    city: '',
    latitude: '',
    longitude: '',
    address: '',
  });

  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStores();
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur lors du chargement des magasins:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleOpenDialog = (store = null) => {
    setEditingStore(store);
    if (store) {
      setFormData({
        name: store.name || '',
        type: store.type || 'OR',
        city: store.city || '',
        latitude: store.latitude?.toString() || '',
        longitude: store.longitude?.toString() || '',
        address: store.address || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'OR',
        city: '',
        latitude: '',
        longitude: '',
        address: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStore(null);
  };

  const handleSaveStore = async () => {
    if (!formData.name || !formData.city || !formData.latitude || !formData.longitude) {
      setSnackbar({ open: true, message: 'Veuillez remplir les champs obligatoires.', severity: 'error' });
      return;
    }

    const payload = {
      name: formData.name,
      type: formData.type,
      city: formData.city,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      address: formData.address,
    };

    try {
      if (editingStore) {
        await updateStore(editingStore.id, payload);
        setSnackbar({ open: true, message: 'Magasin mis à jour avec succès.', severity: 'success' });
      } else {
        await createStore(payload);
        setSnackbar({ open: true, message: 'Magasin créé avec succès.', severity: 'success' });
      }
      handleCloseDialog();
      await loadStores();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du magasin:', err);
      const message = err.response?.data || 'Erreur lors de la sauvegarde du magasin.';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleDeleteStore = async (store) => {
    if (!window.confirm(`Supprimer le magasin "${store.name}" ?`)) {
      return;
    }
    try {
      await deleteStore(store.id);
      setSnackbar({ open: true, message: 'Magasin supprimé.', severity: 'success' });
      await loadStores();
    } catch (err) {
      console.error('Erreur lors de la suppression du magasin:', err);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression du magasin.', severity: 'error' });
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
              const name = row.name || row.Name;
              const typeRaw = row.type || row.Type;
              const city = row.city || row.City;
              const latitude = row.latitude || row.Latitude;
              const longitude = row.longitude || row.Longitude;
              const address = row.address || row.Address || '';
              if (!name || !typeRaw || !city || !latitude || !longitude) {
                return null;
              }
              const type = String(typeRaw).toUpperCase();
              return {
                name,
                type,
                city,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address,
              };
            })
            .filter(Boolean);

          if (!mapped.length) {
            setSnackbar({ open: true, message: 'Aucune ligne valide trouvée dans le CSV.', severity: 'error' });
            setCsvLoading(false);
            return;
          }

          await importStoresBulk(mapped);
          setSnackbar({ open: true, message: `${mapped.length} magasins importés.`, severity: 'success' });
          setCsvDialogOpen(false);
          await loadStores();
        } catch (err) {
          console.error('Erreur lors de l\'import CSV:', err);
          const message = err.response?.data || 'Erreur lors de l\'import des magasins.';
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

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const cityOk = filterCity ? s.city === filterCity : true;
      const typeOk = filterType ? s.type === filterType : true;
      return cityOk && typeOk;
    });
  }, [stores, filterCity, filterType]);

  const cities = useMemo(
    () => Array.from(new Set(stores.map((s) => s.city).filter(Boolean))).sort(),
    [stores],
  );

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 180 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'city', headerName: 'Ville', width: 140 },
    { field: 'latitude', headerName: 'Latitude', width: 130 },
    { field: 'longitude', headerName: 'Longitude', width: 130 },
    { field: 'address', headerName: 'Adresse', flex: 1.2, minWidth: 220 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
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
            onClick={() => handleDeleteStore(params.row)}
          >
            Suppr.
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Magasins
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion des points de vente (OR / IR) – {stores.length} magasins
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
            Ajouter un magasin
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par ville</InputLabel>
          <Select
            value={filterCity}
            label="Filtrer par ville"
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            {cities.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Filtrer par type</InputLabel>
          <Select
            value={filterType}
            label="Filtrer par type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="OR">OR (Organized)</MenuItem>
            <MenuItem value="IR">IR (Independent)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur lors du chargement des magasins.
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredStores}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          disableRowSelectionOnClick
        />
      </Box>

      {/* Dialog création / édition */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStore ? 'Modifier le magasin' : 'Nouveau magasin'}</DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nom"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <FormControl fullWidth required>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="OR">OR (Organized)</MenuItem>
              <MenuItem value="IR">IR (Independent)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Ville"
            fullWidth
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <TextField
            label="Latitude"
            fullWidth
            required
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          />
          <TextField
            label="Longitude"
            fullWidth
            required
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          />
          <TextField
            label="Adresse"
            fullWidth
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveStore}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={csvDialogOpen} onClose={() => !csvLoading && setCsvDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importer des magasins (CSV)</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Format attendu (en-têtes) :
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: '0.75rem', mb: 2 }}
          >
{`name,type,city,latitude,longitude,address
ElectroPlanet Marjane Californie,OR,Casablanca,33.5552,-7.6328,Centre Commercial Marjane Californie`}
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
  );
}

export default Stores;

