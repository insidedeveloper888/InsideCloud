import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import clientConfig from '../../config/client_config.js';
import { handleJSAPIAccess, handleUserAuth } from '../../utils/auth_access_util.js';
import OrganizationSelector, { ORGANIZATION_SLUG_KEY } from '../../components/organizationSelector/index.js';
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
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
} from '@mui/material';
import {
  Users,
  Shield,
  Layers,
  FileText,
  Building2,
  RefreshCw,
  HardDrive,
  Settings,
  LayoutDashboard,
  UserCircle2,
} from 'lucide-react';
import './index.css';

const resolveApiOrigin = () =>
  clientConfig.apiOrigin && clientConfig.apiOrigin.length > 0
    ? clientConfig.apiOrigin
    : window.location.origin;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : '';

const titleizeSlug = (slug) =>
  slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : '';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 60);

const dashboardWidgets = [
  { key: 'people', label: 'People', icon: Users },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'systems', label: 'Systems', icon: Layers },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'infrastructure', label: 'Infrastructure', icon: HardDrive },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const DashboardContent = () => (
  <Stack spacing={3} sx={{ mt: 2 }}>
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome to Inside Advisory
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto' }}>
          Your personalised dashboard will live here. Pin widgets to launch the services your team uses most.
        </Typography>
      </CardContent>
    </Card>
    <Typography variant="subtitle1" fontWeight={600}>
      Quick Launch (coming soon)
    </Typography>
    <Grid container spacing={2}>
      {dashboardWidgets.map((widget) => {
        const Icon = widget.icon;
        return (
          <Grid item xs={12} sm={6} md={4} key={widget.key}>
            <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
              <Stack spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'secondary.light', color: 'secondary.dark' }}>
                  <Icon size={24} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={600}>
                  {widget.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 220 }}>
                  Widget placeholder. Click functionality will be added later.
                </Typography>
              </Stack>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  </Stack>
);

const SupabaseMembers = ({ organizationSlug }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
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
      const response = await fetch(`${base}/api/get_supabase_members${query ? `?${query}` : ''}`, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch members (${response.status})`);
      }
      const json = await response.json();
      if (json.code !== 0) {
        throw new Error(json.msg || 'Failed to fetch members');
      }
      setMembers(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 2 }} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Organisation Members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Showing members from Supabase for this organisation.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={fetchMembers}>
            Refresh
          </Button>
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }} spacing={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading members…
            </Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : members.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No members found in Supabase for this organisation.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="40%">Member</TableCell>
                <TableCell width="25%">Role</TableCell>
                <TableCell width="20%">Status</TableCell>
                <TableCell width="15%">Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={member.avatar_url || undefined}>{(member.name || 'U').charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle2">{member.name || 'Unknown User'}</Typography>
                        {member.email && (
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(member.role_code || 'member').toUpperCase()}
                      size="small"
                      variant="outlined"
                      color={member.role_code === 'admin' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.status || 'unknown'}
                      size="small"
                      variant="outlined"
                      color={member.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(member.joined_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

const UsersView = ({ organizationSlug }) => (
  <Stack spacing={3} sx={{ mt: 2 }}>
    <Typography variant="h4" fontWeight={600}>
      People
    </Typography>
    <SupabaseMembers organizationSlug={organizationSlug} />
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
      const response = await fetch(`${base}/api/get_audit_logs${params.toString() ? `?${params}` : ''}`, {
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
            Most recent activity for {titleizeSlug(organizationSlug) || 'this organisation'}
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
              No audit events recorded yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="20%">Event</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell width="22%">Timestamp</TableCell>
                  <TableCell width="18%">Client</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Chip
                        label={log.event_type || 'event'}
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
                    <TableCell>{formatDateTime(log.occurred_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.ip || '--'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.user_agent ? log.user_agent.slice(0, 48) : 'n/a'}
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

const AccountView = ({ userInfo, organizationName, organizationSlug, onChangeOrganization, onLogout }) => (
  <Stack spacing={3} sx={{ mt: 2 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
      <Button variant="outlined" onClick={onChangeOrganization}>
        Change Organisation
      </Button>
      <Button variant="outlined" color="error" onClick={onLogout}>
        Log Out
      </Button>
    </Stack>
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={2} alignItems="center">
          <Avatar src={userInfo?.avatar_url || undefined} sx={{ width: 96, height: 96, fontSize: 32 }}>
            {(userInfo?.en_name || 'U').charAt(0)}
          </Avatar>
          <Typography variant="h6">{userInfo?.en_name || 'Authenticated User'}</Typography>
          <Chip label="Admin" color="primary" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            {organizationName || titleizeSlug(organizationSlug) || 'Inside Advisory'}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  </Stack>
);

const OrganizationView = ({ isAdmin }) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const base = resolveApiOrigin();
      const response = await fetch(`${base}/api/admin/organizations`, {
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch organisations (${response.status})`);
      }
      const json = await response.json();
      if (json.code !== 0) {
        throw new Error(json.msg || 'Failed to fetch organisations');
      }
      setOrganizations(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const base = resolveApiOrigin();
      const params = new URLSearchParams({ name: name.trim() });
      if (slug.trim()) {
        params.append('slug', slugify(slug));
      }
      const response = await fetch(`${base}/api/admin/organizations?${params.toString()}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!response.ok) {
        throw new Error(`Failed to create organisation (${response.status})`);
      }
      const json = await response.json();
      if (json.code !== 0) {
        throw new Error(json.msg || 'Failed to create organisation');
      }
      setName('');
      setSlug('');
      fetchOrganizations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Organisation administration is restricted to system administrators.
      </Alert>
    );
  }

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Typography variant="h4" fontWeight={600}>
        Organisations
      </Typography>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Create New Organisation
          </Typography>
          <Stack
            component="form"
            spacing={1.5}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            onSubmit={handleCreate}
          >
            <TextField
              label="Organisation name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Custom slug (optional)"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }} spacing={2}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading organisations…
              </Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : organizations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No organisations found yet. Use the form above to add one.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id} hover>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>
                      <Chip label={org.slug} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={org.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={org.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(org.created_at)}</TableCell>
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Prevent multiple auth attempts

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

  useEffect(() => {
    const allowed = ['dashboard', 'account'];
    if (!isAdmin && !allowed.includes(activeView)) {
      setActiveView('dashboard');
    }
  }, [isAdmin, activeView]);

  const navItems = useMemo(() => {
    const base = [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'General' },
      { key: 'account', label: 'Account', icon: UserCircle2, section: 'General' },
    ];
    if (isAdmin) {
      base.push(
        { key: 'users', label: 'Users', icon: Users, section: 'Team' },
        { key: 'audit_log', label: 'Audit Log', icon: FileText, section: 'System' },
        { key: 'organization', label: 'Organization', icon: Building2, section: 'System' }
      );
    }
    return base;
  }, [isAdmin]);

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
        setIsAdmin(Boolean(json.data?.is_admin));
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.warn('Unable to fetch organisation details', error);
      setIsAdmin(false);
    }
  };

  const handleOrganizationSelected = (slug, orgInfo) => {
    if (slug) {
      setSelectedOrganizationSlug(slug);
      setSelectedOrganizationName(orgInfo?.organization_name || null);
      setShowOrganizationSelector(false);
      setIsLoading(true);
      fetchOrganizationDetails(slug);
      initializeAuth(slug);
    } else {
      setSelectedOrganizationSlug(null);
      setSelectedOrganizationName(null);
      setShowOrganizationSelector(false);
      setIsLoading(true);
      setIsAdmin(false);
      initializeAuth(null);
    }
  };

  const initializeAuth = async (orgSlug) => {
    // Prevent multiple simultaneous authentication attempts
    if (isAuthenticating) {
      console.log('⏳ Authentication already in progress, skipping...');
      return;
    }

    // Check if already authenticated before starting new auth
    const existingToken = Cookies.get('lk_token') || localStorage.getItem('lk_token');
    if (existingToken && userInfo) {
      console.log('✅ Already authenticated, skipping auth initialization');
      setIsLoading(false);
      return;
    }

    setIsAuthenticating(true);
    
    try {
      if (orgSlug) {
        setSelectedOrganizationSlug(orgSlug);
      }

      // Check if JSAPI is available (production environment inside Lark)
      const isJSAPIAvailable = typeof window.h5sdk !== 'undefined';
      
      if (isJSAPIAvailable) {
        // Production: Use JSAPI authentication flow
        console.log('🔐 Using JSAPI authentication flow (production)');
        
        const jsapiSuccess = await new Promise((resolve) => {
          handleJSAPIAccess(resolve, orgSlug);
        });
        if (!jsapiSuccess) {
          if (orgSlug) {
            localStorage.removeItem(ORGANIZATION_SLUG_KEY);
            setShowOrganizationSelector(true);
            setIsLoading(false);
            setAuthError('JSAPI authentication failed. Please select organisation again.');
            setIsAuthenticating(false);
            return;
          }
          throw new Error('JSAPI authentication failed');
        }
      } else {
        // Local development: Skip JSAPI (not needed for OAuth flow)
        console.log('🔐 JSAPI not available, using OAuth redirect flow (local development)');
      }

      // Handle user authentication (supports both JSAPI and OAuth flows)
      const userData = await new Promise((resolve) => {
        handleUserAuth(resolve, orgSlug);
      });

      // If handleUserAuth triggers OAuth redirect, userData will be null
      // and the page will redirect, so we don't need to handle it here
      if (userData) {
        setUserInfo(userData);
        setAuthError(null);
        setIsLoading(false);
        setIsAuthenticating(false);
      } else if (!isJSAPIAvailable) {
        // OAuth redirect is happening, page will reload
        // Keep loading state - OAuth callback will handle completion
        console.log('⏳ OAuth redirect initiated, waiting for callback...');
        // Don't set isLoading to false here - let OAuth callback handle it
        // Don't clear isAuthenticating - let the redirect handle it
        return;
      } else {
        setAuthError('No user information returned from authentication.');
        setIsLoading(false);
        setIsAuthenticating(false);
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication error');
      setIsLoading(false);
      setIsAuthenticating(false);
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
    setIsAdmin(false);
  };

  const handleLogout = () => {
    Cookies.remove('lk_token');
    localStorage.removeItem('lk_token');
    localStorage.removeItem(ORGANIZATION_SLUG_KEY);
    window.location.reload();
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'account':
        return (
          <AccountView
            userInfo={userInfo}
            organizationName={selectedOrganizationName}
            organizationSlug={selectedOrganizationSlug}
            onChangeOrganization={handleResetOrganization}
            onLogout={handleLogout}
          />
        );
      case 'users':
        return <UsersView organizationSlug={selectedOrganizationSlug} />;
      case 'audit_log':
        return <AuditLogView organizationSlug={selectedOrganizationSlug} />;
      case 'organization':
        return <OrganizationView isAdmin={isAdmin} />;
      case 'dashboard':
      default:
        return <DashboardContent />;
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
      navItems={navItems}
    >
      {renderActiveView()}
    </ProtectedLayout>
  );
};

export default Home;