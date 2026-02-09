import axios from 'axios';

// Configuration de base d'Axios
// Using relative URL to leverage Vite proxy
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Récupère le résumé du dashboard (visites + affectations)
 * @returns {Promise} Résumé pour le dashboard
 */
export const getDashboardSummary = async () => {
  try {
    const response = await api.get('/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé dashboard:', error);
    throw error;
  }
};

/**
 * Récupère la liste des magasins
 * @returns {Promise} La liste des magasins
 */
export const getStores = async () => {
  try {
    const response = await api.get('/stores');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des magasins:', error);
    throw error;
  }
};

/**
 * Crée un nouveau magasin
 */
export const createStore = async (store) => {
  const response = await api.post('/stores', store);
  return response.data;
};

/**
 * Met à jour un magasin
 */
export const updateStore = async (id, store) => {
  const response = await api.put(`/stores/${id}`, store);
  return response.data;
};

/**
 * Supprime un magasin
 */
export const deleteStore = async (id) => {
  await api.delete(`/stores/${id}`);
};

/**
 * Import CSV des magasins (bulk)
 */
export const importStoresBulk = async (stores) => {
  const response = await api.post('/stores/bulk', stores);
  return response.data;
};

/**
 * Récupère la liste des utilisateurs
 * @returns {Promise} La liste des utilisateurs
 */
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

/**
 * Récupère la liste des visites
 * @returns {Promise} La liste des visites
 */
export const getVisits = async () => {
  try {
    const response = await api.get('/visits');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des visites:', error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une visite
 * @param {number} id ID de la visite
 * @param {string} status VALIDATED ou REJECTED
 * @returns {Promise} La visite mise à jour
 */
export const updateVisitStatus = async (id, status) => {
  try {
    const response = await api.patch(`/visits/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};

/**
 * Récupère la liste des produits
 * @returns {Promise} La liste des produits
 */
export const getProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    throw error;
  }
};

/**
 * Crée un nouveau produit
 * @param {{ name: string; sku: string; category: string; subCategory: string; imageUrl?: string }} product
 * @returns {Promise<any>} Le produit créé
 */
export const createProduct = async (product) => {
  try {
    const payload = {
      name: product.name,
      description: null,
      sku: product.sku,
      type: product.category, // WHITE_GOODS ou BROWN_GOODS
      subCategory: product.subCategory,
      price: null,
      imageUrl: product.imageUrl || null,
      stock: 0,
    };

    const response = await api.post('/products', payload);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    throw error;
  }
};

/**
 * Bulk import products from CSV
 * @param {Array<{ name: string; sku: string; type: string; subCategory: string; imageUrl?: string; description?: string; price?: number; stock?: number }>} products
 * @returns {Promise<any[]>} Les produits créés
 */
export const importProductsBulk = async (products) => {
  try {
    const payload = products.map(product => ({
      name: product.name,
      description: product.description || null,
      sku: product.sku,
      type: product.type || product.category, // WHITE_GOODS ou BROWN_GOODS
      subCategory: product.subCategory,
      price: product.price || null,
      imageUrl: product.imageUrl || null,
      stock: product.stock || 0,
    }));

    const response = await api.post('/products/bulk', payload);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'import en masse des produits:', error);
    throw error;
  }
};

/**
 * Assignments (Affectations)
 */

export const getAssignments = async ({ date, userId, storeId, page = 0, size = 50 }) => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (userId) params.append('userId', String(userId));
  if (storeId) params.append('storeId', String(storeId));
  params.append('page', String(page));
  params.append('size', String(size));
  const response = await api.get(`/assignments?${params.toString()}`);
  return response.data;
};

export const createAssignment = async (assignment) => {
  const response = await api.post('/assignments', assignment);
  return response.data;
};

export const updateAssignment = async (id, assignment) => {
  const response = await api.put(`/assignments/${id}`, assignment);
  return response.data;
};

export const deleteAssignment = async (id) => {
  await api.delete(`/assignments/${id}`);
};

export const importAssignmentsBulk = async (assignments) => {
  const response = await api.post('/assignments/bulk', assignments);
  return response.data;
};

export default api;
