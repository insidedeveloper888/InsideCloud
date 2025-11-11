import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import clientConfig from '../../config/client_config.js';
import { handleJSAPIAccess, handleUserAuth } from '../../utils/auth_access_util.js';
import OrganizationSelector, { ORGANIZATION_SLUG_KEY } from '../../components/organizationSelector/index.js';
import MembersList from '../../components/membersList';
import DepartmentsList from '../../components/departmentsList';
import BitableTables from '../../components/bitableTables';
import ProtectedLayout from '../../layouts/ProtectedLayout.jsx';
import {
  Box,
  Stack,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Building2,
  FileText,
  Shield,
  RefreshCw,
} from 'lucide-react';
import './index.css';

const companySummary = {
  annualTarget: 1_000_000,
  currentProgress: 750_000,
  monthlyRevenue: 125_000,
  monthlyExpenses: 85_000,
  profitMargin: 32,
  kpiAchievement: 78,
};

const announcementItems = [
  {
    id: 1,
    title: 'Q1 Performance Review Complete',
    description:
      'Cross-functional review closed out with strong growth in marketing and product adoption. Consolidated insights are ready for leadership.',
    date: '2025-03-15',
    category: 'Performance',
    image: '/inside-advisory/hero-tablet.jpg',
  },
  {
    id: 2,
    title: 'Happy Birthday Sarah Chen!',
    description:
      'Join the marketing team at 3 PM for a quick celebration in the lounge as we recognise Sarah for leading the growth squad.',
    date: '2025-03-16',
    category: 'Culture',
    image: '/inside-advisory/hero-mobile.jpg',
  },
  {
    id: 3,
    title: 'New Remote Work Policy',
    description:
      'Updated hybrid guidelines now include wellness Fridays and a refreshed equipment stipend. Please review before 31 March.',
    date: '2025-03-12',
    category: 'Policy',
    image: '/inside-advisory/hero-desktop.jpg',
  },
];

const departmentHighlights = [
  {
    id: 'marketing',
    name: 'Marketing',
    status: 'healthy',
    summary: 'Qualified pipeline grew by 18% thanks to the refreshed awareness campaigns.',
    milestone: 'Launch Q2 growth experiments',
  },
  {
    id: 'sales',
    name: 'Sales',
    status: 'improving',
    summary: 'Average deal size is now RM12.5K after adoption of the new playbooks.',
    milestone: 'Roll out account-based strategy',
  },
  {
    id: 'operations',
    name: 'Operations',
    status: 'at-risk',
    summary: 'Fulfilment SLA dipped by 4%. Automation rollout is in progress to stabilise.',
    milestone: 'Stabilise fulfilment automation',
  },
];

const spotlightProfile = {
  name: 'Sarah Chen',
  role: 'Marketing Director',
  message:
    'Led the digital growth squad to a record quarter and mentored three new team leads. Sarah is driving the Inside Advisory brand to new heights.',
};

const statusPalette = {
  healthy: { label: 'Healthy', color: 'success' },
  improving: { label: 'Improving', color: 'info' },
  'at-risk': { label: 'Needs Attention', color: 'warning' },
  critical: { label: 'Critical', color: 'error' },
};

const resolveApiOrigin = () =>
  clientConfig.apiOrigin && clientConfig.apiOrigin.length > 0
    ? clientConfig.apiOrigin
    : window.location.origin;

const formatCurrency = (value) => `RM ${value.toLocaleString('en-MY')}`;

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const formatDateTime = (value) => new Date(value).toLocaleString();

const titleizeSlug = (slug) =>
  slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : '';

