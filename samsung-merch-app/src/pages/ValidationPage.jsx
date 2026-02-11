import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import { getVisits, updateVisitStatus } from '../services/api';

const placeholderImage = 'https://placehold.co/600x400?text=Pas+de+photo';

const getStatusChipProps = (status) => {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'VALIDATED') {
    return { color: 'success', label: 'VALIDATED' };
  }
  if (normalized === 'REJECTED') {
    return { color: 'error', label: 'REJECTED' };
  }
  return { color: 'warning', label: 'PENDING' };
};

const timeAgo = (isoDate) => {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return `${diffSec} sec ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hrs ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} days ago`;
};

function ValidationPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = React.useState('ALL'); // ALL, COMPLETED, VALIDATED, REJECTED

  const {
    data: visits = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['visits'],
    queryFn: getVisits,
  });

  const filteredVisits = React.useMemo(() => {
    if (statusFilter === 'ALL') return visits;
    return visits.filter((v) => {
      const status = (v.status || '').toUpperCase();
      if (statusFilter === 'COMPLETED') return status === 'COMPLETED';
      if (statusFilter === 'VALIDATED') return status === 'VALIDATED';
      if (statusFilter === 'REJECTED') return status === 'REJECTED';
      return true;
    });
  }, [visits, statusFilter]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateVisitStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });

  const handleStatusChange = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Erreur lors du chargement des visites.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Richer Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#034EA2' }}>
            Validations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Le superviseur contrôle les visites terrain et les tâches réalisées.
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Chip
            label="Tous"
            onClick={() => setStatusFilter('ALL')}
            color={statusFilter === 'ALL' ? 'primary' : 'default'}
            variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label={`En attente: ${visits.filter(v => (v.status || '').toUpperCase() === 'COMPLETED').length}`}
            onClick={() => setStatusFilter('COMPLETED')}
            color={statusFilter === 'COMPLETED' ? 'warning' : 'default'}
            variant={statusFilter === 'COMPLETED' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            icon={<CheckCircleIcon />}
            label={`Validées: ${visits.filter(v => (v.status || '').toUpperCase() === 'VALIDATED').length}`}
            onClick={() => setStatusFilter('VALIDATED')}
            color={statusFilter === 'VALIDATED' ? 'success' : 'default'}
            variant={statusFilter === 'VALIDATED' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            icon={<ClearIcon />}
            label={`Rejetées: ${visits.filter(v => (v.status || '').toUpperCase() === 'REJECTED').length}`}
            onClick={() => setStatusFilter('REJECTED')}
            color={statusFilter === 'REJECTED' ? 'error' : 'default'}
            variant={statusFilter === 'REJECTED' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredVisits.map((visit) => {
          const { color, label } = getStatusChipProps(visit.status);
          const promoterName = visit.userName || 'Promoter';
          const storeName = visit.storeName || 'Store';
          const visitDate = timeAgo(visit.visitDate);
          const shelfShare = visit.shelfShare !== null && visit.shelfShare !== undefined
            ? `${Number(visit.shelfShare).toFixed(0)}%`
            : 'N/A';
          const comment = visit.comment || 'Aucun commentaire';
          const assignmentInfo = visit.assignmentId
            ? `Affectation #${visit.assignmentId}`
            : 'Aucune affectation liée';
          const tasksSummary =
            visit.totalTasks && visit.totalTasks > 0
              ? `${visit.completedTasks || 0} / ${visit.totalTasks} tâches complétées`
              : 'Aucune tâche définie';

          return (
            <Grid key={visit.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: '4px solid #034EA2',
                }}
              >
                <CardHeader
                  title={`${promoterName} • ${storeName}`}
                  subheader={visitDate}
                  action={<Chip color={color} label={label} />}
                />
                <CardMedia
                  component="img"
                  height="180"
                  image={visit.photoUrl || placeholderImage}
                  alt="Photo de visite"
                  sx={{ objectFit: 'cover', backgroundColor: '#f0f0f0' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Core KPIs */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Shelf Share: <strong>{shelfShare}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Interactions: <strong>{visit.interactionCount ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {comment}
                  </Typography>

                  {/* Trello checklist connection (tasks from affectation) */}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AssignmentTurnedInIcon sx={{ fontSize: 18, mr: 1, color: '#034EA2' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Tâches de l'affectation
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {assignmentInfo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tasksSummary}
                  </Typography>

                  {/* Interactions Detail */}
                  {visit.interactions && visit.interactions.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PeopleIcon sx={{ fontSize: 18, mr: 1, color: '#034EA2' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Interactions ({visit.interactions.length})
                        </Typography>
                      </Box>
                      {visit.interactions.slice(0, 3).map((interaction, idx) => (
                        <Box key={interaction.id || idx} sx={{ mb: 0.5, pl: 1, borderLeft: '2px solid #e0e0e0' }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>{interaction.productName || 'Produit N/A'}</strong>
                            {' — '}
                            {interaction.gender || 'N/A'}, {interaction.color || 'N/A'}
                          </Typography>
                        </Box>
                      ))}
                      {visit.interactions.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                          +{visit.interactions.length - 3} interaction(s) supplémentaire(s)
                        </Typography>
                      )}
                    </>
                  )}

                  {/* Sellout Detail */}
                  {visit.selloutItems && visit.selloutItems.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ShoppingCartIcon sx={{ fontSize: 18, mr: 1, color: '#28a745' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Ventes ({visit.selloutItems.length})
                        </Typography>
                      </Box>
                      {visit.selloutItems.slice(0, 3).map((sellout, idx) => (
                        <Box key={sellout.id || idx} sx={{ mb: 0.5, pl: 1, borderLeft: '2px solid #d4edda' }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>{sellout.productName || 'Produit'}</strong>
                            {' — Qté: '}{sellout.quantity}{', '}{(sellout.amount || 0).toFixed(2)} MAD
                          </Typography>
                        </Box>
                      ))}
                      {visit.selloutItems.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                          +{visit.selloutItems.length - 3} vente(s) supplémentaire(s)
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: '#28a745' }}>
                        Total: {visit.selloutItems.reduce((sum, s) => sum + (s.amount || 0), 0).toFixed(2)} MAD
                      </Typography>
                    </>
                  )}
                </CardContent>
                {visit.status !== 'VALIDATED' && (
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => handleStatusChange(visit.id, 'VALIDATED')}
                      >
                        ✅ Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={() => handleStatusChange(visit.id, 'REJECTED')}
                      >
                        ❌ Reject
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default ValidationPage;
