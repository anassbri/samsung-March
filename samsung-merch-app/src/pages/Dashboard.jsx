import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { getDashboardSummary } from '../services/api';

// Données fictives pour le graphique (placeholder, à remplacer plus tard)
const salesData = [
  { day: 'Lun', ventes: 12500 },
  { day: 'Mar', ventes: 18200 },
  { day: 'Mer', ventes: 15800 },
  { day: 'Jeu', ventes: 22100 },
  { day: 'Ven', ventes: 28500 },
  { day: 'Sam', ventes: 35000 },
  { day: 'Dim', ventes: 8900 },
];

// Composant StatCard réutilisable
const StatCard = ({ title, value, icon, color }) => (
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
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}15`,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

function Dashboard() {
  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  });

  // Formater en Dirhams
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0 DH';
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' DH';
  };

  // Formater en pourcentage
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${value.toFixed(1)}%`;
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography color="error">
          Erreur lors du chargement du dashboard.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Vue d'ensemble des performances terrain
      </Typography>

      {/* Cartes statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Ventes Totales"
            value={formatCurrency(summary?.totalSales)}
            icon={<AttachMoneyIcon sx={{ fontSize: 32, color: '#4caf50' }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Visites Réalisées (complétées)"
            value={summary?.totalVisitsCompleted || 0}
            icon={<StorefrontIcon sx={{ fontSize: 32, color: '#2196f3' }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Part de Linéaire Moyenne"
            value={formatPercentage(summary?.avgShelfShare)}
            icon={<TrendingUpIcon sx={{ fontSize: 32, color: '#ff9800' }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Affectations (Plannifiées / Réalisées) - Aujourd'hui"
            value={`${summary?.assignmentsPlannedToday || 0} / ${summary?.assignmentsDoneToday || 0}`}
            icon={<TrendingUpIcon sx={{ fontSize: 32, color: '#ff9800' }} />}
            color="#034EA2"
          />
        </Grid>
      </Grid>

      {/* Graphique des ventes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Ventes par jour (semaine en cours)
          </Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <BarChart
              width={600}
              height={300}
              data={salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Ventes']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey="ventes"
                fill="#1428a0"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;
