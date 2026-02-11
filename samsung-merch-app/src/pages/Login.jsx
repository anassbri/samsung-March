import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import samsungLogo from '../assets/samsung png.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Veuillez saisir votre email et mot de passe.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      login(data.token, {
        id: data.userId,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      });
      navigate('/');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      const message =
        err.response?.data || 'Email ou mot de passe incorrect.';
      setError(typeof message === 'string' ? message : 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #034EA2 0%, #0d2b6e 40%, #050a1a 100%)',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '80%',
          height: '120%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(3, 78, 162, 0.15) 0%, transparent 60%)',
        },
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 5 }}>
          {/* Samsung Logo */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Box
              component="img"
              src={samsungLogo}
              alt="Samsung"
              sx={{
                width: 160,
                height: 'auto',
                mb: 2,
              }}
            />
          </Box>

          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
            }}
          >
            Merchandising
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 4,
              textAlign: 'center',
              color: '#888',
              fontSize: '0.85rem',
            }}
          >
            Connectez-vous au tableau de bord superviseur
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': { fontSize: '0.85rem' },
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#034EA2',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#034EA2',
                },
              }}
            />
            <TextField
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#034EA2',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#034EA2',
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: '#034EA2',
                fontSize: '0.95rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(3, 78, 162, 0.35)',
                '&:hover': {
                  backgroundColor: '#023b7a',
                  boxShadow: '0 6px 20px rgba(3, 78, 162, 0.4)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: 'white' }} />
              ) : (
                'Se connecter'
              )}
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 4,
              color: '#bbb',
              fontSize: '0.7rem',
            }}
          >
            Samsung Electronics © 2026 – Supervisor Dashboard
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