const DashboardContent = ({ userInfo, organizationName, organizationSlug, onNavigate }) => {
  const progress = useMemo(
    () => Math.round((companySummary.currentProgress / companySummary.annualTarget) * 100),
    []
  );

  const displayOrgName = organizationName || titleizeSlug(organizationSlug) || 'Inside Advisory';

  const metrics = [
    {
      key: 'target',
      title: 'Annual Target Completion',
      primary: `${progress}%`,
      secondary: `${formatCurrency(companySummary.currentProgress)} / ${formatCurrency(
        companySummary.annualTarget
      )}`,
      icon: Target,
      change: '+5% vs last quarter',
      accent: 'linear-gradient(135deg, #1f4fff 0%, #7c3aed 100%)',
    },
    {
      key: 'revenue',
      title: 'Revenue This Month',
      primary: formatCurrency(companySummary.monthlyRevenue),
      secondary: 'Pipeline conversion up by 12%',
      icon: DollarSign,
      change: '+12% vs last month',
      accent: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    },
    {
      key: 'profit',
      title: 'Operating Profit Margin',
      primary: `${companySummary.profitMargin}%`,
      secondary: 'Expense ratio optimised by finance',
      icon: TrendingUp,
      change: '+3 pts vs last month',
      accent: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
    },
    {
      key: 'kpi',
      title: 'KPI Achievement',
      primary: `${companySummary.kpiAchievement}%`,
      secondary: 'Team engagement holding steady',
      icon: Shield,
      change: '+2 pts vs last review',
      accent: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    },
  ];

  const quickActions = [
    { label: 'Manage Users', icon: Users, view: 'users' },
    { label: 'Review Audit Log', icon: FileText, view: 'audit_log' },
    { label: 'Configure Organization', icon: Building2, view: 'organization' },
  ];

  return (
    <Stack spacing={4} sx={{ mt: 2 }}>
      <Box
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          color: 'common.white',
          minHeight: { xs: 260, md: 280 },
          boxShadow: '0px 25px 45px rgba(15, 23, 42, 0.25)',
        }}
      >
        <Box
          component="img"
          src="/inside-advisory/hero-desktop.jpg"
          alt="Inside Advisory hero"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,64,175,0.65) 50%, rgba(30,64,175,0.35) 100%)',
          }}
        />
        <Box
          sx={{
            position: 'relative',
            p: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: { xs: 3, md: 4 },
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ letterSpacing: 2, color: 'rgba(255,255,255,0.75)' }}>
              Inside Advisory Platform
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {displayOrgName}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 460, color: 'rgba(255,255,255,0.85)' }}>
              Welcome back {userInfo?.en_name || 'team'}. Track performance, manage teams, and keep your
              organisation aligned in one place.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="contained"
                    color="secondary"
                    onClick={() => onNavigate && onNavigate(action.view)}
                    startIcon={<Icon size={16} />}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.12)',
                      borderRadius: 999,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                    }}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </Stack>
          </Stack>

          <Card
            sx={{
              borderRadius: 3,
              minWidth: 220,
              backdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(15,23,42,0.55)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar src={userInfo?.avatar_url || undefined} sx={{ width: 48, height: 48 }}>
                    {(userInfo?.en_name || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" color="common.white">
                      {userInfo?.en_name || 'Authenticated User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Admin · Inside Advisory
                    </Typography>
                  </Box>
                </Stack>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <Stack spacing={0.75}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Next Review
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Calendar size={16} />
                    <Typography variant="body2">Leadership sync · 25 March, 9:30 AM</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Grid item xs={12} sm={6} xl={3} key={metric.key}>
              <Card
                sx={{
                  borderRadius: 4,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0px 18px 36px rgba(15, 23, 42, 0.12)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: metric.accent,
                    opacity: 0.08,
                  }}
                />
                <CardContent sx={{ position: 'relative' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack spacing={0.75}>
                      <Typography variant="caption" color="text.secondary">
                        {metric.title}
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {metric.primary}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.secondary}
                      </Typography>
                    </Stack>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'rgba(31, 79, 255, 0.08)',
                        color: 'primary.main',
                      }}
                    >
                      <Icon size={22} />
                    </Avatar>
                  </Stack>
                  <Chip
                    icon={<ArrowUpRight size={14} />}
                    label={metric.change}
                    size="small"
                    sx={{ mt: 2, fontWeight: 500 }}
                    color="success"
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    Announcements & Updates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest communications curated for leadership and team leads
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={2.5} mt={3}>
                {announcementItems.map((announcement) => (
                  <Card key={announcement.id} variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                      <Box
                        component="img"
                        src={announcement.image}
                        alt={announcement.title}
                        sx={{
                          width: 120,
                          height: 88,
                          borderRadius: 3,
                          objectFit: 'cover',
                          boxShadow: '0px 12px 18px rgba(15,23,42,0.12)',
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={announcement.category} size="small" color="primary" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(announcement.date)}
                          </Typography>
                        </Stack>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                          {announcement.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {announcement.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Department Health
                </Typography>
                <Stack spacing={1.5}>
                  {departmentHighlights.map((department) => {
                    const palette = statusPalette[department.status] ?? statusPalette.healthy;
                    return (
                      <Box
                        key={department.id}
                        sx={{
                          borderRadius: 3,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          p: 2,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1" fontWeight={600}>
                            {department.name}
                          </Typography>
                          <Chip
                            label={palette.label}
                            color={palette.color}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          {department.summary}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Next milestone: {department.milestone}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Spotlight
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 56, height: 56 }}>
                    {spotlightProfile.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {spotlightProfile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {spotlightProfile.role}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {spotlightProfile.message}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

const AccountView = ({ userInfo, organizationName, organizationSlug }) => (
  <Stack spacing={3} sx={{ mt: 2 }}>
    <Typography variant="h4" fontWeight={600}>
      Account
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <Avatar
                src={userInfo?.avatar_url || undefined}
                alt={userInfo?.en_name || 'User Avatar'}
                sx={{ width: 96, height: 96, fontSize: 32 }}
              >
                {(userInfo?.en_name || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <Stack spacing={0.5} alignItems="center">
                <Typography variant="h6">{userInfo?.en_name || 'Authenticated User'}</Typography>
                {userInfo?.name && userInfo?.en_name && userInfo?.en_name !== userInfo?.name && (
                  <Typography variant="body2" color="text.secondary">
                    {userInfo.name}
                  </Typography>
                )}
                <Chip label="Admin" color="primary" size="small" />
              </Stack>
              <Divider flexItem sx={{ mt: 1 }} />
              <Stack spacing={0.75} sx={{ width: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Tenant key
                </Typography>
                <Typography variant="body2">{userInfo?.tenant_key || 'Not provided'}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">
                  Mobile
                </Typography>
                <Typography variant="body1">{userInfo?.mobile || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{userInfo?.email || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">
                  Organization
                </Typography>
                <Typography variant="body1">
                  {organizationName || titleizeSlug(organizationSlug) || 'Inside Advisory'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Stack>
);

const UsersView = () => (
  <Stack spacing={3} sx={{ mt: 2 }}>
    <Typography variant="h4" fontWeight={600}>
      People
    </Typography>
    <MembersList />
    <DepartmentsList />
  </Stack>
);

const AuditLogView = ({ organizationSlug }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setLoading(true);
    setError(null);
    try {
      const base = resolveApiOrigin();
      const params = new URLSearchParams();
      if (organizationSlug) {
        params.append('organization_slug', organizationSlug);
      }
      const query = params.toString();
      const response = await fetch(`${base}/api/get_audit_logs${query ? `?${query}` : ''}`, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs (${response.status})`);
      }
      const json = await response.json();
      if (json.code !== 0) {
        throw new Error(json.msg || 'Failed to fetch audit logs');
      }
      setLogs(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Audit Log
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Latest activity for {titleizeSlug(organizationSlug) || 'this organisation'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={fetchLogs}>
          Refresh
        </Button>
      </Stack>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }} spacing={2}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading audit events…
              </Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No audit events recorded yet. When important actions are performed they will appear here.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="18%">Event</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell width="22%">Timestamp</TableCell>
                  <TableCell width="16%">IP / Client</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Chip
                        label={log.event_type || 'event'}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.payload?.action || log.payload?.description || 'Audit action recorded'}
                      </Typography>
                      {log.payload?.actor && (
                        <Typography variant="caption" color="text.secondary">
                          Actor: {log.payload.actor}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDateTime(log.occurred_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.ip || '--'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.user_agent ? log.user_agent.slice(0, 42) : 'n/a'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

const OrganizationView = ({ organizationName, organizationSlug, onChangeOrganization }) => (
  <Stack spacing={3} sx={{ mt: 2 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
      <Box>
        <Typography variant="h4" fontWeight={600}>
          Organisation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {organizationName || titleizeSlug(organizationSlug) || 'Inside Advisory'}
        </Typography>
      </Box>
      <Button variant="contained" startIcon={<Building2 size={16} />} onClick={onChangeOrganization}>
        Change Organisation
      </Button>
    </Stack>
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Connected Bitable Workspaces
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage the tables and automations linked to your Inside Advisory workspace. Use the actions below to
          refresh or reconfigure integrations.
        </Typography>
        <BitableTables />
      </CardContent>
    </Card>
  </Stack>
);

const LoadingState = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #1f4fff 0%, #7c3aed 100%)',
      color: 'common.white',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <CircularProgress color="inherit" />
    <Typography variant="body1">Authenticating with Lark…</Typography>
  </Box>
);

const ErrorState = ({ message, onRetry, onChangeOrganization, isOrgError }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      color: 'common.white',
      textAlign: 'center',
      px: 3,
    }}
  >
    <Stack spacing={2} maxWidth={420}>
      <Typography variant="h5" fontWeight={700}>
        Authentication Failed
      </Typography>
      <Typography variant="body1">{message}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
        {isOrgError && (
          <Button variant="contained" onClick={onChangeOrganization}>
            Change Organisation
          </Button>
        )}
        <Button variant="outlined" onClick={onRetry} sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.6)' }}>
          Retry
        </Button>
      </Stack>
    </Stack>
  </Box>
);

const Home = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [showOrganizationSelector, setShowOrganizationSelector] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedOrganizationSlug, setSelectedOrganizationSlug] = useState(null);
  const [selectedOrganizationName, setSelectedOrganizationName] = useState(null);

  useEffect(() => {
    const savedOrgSlug = localStorage.getItem(ORGANIZATION_SLUG_KEY);
    if (savedOrgSlug) {
      setSelectedOrganizationSlug(savedOrgSlug);
      setShowOrganizationSelector(false);
      fetchOrganizationDetails(savedOrgSlug).finally(() => {
        initializeAuth(savedOrgSlug);
      });
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrganizationDetails = async (slug) => {
    try {
      const base = resolveApiOrigin();
      const response = await fetch(`${base}/api/get_organization_config?organization_slug=${slug}`, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await response.json();
      if (json.code === 0) {
        setSelectedOrganizationName(json.data.organization_name || null);
      }
    } catch (error) {
      console.warn('Unable to fetch organisation details', error);
    }
  };

  const handleOrganizationSelected = (slug, orgInfo) => {
    if (slug) {
      setSelectedOrganizationSlug(slug);
      setSelectedOrganizationName(orgInfo?.organization_name || null);
      setShowOrganizationSelector(false);
      setIsLoading(true);
      initializeAuth(slug);
    } else {
      setSelectedOrganizationSlug(null);
      setSelectedOrganizationName(null);
      setShowOrganizationSelector(false);
      setIsLoading(true);
      initializeAuth(null);
    }
  };

  const initializeAuth = async (orgSlug) => {
    try {
      if (orgSlug) {
        setSelectedOrganizationSlug(orgSlug);
      }

      if (typeof window.h5sdk === 'undefined') {
        const mockUserInfo = {
          access_token: 'mock_token',
          avatar_url: 'https://via.placeholder.com/40',
          en_name: 'Development User',
          name: '开发用户',
        };
        setUserInfo(mockUserInfo);
        setIsLoading(false);
        return;
      }

      const jsapiSuccess = await new Promise((resolve) => {
        handleJSAPIAccess(resolve, orgSlug);
      });
      if (!jsapiSuccess) {
        if (orgSlug) {
          localStorage.removeItem(ORGANIZATION_SLUG_KEY);
          setShowOrganizationSelector(true);
          setIsLoading(false);
          setAuthError('JSAPI authentication failed. Please select organisation again.');
          return;
        }
        throw new Error('JSAPI authentication failed');
      }

      const userData = await new Promise((resolve) => {
        handleUserAuth(resolve, orgSlug);
      });

      if (userData) {
        setUserInfo(userData);
        setAuthError(null);
      } else {
        setAuthError('No user information returned from authentication.');
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetOrganization = () => {
    Cookies.remove('lk_token');
    localStorage.removeItem('lk_token');
    localStorage.removeItem(ORGANIZATION_SLUG_KEY);
    setShowOrganizationSelector(true);
    setAuthError(null);
    setIsLoading(false);
    setUserInfo(null);
    setActiveView('dashboard');
    setSelectedOrganizationSlug(null);
    setSelectedOrganizationName(null);
  };

  const handleRefreshData = () => {
    if (!selectedOrganizationSlug) return;
    setIsLoading(true);
    initializeAuth(selectedOrganizationSlug);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'account':
        return (
          <AccountView
            userInfo={userInfo}
            organizationName={selectedOrganizationName}
            organizationSlug={selectedOrganizationSlug}
          />
        );
      case 'users':
        return <UsersView />;
      case 'audit_log':
        return <AuditLogView organizationSlug={selectedOrganizationSlug} />;
      case 'organization':
        return (
          <OrganizationView
            organizationName={selectedOrganizationName}
            organizationSlug={selectedOrganizationSlug}
            onChangeOrganization={handleResetOrganization}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardContent
            userInfo={userInfo}
            organizationName={selectedOrganizationName}
            organizationSlug={selectedOrganizationSlug}
            onNavigate={setActiveView}
          />
        );
    }
  };

  if (showOrganizationSelector) {
    return <OrganizationSelector onOrganizationSelected={handleOrganizationSelected} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (authError) {
    const isOrgError =
      authError.includes('Organization') ||
      authError.includes('organisation') ||
      authError.includes('credentials not configured');
    return (
      <ErrorState
        message={authError}
        onRetry={() => initializeAuth(selectedOrganizationSlug)}
        onChangeOrganization={handleResetOrganization}
        isOrgError={isOrgError}
      />
    );
  }

  return (
    <ProtectedLayout
      user={userInfo}
      organizationName={selectedOrganizationName}
      organizationSlug={selectedOrganizationSlug || undefined}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleResetOrganization}
      onChangeOrganization={handleResetOrganization}
      onRefreshData={handleRefreshData}
    >
      {renderActiveView()}
    </ProtectedLayout>
  );
};

export default Home;