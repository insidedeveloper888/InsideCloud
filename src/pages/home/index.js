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
  FileText,
  Building2,
  RefreshCw,
  LayoutDashboard,
  UserCircle2,
  Map,
} from 'lucide-react';
import './index.css';
import StrategicMapView from '../../components/StrategicMap/index.jsx';

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

const DashboardContent = ({ onNavigate }) => (
  <Box>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <Card
          sx={{
            borderRadius: 3,
            height: '100%',
            minHeight: 200,
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: 6,
            },
          }}
          onClick={() => onNavigate && onNavigate('strategic_map')}
        >
          <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'white',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Map size={32} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              战略地图
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mt: 1 }}>
              Strategic Map
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
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
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }} spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Team Members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your organisation's team
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<RefreshCw size={18} />} onClick={fetchMembers} size="small">
            Refresh
          </Button>
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading team members…
            </Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        ) : members.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No members found for this organisation.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={member.avatar_url || undefined} sx={{ width: 40, height: 40 }}>
                          {(member.name || 'U').charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {member.name || 'Unknown User'}
                          </Typography>
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
                        color={member.role_code === 'admin' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.status || 'unknown'}
                        size="small"
                        color={member.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(member.joined_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const UsersView = ({ organizationSlug }) => (
  <Box>
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" fontWeight={700}>
        People
      </Typography>
      <Typography variant="body2" color="text.secondary">
        View and manage your team members
      </Typography>
    </Box>
    <SupabaseMembers organizationSlug={organizationSlug} />
  </Box>
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

const AccountView = ({ userInfo, organizationName, organizationSlug, onChangeOrganization, onLogout, isAdmin }) => (
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
          {isAdmin && (
            <Chip label="Admin" color="primary" variant="outlined" />
          )}
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
    if (!isAdmin && activeView !== 'dashboard' && activeView !== 'strategic_map') {
      setActiveView('dashboard');
    }
  }, [isAdmin, activeView]);

  const navItems = useMemo(() => {
    // Normal users only see Dashboard
    if (!isAdmin) {
      return [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'General' },
      ];
    }
    // Admin users see all tabs
    return [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'General' },
      { key: 'account', label: 'Account', icon: UserCircle2, section: 'General' },
      { key: 'users', label: 'Users', icon: Users, section: 'Team' },
      { key: 'audit_log', label: 'Audit Log', icon: FileText, section: 'System' },
      { key: 'organization', label: 'Organization', icon: Building2, section: 'System' },
    ];
  }, [isAdmin]);

  const fetchOrganizationDetails = async (slug) => {
    try {
      const base = resolveApiOrigin();
      // Add cache-busting parameter to force fresh data
      const cacheBuster = `_t=${Date.now()}`;
      const response = await fetch(`${base}/api/get_organization_config?organization_slug=${slug}&${cacheBuster}`, {
        credentials: 'include',
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const json = await response.json();
      console.log('🔍 Frontend: Received org config:', { is_admin: json.data?.is_admin, role_from_api: json.data?.is_admin });
      if (json.code === 0) {
        setSelectedOrganizationName(json.data.organization_name || null);
        // ALWAYS use the value from API, never cache
        const apiIsAdmin = Boolean(json.data?.is_admin);
        setIsAdmin(apiIsAdmin);
        console.log(`📤 Frontend: Set isAdmin=${apiIsAdmin} (from API response)`);
      } else {
        setIsAdmin(false);
        console.log('⚠️ Frontend: API returned error, setting isAdmin=false');
      }
    } catch (error) {
      console.warn('Unable to fetch organisation details', error);
      setIsAdmin(false);
      console.log('⚠️ Frontend: Fetch failed, setting isAdmin=false');
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
        // JSAPI not available - check if external browser OAuth is allowed
        const allowExternalBrowser = process.env.REACT_APP_ALLOW_EXTERNAL_BROWSER === 'true';
        if (!allowExternalBrowser) {
          console.log('🔐 JSAPI not available and external browser OAuth is disabled');
          setAuthError('This application must be opened within Lark. Please open it from the Lark app.');
          setIsLoading(false);
          setIsAuthenticating(false);
          return;
        }
        console.log('🔐 JSAPI not available, using OAuth redirect flow (local development)');
      }

      // Handle user authentication (supports both JSAPI and OAuth flows)
      let userData = await new Promise((resolve) => {
        handleUserAuth(resolve, orgSlug);
      });

      if (userData) {
        setUserInfo(userData);
        setAuthError(null);
        setIsLoading(false);
        setIsAuthenticating(false);
      } else if (!isJSAPIAvailable) {
        // Check if external browser OAuth is allowed
        const allowExternalBrowser = process.env.REACT_APP_ALLOW_EXTERNAL_BROWSER === 'true';
        if (!allowExternalBrowser) {
          // External browser OAuth is disabled and JSAPI not available
          setAuthError('This application must be opened within Lark. Please open it from the Lark app.');
          setIsLoading(false);
          setIsAuthenticating(false);
          return;
        }
        // OAuth redirect is happening, page will reload
        // Keep loading state - OAuth callback will handle completion
        console.log('⏳ OAuth redirect initiated, waiting for callback...');
        // Don't set isLoading to false here - let OAuth callback handle it
        // Don't clear isAuthenticating - let the redirect handle it
        return;
      } else {
        // JSAPI available but no user data – force a clean retry once
        Cookies.remove('lk_token');
        localStorage.removeItem('lk_token');
        // Re-run JSAPI config to ensure app_id is fresh for this org
        const jsapiSuccessRetry = await new Promise((resolve) => {
          handleJSAPIAccess(resolve, orgSlug);
        });
        if (jsapiSuccessRetry) {
          userData = await new Promise((resolve) => {
            handleUserAuth(resolve, orgSlug);
          });
          if (userData) {
            setUserInfo(userData);
            setAuthError(null);
            setIsLoading(false);
            setIsAuthenticating(false);
          } else {
            setAuthError('No user information returned from authentication.');
            setIsLoading(false);
            setIsAuthenticating(false);
          }
        } else {
          setAuthError('JSAPI authentication failed. Please select organisation again.');
          setIsLoading(false);
          setIsAuthenticating(false);
        }
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
      case 'strategic_map':
        return (
          <StrategicMapView
            organizationSlug={selectedOrganizationSlug}
            userName={userInfo?.name || userInfo?.en_name}
            organizationName={selectedOrganizationName}
          />
        );
      case 'account':
        return (
          <AccountView
            userInfo={userInfo}
            organizationName={selectedOrganizationName}
            organizationSlug={selectedOrganizationSlug}
            onChangeOrganization={handleResetOrganization}
            onLogout={handleLogout}
            isAdmin={isAdmin}
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
        return <DashboardContent onNavigate={setActiveView} />;
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
