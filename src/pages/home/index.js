import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import clientConfig from '../../config/client_config.js';
import { handleJSAPIAccess, handleUserAuth } from '../../utils/auth_access_util.js';
import OrganizationSelector, { ORGANIZATION_SLUG_KEY } from '../../components/organizationSelector/index.js';
import ProtectedLayout from '../../layouts/ProtectedLayout.jsx';
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
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
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { cn } from '../../lib/utils';
import './index.css';
// Old StrategicMapView archived - using v2 only
import StrategicMapV2Preview from '../../tools/strategic-map/index.jsx';
import { TargetIcon, PromotionIcon, SheetIcon } from '../../components/ui/icons';

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
  <div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <div
        className="bg-white rounded-3xl min-h-[200px] transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl flex flex-col justify-center items-center p-8 shadow-sm"
        onClick={() => onNavigate && onNavigate('strategic_map')}
      >
        <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mb-4">
          <TargetIcon size={56} />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
          战略地图
        </h3>
      </div>
      <div
        className="bg-white rounded-3xl min-h-[200px] transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl flex flex-col justify-center items-center p-8 shadow-sm"
        // onClick={() => onNavigate && onNavigate('strategic_map')}
      >
        <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mb-4">
          <SheetIcon size={56} />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
          工作规格
        </h3>
      </div>
      <div
        className="bg-white rounded-3xl min-h-[200px] transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl flex flex-col justify-center items-center p-8 shadow-sm"
        // onClick={() => onNavigate && onNavigate('strategic_map')}
      >
        <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mb-4">
          <PromotionIcon size={56} />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
          晋升机制
        </h3>
      </div>
    </div>
  </div>
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
    <div className="bg-white rounded-3xl shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your organisation's team</p>
          </div>
          <Button variant="default" size="sm" onClick={fetchMembers} className="gap-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm text-gray-600">Loading team members…</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : members.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <p className="text-base text-gray-600">No members found for this organisation.</p>
          </div>
        ) : (
          /* Members Table */
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Member</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Role</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr
                    key={member.id}
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      index !== members.length - 1 && "border-b border-gray-100"
                    )}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar_url} alt={member.name} />
                          <AvatarFallback className="bg-primary-100 text-primary-700 font-medium">
                            {(member.name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {member.name || 'Unknown User'}
                          </p>
                          {member.email && (
                            <p className="text-xs text-gray-500">{member.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        member.role_code === 'admin'
                          ? "bg-primary-100 text-primary-700"
                          : member.role_code === 'owner'
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                      )}>
                        {(member.role_code || 'member').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        member.status === 'active'
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {member.status || 'unknown'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600">{formatDateTime(member.joined_at)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#1f4fff] to-[#7c3aed] text-white gap-4">
    <Loader2 className="w-10 h-10 animate-spin" />
    <p className="text-base">Authenticating with Lark…</p>
  </div>
);

const ErrorState = ({ message, onRetry, onChangeOrganization, isOrgError }) => (
  <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#ff6b6b] to-[#ee5a24] text-white text-center px-6">
    <div className="flex flex-col gap-4 max-w-[420px]">
      <h2 className="text-2xl font-bold">Authentication Failed</h2>
      <p className="text-base">{message}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        {isOrgError && (
          <Button variant="default" onClick={onChangeOrganization}>
            Change Organisation
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onRetry}
          className="text-white border-white/60 hover:bg-white/10 hover:text-white"
        >
          Retry
        </Button>
      </div>
    </div>
  </div>
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
    if (!isAdmin && activeView !== 'dashboard' && activeView !== 'strategic_map' && activeView !== 'strategic_map_v2') {
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
      { key: 'strategic_map_v2', label: 'Strategic Map v2', icon: Map, section: 'Product' },
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

    const AUTH_TIMEOUT_MS = 8000;
    const withTimeout = (promise, ms) => {
      return new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve(null);
          }
        }, ms);
        promise
          .then((val) => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(val);
            }
          })
          .catch(() => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(null);
            }
          });
      });
    };

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
      let userData = await withTimeout(new Promise((resolve) => {
        handleUserAuth(resolve, orgSlug);
      }), AUTH_TIMEOUT_MS);

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
        const jsapiSuccessRetry = await withTimeout(new Promise((resolve) => {
          handleJSAPIAccess(resolve, orgSlug);
        }), AUTH_TIMEOUT_MS);
        if (jsapiSuccessRetry) {
          userData = await withTimeout(new Promise((resolve) => {
            handleUserAuth(resolve, orgSlug);
          }), AUTH_TIMEOUT_MS);
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
      case 'strategic_map_v2':
        return (
          <StrategicMapV2Preview
            organizationSlug={selectedOrganizationSlug}
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
