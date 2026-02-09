import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
} from '@mui/material';
import { Role, CreateUserDto, User } from '../../types/user';
import { useCreateUser } from '../../hooks/useUsers';
import { useUsersByRole } from '../../hooks/useUsers';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
}

const REGIONS = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fès',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
];

export default function UserFormModal({ open, onClose }: UserFormModalProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    name: '',
    email: '',
    password: '',
    role: Role.SFOS,
    region: '',
    sfosId: undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserDto, string>>>({});

  const createUserMutation = useCreateUser();
  const { data: sfosList, isLoading: loadingSFOS } = useUsersByRole(Role.SFOS, 0, 100);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: Role.SFOS,
        region: '',
        sfosId: undefined,
      });
      setErrors({});
    }
  }, [open]);

  const handleRoleChange = (role: Role) => {
    setFormData({
      ...formData,
      role,
      sfosId: role === Role.PROMOTER ? undefined : undefined,
    });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserDto, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.region) {
      newErrors.region = 'La région est requise';
    }

    if (formData.role === Role.PROMOTER && !formData.sfosId) {
      newErrors.sfosId = 'Un manager SFOS est requis pour les Promoters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const payload: CreateUserDto = {
      ...formData,
      sfosId: formData.role === Role.PROMOTER ? formData.sfosId : undefined,
    };

    createUserMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const isLoading = createUserMutation.isPending || loadingSFOS;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#1428a0', color: 'white' }}>
        Ajouter un utilisateur
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nom complet"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            disabled={isLoading}
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isLoading}
          />

          <TextField
            label="Mot de passe"
            type="password"
            fullWidth
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
            helperText={errors.password}
            disabled={isLoading}
          />

          <FormControl fullWidth required error={!!errors.role}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={formData.role}
              label="Rôle"
              onChange={(e) => handleRoleChange(e.target.value as Role)}
              disabled={isLoading}
            >
              <MenuItem value={Role.SFOS}>SFOS</MenuItem>
              <MenuItem value={Role.PROMOTER}>Promoter</MenuItem>
              <MenuItem value={Role.SUPERVISOR}>Supervisor</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required error={!!errors.region}>
            <InputLabel>Région</InputLabel>
            <Select
              value={formData.region}
              label="Région"
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              disabled={isLoading}
            >
              {REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
            {errors.region && (
              <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                {errors.region}
              </Box>
            )}
          </FormControl>

          {formData.role === Role.PROMOTER && (
            <FormControl fullWidth required error={!!errors.sfosId} disabled={isLoading || loadingSFOS}>
              <InputLabel>Manager SFOS</InputLabel>
              <Select
                value={formData.sfosId || ''}
                label="Manager SFOS"
                onChange={(e) => setFormData({ ...formData, sfosId: Number(e.target.value) })}
              >
                {sfosList?.content.map((sfos: User) => (
                  <MenuItem key={sfos.id} value={sfos.id}>
                    {sfos.name} ({sfos.region || 'N/A'})
                  </MenuItem>
                ))}
              </Select>
              {errors.sfosId && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                  {errors.sfosId}
                </Box>
              )}
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          sx={{
            backgroundColor: '#1428a0',
            '&:hover': { backgroundColor: '#0d1c6e' },
          }}
        >
          {isLoading ? 'Création...' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
