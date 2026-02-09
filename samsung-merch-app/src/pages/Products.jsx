import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
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
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InventoryIcon from '@mui/icons-material/Inventory';
import { getProducts, createProduct, importProductsBulk } from '../services/api';
import Papa from 'papaparse';

// Catégories principales
const MAIN_CATEGORIES = {
  'WHITE_GOODS': 'White Goods',
  'BROWN_GOODS': 'Brown Goods',
};

// Sous-catégories par catégorie principale
const SUB_CATEGORIES = {
  'WHITE_GOODS': [
    'Lave-linge',
    'Réfrigérateur',
    'Lave-vaisselle',
    'Four',
    'Micro-ondes',
    'Congélateur',
    'Sèche-linge',
  ],
  'BROWN_GOODS': [
    'Téléviseur',
    'Smartphone',
    'Tablette',
    'Ordinateur',
    'Écran',
    'Enceinte',
    'Casque',
  ],
};

// Couleurs pour les catégories
const getCategoryColor = (category) => {
  if (category === 'WHITE_GOODS' || category === 'White Goods') {
    return 'primary';
  }
  return 'secondary';
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // États pour le formulaire d'ajout
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    subCategory: '',
    imageUrl: '',
  });

  // Charger les produits
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erreur lors du chargement des produits:', err);
        setError(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Ouvrir le dialog d'ajout
  const handleOpenDialog = () => {
    setDialogOpen(true);
    setFormData({
      name: '',
      sku: '',
      category: '',
      subCategory: '',
      imageUrl: '',
    });
  };

  // Fermer le dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      sku: '',
      category: '',
      subCategory: '',
      imageUrl: '',
    });
  };

  // Gérer le changement de catégorie principale (cascade)
  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;
    setFormData({
      ...formData,
      category: newCategory,
      subCategory: '', // Réinitialiser la sous-catégorie
    });
  };

  // Gérer le changement de sous-catégorie
  const handleSubCategoryChange = (event) => {
    setFormData({
      ...formData,
      subCategory: event.target.value,
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.category || !formData.subCategory) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const created = await createProduct({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        subCategory: formData.subCategory,
        imageUrl: formData.imageUrl || 'https://placehold.co/400x300?text=Samsung+Product',
      });

      // Refresh products from backend
      const updatedProducts = await getProducts();
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      handleCloseDialog();
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Erreur lors de la création du produit:', err);
      alert("Erreur lors de l'ajout du produit. Veuillez réessayer.");
    }
  };

  // Gérer l'import CSV
  const handleCsvImport = () => {
    setCsvDialogOpen(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Map CSV columns to product format
          const products = results.data.map((row) => {
            // Expected CSV columns: name, sku, category (or type), subCategory, imageUrl (optional)
            const category = (row.category || row.type || row.Category || row.Type || '').toUpperCase();
            const mappedCategory = category.includes('WHITE') ? 'WHITE_GOODS' : 
                                  category.includes('BROWN') ? 'BROWN_GOODS' : 
                                  category || 'WHITE_GOODS';

            return {
              name: row.name || row.Name || '',
              sku: row.sku || row.SKU || row.Sku || '',
              category: mappedCategory,
              subCategory: row.subCategory || row.sub_category || row.SubCategory || '',
              imageUrl: row.imageUrl || row.image_url || row.ImageUrl || '',
              description: row.description || row.Description || null,
              price: row.price ? parseFloat(row.price) : null,
              stock: row.stock ? parseInt(row.stock) : 0,
            };
          }).filter((product) => product.name && product.sku && product.subCategory); // Filter out invalid rows

          if (products.length === 0) {
            alert('Aucune ligne valide trouvée dans le CSV');
            setCsvLoading(false);
            return;
          }

          // Send to backend
          await importProductsBulk(products);
          
          // Refresh products
          const updatedProducts = await getProducts();
          setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
          
          setSnackbarOpen(true);
          setCsvDialogOpen(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err) {
          console.error('Erreur lors de l\'import CSV:', err);
          alert('Erreur lors de l\'import: ' + (err.response?.data?.error || err.message || 'Erreur inconnue'));
        } finally {
          setCsvLoading(false);
        }
      },
      error: (error) => {
        alert('Erreur lors de la lecture du fichier CSV: ' + error.message);
        setCsvLoading(false);
      },
    });
  };

  // Obtenir les sous-catégories disponibles selon la catégorie sélectionnée
  const getAvailableSubCategories = () => {
    if (!formData.category) return [];
    return SUB_CATEGORIES[formData.category] || [];
  };

  // Sous-catégories disponibles pour le filtre, en fonction de la catégorie filtrée
  const getFilterSubCategories = () => {
    if (!filterCategory) return [];
    return SUB_CATEGORIES[filterCategory] || [];
  };

  // Appliquer les filtres sur la liste des produits
  const filteredProducts = products.filter((product) => {
    const matchCategory = filterCategory ? product.type === filterCategory || product.category === filterCategory : true;
    const matchSubCategory = filterSubCategory ? product.subCategory === filterSubCategory : true;
    return matchCategory && matchSubCategory;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête avec bouton d'ajout */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Catalogue Produits
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion du catalogue Samsung ({products.length} produits)
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
            onClick={handleOpenDialog}
            sx={{
              backgroundColor: '#1428a0',
              '&:hover': { backgroundColor: '#0d1c6e' },
            }}
          >
            Ajouter un produit
          </Button>
        </Box>
      </Box>

      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par catégorie</InputLabel>
          <Select
            value={filterCategory}
            label="Filtrer par catégorie"
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubCategory('');
            }}
          >
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="WHITE_GOODS">White Goods</MenuItem>
            <MenuItem value="BROWN_GOODS">Brown Goods</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }} disabled={!filterCategory}>
          <InputLabel>Filtrer par sous-catégorie</InputLabel>
          <Select
            value={filterSubCategory}
            label="Filtrer par sous-catégorie"
            onChange={(e) => setFilterSubCategory(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            {getFilterSubCategories().map((subCat) => (
              <MenuItem key={subCat} value={subCat}>
                {subCat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Messages d'erreur et état vide */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement des produits: {error.message || 'Erreur inconnue'}
        </Alert>
      )}

      {products.length === 0 && !loading && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucun produit disponible pour le moment.
        </Alert>
      )}

      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={product.imageUrl || 'https://placehold.co/400x300?text=Samsung+Product'}
                alt={product.name}
                sx={{
                  objectFit: 'contain',
                  backgroundColor: '#f5f5f5',
                  p: 1,
                }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Chip
                    label={product.category === 'WHITE_GOODS' ? 'White Goods' : 'Brown Goods'}
                    color={getCategoryColor(product.category)}
                    size="small"
                  />
                  <Chip
                    label={product.subCategory}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 600 }}>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <InventoryIcon sx={{ fontSize: 16 }} />
                  <strong>SKU:</strong> {product.sku}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog d'ajout de produit */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1428a0', color: 'white' }}>
          Ajouter un nouveau produit
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Nom du produit"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Ex: Lave-linge Samsung WW90T534AAW"
          />

          <TextField
            label="Référence (SKU)"
            fullWidth
            required
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Ex: SKU-WG-001"
          />

          {/* Sélection en cascade : Catégorie principale */}
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={formData.category}
              label="Catégorie"
              onChange={handleCategoryChange}
            >
              <MenuItem value="WHITE_GOODS">White Goods</MenuItem>
              <MenuItem value="BROWN_GOODS">Brown Goods</MenuItem>
            </Select>
          </FormControl>

          {/* Sélection en cascade : Sous-catégorie (dépend de la catégorie) */}
          <FormControl fullWidth required sx={{ mb: 2 }} disabled={!formData.category}>
            <InputLabel>Sous-catégorie</InputLabel>
            <Select
              value={formData.subCategory}
              label="Sous-catégorie"
              onChange={handleSubCategoryChange}
            >
              {getAvailableSubCategories().map((subCat) => (
                <MenuItem key={subCat} value={subCat}>
                  {subCat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="URL de l'image (optionnel)"
            fullWidth
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
            helperText="Si vide, une image placeholder sera utilisée"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.sku || !formData.category || !formData.subCategory}
            sx={{
              backgroundColor: '#1428a0',
              '&:hover': { backgroundColor: '#0d1c6e' },
            }}
          >
            Ajouter
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
          Produit ajouté avec succès !
        </Alert>
      </Snackbar>

      {/* CSV Import Dialog */}
      <Dialog
        open={csvDialogOpen}
        onClose={() => !csvLoading && setCsvDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1428a0', color: 'white' }}>
          Importer des produits (CSV)
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
{`name,sku,category,subCategory,imageUrl
Lave-linge Samsung,SKU-WG-001,WHITE_GOODS,Lave-linge,https://...
TV Samsung QLED,SKU-BG-001,BROWN_GOODS,Téléviseur,https://...`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Notes:</strong>
              <br />• Les colonnes peuvent être en minuscules ou majuscules
              <br />• category doit être WHITE_GOODS ou BROWN_GOODS
              <br />• subCategory doit correspondre à une sous-catégorie valide
              <br />• imageUrl est optionnel
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

export default Products;
