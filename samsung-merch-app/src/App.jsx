import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import Equipe from './pages/Equipe';
import ValidationPage from './pages/ValidationPage';
import Products from './pages/Products';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import Stores from './pages/Stores';
import Affectations from './pages/Affectations';

// Thème personnalisé Samsung
const theme = createTheme({
  palette: {
    primary: {
      main: '#1428a0', // Samsung Blue
    },
    secondary: {
      main: '#000000',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only supervisor can use the web app
  if (user.role !== 'SUPERVISOR') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="map" element={<MapPage />} />
            <Route path="stores" element={<Stores />} />
            <Route path="affectations" element={<Affectations />} />
            <Route path="team" element={<Equipe />} />
            <Route path="validations" element={<ValidationPage />} />
            <Route path="products" element={<Products />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
