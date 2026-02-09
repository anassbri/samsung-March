import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getStores } from '../services/api';
import api from '../services/api';

// Import du CSS de Leaflet
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Centre de Casablanca
const CASABLANCA_CENTER = [33.5731, -7.5898];
const DEFAULT_ZOOM = 12;

function MapPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la modale de visite
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [detectedShelfShare, setDetectedShelfShare] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data);
    } catch (error) {
      console.error('Erreur lors du chargement des magasins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Couleur du badge selon le type
  const getTypeColor = (type) => {
    return type === 'OR' ? 'success' : 'primary';
  };

  // Ouvrir la modale de visite
  const handleStartVisit = (store) => {
    setSelectedStore(store);
    setDialogOpen(true);
    setAnalyzing(false);
    setAnalysisComplete(false);
    setDetectedShelfShare(null);
    setComment('');
  };

  // Fermer la modale
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStore(null);
    setAnalyzing(false);
    setAnalysisComplete(false);
    setDetectedShelfShare(null);
    setComment('');
  };

  // Simuler l'analyse IA de la photo
  const handleAnalyzeRayon = () => {
    setAnalyzing(true);
    setAnalysisComplete(false);

    // Simulation de l'analyse IA pendant 2 secondes
    setTimeout(() => {
      // Générer un shelfshare aléatoire entre 25% et 60%
      const randomShelfShare = Math.floor(Math.random() * 36) + 25;
      setDetectedShelfShare(randomShelfShare);
      setAnalyzing(false);
      setAnalysisComplete(true);
    }, 2000);
  };

  // Soumettre la visite
  const handleSubmitVisit = async () => {
    if (!selectedStore || detectedShelfShare === null) return;

    setSubmitting(true);
    try {
      await api.post('/visits', {
        userId: 1, // Utilisateur simulé
        storeId: selectedStore.id,
        shelfShare: detectedShelfShare / 100, // Convertir en décimal (ex: 0.38)
        comment: comment || `Shelfshare détecté: ${detectedShelfShare}%`,
      });

      handleCloseDialog();
      setSnackbarOpen(true);
      
      // Rafraîchir la carte
      fetchStores();
    } catch (error) {
      console.error('Erreur lors de la soumission de la visite:', error);
      alert('Erreur lors de l\'enregistrement de la visite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Carte Magasins
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Visualisation des {stores.length} magasins sur la carte
      </Typography>

      <Box
        sx={{
          height: 'calc(100vh - 250px)',
          minHeight: 400,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 2,
        }}
      >
        <MapContainer
          center={CASABLANCA_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {stores.map((store) => (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
            >
              <Popup>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {store.name}
                  </Typography>
                  <Chip
                    label={store.type}
                    color={getTypeColor(store.type)}
                    size="small"
                    sx={{ mb: 1.5 }}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleStartVisit(store)}
                      sx={{
                        backgroundColor: '#1428a0',
                        '&:hover': { backgroundColor: '#0d1c6e' },
                        textTransform: 'none',
                        width: '100%',
                      }}
                    >
                      Démarrer Visite
                    </Button>
                  </Box>
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>

      {/* Dialog de visite */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1428a0', color: 'white' }}>
          🔍 Audit Rayon
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, mt: 2 }}>
          {/* Nom du magasin */}
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Magasin : <strong>{selectedStore?.name}</strong>
          </Typography>

          {/* Zone d'analyse */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {/* Bouton Analyser Rayon (avant analyse) */}
            {!analyzing && !analysisComplete && (
              <Button
                variant="contained"
                size="large"
                onClick={handleAnalyzeRayon}
                sx={{
                  py: 3,
                  px: 5,
                  fontSize: '1.2rem',
                  backgroundColor: '#1428a0',
                  '&:hover': { backgroundColor: '#0d1c6e' },
                }}
              >
                📸 Analyser Rayon
              </Button>
            )}

            {/* Chargement de l'analyse IA */}
            {analyzing && (
              <Box sx={{ py: 4 }}>
                <CircularProgress size={80} sx={{ color: '#1428a0', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  Analyse Vision AI en cours...
                </Typography>
              </Box>
            )}

            {/* Résultat de l'analyse */}
            {analysisComplete && (
              <Box>
                {/* Image placeholder */}
                <Box
                  component="img"
                  src="https://placehold.co/600x400?text=Rayon+Samsung"
                  alt="Rayon Samsung"
                  sx={{
                    width: '100%',
                    maxHeight: 250,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mb: 2,
                  }}
                />
                
                {/* Résultat du shelfshare */}
                <Alert
                  icon={<CheckCircleIcon fontSize="inherit" />}
                  severity="success"
                  sx={{ justifyContent: 'center', mb: 3 }}
                >
                  <Typography variant="h6">
                    Shelfshare détecté : {detectedShelfShare}%
                  </Typography>
                </Alert>

                {/* Champ commentaire */}
                <TextField
                  label="Commentaire"
                  placeholder="Ajoutez un commentaire sur la visite..."
                  multiline
                  rows={3}
                  fullWidth
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitVisit}
            disabled={!analysisComplete || submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#388e3c' },
            }}
          >
            {submitting ? 'Envoi...' : '✅ Valider le Rapport'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de confirmation */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          🎉 Rapport envoyé !
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MapPage;
