import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Cookies from 'js-cookie';
import Lottie from 'lottie-react';
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
  Mail,
  Phone,
  Calendar,
  Clock,
  Puzzle,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { cn } from '../../lib/utils';
import './index.css';
// Old StrategicMapView archived - using v2 only
import StrategicMapV2Preview from '../../tools/strategic-map/index.jsx';
import DocumentParser from '../../tools/document-parser/index.jsx';
import ContactManagementApp from '../../tools/contact-management/index.jsx';
import SalesManagementApp from '../../tools/sales-management/index.jsx';
import InventoryProduct from '../../tools/inventory/index.jsx';
import IntegrationsDashboard from '../../products/integrations/index.jsx';
import { TargetIcon, PromotionIcon, SheetIcon, DocumentIcon, ContactBookIcon, InventoryIcon, PuzzleIcon, ShoppingCartIcon } from '../../components/ui/icons';
import backgroundAnimation from '../../assets/animations/background-animation.json';
import cloudsAnimation from '../../assets/animations/clouds-animation.json';
import { useOrganizationProducts } from '../../hooks/useOrganizationProducts';
import { onProductAccessDenied } from '../../utils/api_client';

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

// Calculate tenure from join_time (unix timestamp)
const calculateTenure = (joinTime) => {
  if (!joinTime) return null;
  const joinDate = new Date(joinTime * 1000);
  const now = new Date();
  let years = now.getFullYear() - joinDate.getFullYear();
  let months = now.getMonth() - joinDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}m`;
  return 'New';
};

// User Profile Card Component
const UserProfileCard = ({ user, organizationName, organizationSlug }) => {
  const [departments, setDepartments] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [joinTime, setJoinTime] = useState(null);
  const [leaderName, setLeaderName] = useState('');
  const [orgLogo, setOrgLogo] = useState('');

  useEffect(() => {
    if (!user?.user_id || !organizationSlug) return;

    const fetchDepartment = async () => {
      try {
        const response = await fetch(
          `${resolveApiOrigin()}/api/user_department?user_id=${user.user_id}&organization_slug=${organizationSlug}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (data.code === 0) {
          if (data.data?.departments) setDepartments(data.data.departments);
          if (data.data?.job_title) setJobTitle(data.data.job_title);
          if (data.data?.join_time) setJoinTime(data.data.join_time);
          if (data.data?.leader_name) setLeaderName(data.data.leader_name);
        }
      } catch (e) {
        console.error('Failed to fetch department:', e);
      }
    };

    const fetchTenantInfo = async () => {
      try {
        const response = await fetch(
          `${resolveApiOrigin()}/api/tenant_info?organization_slug=${organizationSlug}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (data.code === 0 && data.data?.avatar) {
          setOrgLogo(data.data.avatar.avatar_640 || data.data.avatar.avatar_origin || '');
        }
      } catch (e) {
        console.error('Failed to fetch tenant info:', e);
      }
    };

    fetchDepartment();
    fetchTenantInfo();
  }, [user?.user_id, organizationSlug]);

  const [isFlipped, setIsFlipped] = useState(false);

  // Use department name if available, otherwise null (will just show org name)
  const departmentName = departments.length > 0
    ? (departments[0].en_name || departments[0].name)
    : null;

  const tenure = calculateTenure(joinTime);

  // Generate vCard data for QR code
  const vCardData = useMemo(() => {
    if (!user) return '';
    const name = user.en_name || user.name || 'User';
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${name}
${jobTitle ? `TITLE:${jobTitle}` : ''}
${departmentName ? `ORG:${organizationName || ''};${departmentName}` : organizationName ? `ORG:${organizationName}` : ''}
${user.email ? `EMAIL:${user.email}` : ''}
${user.mobile ? `TEL;TYPE=CELL:${user.mobile}` : ''}
END:VCARD`.replace(/\n+/g, '\n').trim();
  }, [user, jobTitle, departmentName, organizationName]);

  if (!user) return null;

  return (
    <div
      className="relative h-[200px] cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-sm p-5"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center gap-4 h-full">
            {/* Avatar */}
            <div className="shrink-0">
              {user.avatar_url || user.avatar_middle || user.avatar_big ? (
                <img
                  src={user.avatar_big || user.avatar_middle || user.avatar_url}
                  alt={user.en_name || user.name}
                  className="w-20 h-20 rounded-full object-cover border-3 border-primary-100 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserCircle2 className="w-10 h-10 text-primary-600" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-xl font-bold text-gray-900">
                {user.en_name || user.name || 'User'}
              </h3>
              {jobTitle && (
                <p className="text-sm text-gray-600 font-medium">{jobTitle}</p>
              )}
              {(departmentName || organizationName) && (
                <p className="text-sm text-gray-600">
                  {departmentName ? `${departmentName}` : organizationName}
                </p>
              )}
              <div className="mt-2 space-y-1">
                {user.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                )}
                {user.mobile && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{user.mobile}</span>
                  </p>
                )}
                {leaderName && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">Reports to {leaderName}</span>
                  </p>
                )}
                {tenure && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{tenure} tenure</span>
                  </p>
                )}
              </div>
            </div>

            {/* Organization Logo */}
            {orgLogo && (
              <div className="shrink-0 ml-auto">
                <img
                  src={orgLogo}
                  alt={organizationName || 'Organization'}
                  className="w-16 h-16 rounded-lg object-contain"
                />
              </div>
            )}
          </div>
          {/* Flip indicator */}
          <div className="absolute bottom-2 right-2 text-gray-400">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>

        {/* Back Side - QR Code */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <QRCodeSVG
            value={vCardData}
            size={120}
            level="M"
            marginSize={0}
          />
          <p className="text-sm text-gray-600 mt-3 font-medium">Scan to save contact</p>
          <p className="text-xs text-gray-400 mt-1">{user.en_name || user.name}</p>
        </div>
      </div>
    </div>
  );
};

// User Events Card Component
const UserEventsCard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${resolveApiOrigin()}/api/calendar/events`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.code === 0) {
          setEvents(data.data || []);
        } else if (data.msg?.includes('99991679') || data.msg?.includes('permission')) {
          // Calendar permission not granted - show friendly message
          console.warn('Calendar permission not granted');
          setEvents([]);  // Will show "No events" state
        } else {
          console.warn('Failed to fetch events:', data.msg);
        }
      } catch (e) {
        console.error('Failed to fetch events:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 h-[200px] flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-gray-900">Today's Events</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 h-[200px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-bold text-gray-900">Today's Events</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm">No events scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              // Parse unix timestamp (seconds) - handle both string and number
              const startTs = parseInt(event.start_time?.timestamp || '0', 10);
              const endTs = parseInt(event.end_time?.timestamp || '0', 10);
              const startTime = new Date(startTs * 1000);
              const endTime = new Date(endTs * 1000);

              // Format in Malaysia timezone
              const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' };
              const timeString = startTs && endTs
                ? `${startTime.toLocaleTimeString('en-MY', timeOptions)} - ${endTime.toLocaleTimeString('en-MY', timeOptions)}`
                : 'All day';

              return (
                <div key={event.event_id} className="flex gap-3 group">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-2 h-2 rounded-full ${event.status === 'confirmed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="w-0.5 h-full bg-gray-100 mt-1 group-last:hidden" />
                  </div>
                  <div className="pb-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.summary || '(No Title)'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{timeString}</p>
                    </div>
                    {event.location && event.location.name && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{event.location.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardContent = ({ onNavigate, organizationSlug, userInfo, organizationName }) => {
  const { products, loading, error } = useOrganizationProducts(organizationSlug);
  const [activeTab, setActiveTab] = useState('All');

  // Extract unique categories and create tabs
  const tabs = useMemo(() => {
    if (!products) return ['All'];
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(categories)];
  }, [products]);

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    if (activeTab === 'All') return products;
    return products.filter(p => p.category === activeTab);
  }, [products, activeTab]);

  // Icon mapping: database icon name (string) -> React component
  // Database stores component names like "TargetIcon", "DocumentIcon", "ContactBookIcon"
  // These map directly to components in src/components/ui/icons/
  const iconMap = {
    'TargetIcon': TargetIcon,
    'DocumentIcon': DocumentIcon,
    'ContactBookIcon': ContactBookIcon,
    'SheetIcon': SheetIcon,
    'PromotionIcon': PromotionIcon,
    'InventoryIcon': InventoryIcon,
    'PuzzleIcon': PuzzleIcon,
    'ShoppingCartIcon': ShoppingCartIcon,
    // Fallback mappings for Lucide-React icon names
    'ShoppingCart': ShoppingCartIcon,
    'Puzzle': PuzzleIcon,
    'Map': TargetIcon,
    'Users': ContactBookIcon,
    'FileText': DocumentIcon,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6">
        <p className="text-sm text-red-800">Failed to load products: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-base text-gray-600">No products available for this organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section: User Profile and Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <UserProfileCard user={userInfo} organizationName={organizationName} organizationSlug={organizationSlug} />
        </div>
        <div className="md:col-span-1">
          <UserEventsCard />
        </div>
      </div>

      {/* Separator Line with Gradient Glow */}
      <div className="relative my-4 h-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gray-200/40"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent blur-sm"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/4 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent"></div>
        </div>
      </div>

      {/* Category Tabs - Scrollable Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === tab
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            {tab === 'All' ? 'All Apps' : titleizeSlug(tab)}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        {filteredProducts.map((product) => {
          // Get icon component by name from database
          // Falls back to TargetIcon if icon not found
          const IconComponent = iconMap[product.icon] || TargetIcon;

          // Check if product is coming soon
          const isComingSoon = product.status === 'coming_soon';
          const isBeta = product.status === 'beta';
          const isDeprecated = product.status === 'deprecated';
          const isActive = product.status === 'active';

          return (
            <div
              key={product.key}
              className={`relative bg-white rounded-3xl min-h-[200px] transition-all duration-300 flex flex-col justify-center items-center p-8 shadow-sm ${isComingSoon || isDeprecated
                ? 'opacity-60'
                : 'cursor-pointer hover:-translate-y-2 hover:shadow-xl'
                }`}
              onClick={() => {
                // Only allow navigation for active and beta products
                if ((isActive || isBeta) && onNavigate) {
                  onNavigate(product.key);
                }
              }}
            >
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mb-4">
                <IconComponent size={56} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 text-center">
                {product.name}
              </h3>

              {/* Beta Badge */}
              {isBeta && (
                <div className="mt-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Beta
                </div>
              )}

              {/* Coming Soon Overlay */}
              {isComingSoon && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-3xl backdrop-blur-[2px]">
                  <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-black px-6 py-3 rounded-full shadow-lg">
                    <p className="text-sm md:text-base font-semibold">Coming Soon</p>
                  </div>
                </div>
              )}

              {/* Deprecated Badge */}
              {isDeprecated && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-3xl backdrop-blur-[2px]">
                  <div className="bg-gray-500 text-white px-6 py-3 rounded-full shadow-lg">
                    <p className="text-sm md:text-base font-semibold">Deprecated</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  <div className="lottie-background-container">
    {/* Background: Clouds animation */}
    <div className="lottie-animation-wrapper" style={{ zIndex: 1 }}>
      <Lottie
        animationData={cloudsAnimation}
        loop={true}
        autoplay={true}
      />
    </div>

    {/* Foreground: Rocket animation */}
    <div className="lottie-animation-wrapper" style={{ zIndex: 2 }}>
      <Lottie
        animationData={backgroundAnimation}
        loop={true}
        autoplay={true}
      />
    </div>

    {/* Text overlay */}
    {/* <div className="lottie-placeholder">
      <Loader2 className="w-10 h-10 animate-spin text-black" />
      <p className="text-base text-white mt-4" style={{ textShadow: '0 0 7px #000000, 0 0 14px #0000FF' }}>Authenticating with Lark…</p>
    </div> */}
  </div>
);

const ErrorState = ({ message, onRetry, onChangeOrganization, isOrgError }) => (
  <div className="lottie-background-container lottie-background-error">
    {/* Background: Clouds animation */}
    <div className="lottie-animation-wrapper" style={{ zIndex: 1 }}>
      <Lottie
        animationData={cloudsAnimation}
        loop={true}
        autoplay={true}
      />
    </div>

    {/* Foreground: Rocket animation */}
    <div className="lottie-animation-wrapper" style={{ zIndex: 2 }}>
      <Lottie
        animationData={backgroundAnimation}
        loop={true}
        autoplay={true}
      />
    </div>

    {/* Error content overlay */}
    <div className="flex items-center justify-center h-screen relative z-10">
      <div className="flex flex-col gap-4 max-w-[420px] text-center text-white px-6">
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
  </div>
);

const Home = () => {
  // TESTING: Set to true to stay on loading screen and see Lottie animation
  const DISABLE_AUTO_NAVIGATION = false;

  const navigate = useNavigate();
  const location = useLocation();

  // Initialize view from URL path
  const initialView = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [authError, setAuthError] = useState(null);
  const [showOrganizationSelector, setShowOrganizationSelector] = useState(true);
  const [activeView, setActiveView] = useState(initialView);
  const [selectedOrganizationSlug, setSelectedOrganizationSlug] = useState(null);
  const [selectedOrganizationName, setSelectedOrganizationName] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const hasInitialized = useRef(false); // Prevent double initialization in React Strict Mode
  const authInProgress = useRef(false); // Ref-based guard for authentication (more reliable than state)

  // Navigation helper: Use React Router's navigate
  const navigateToView = useCallback((view) => {
    const path = view === 'dashboard' ? '/' : `/${view}`;
    navigate(path);
    // Don't call setActiveView here - let the useEffect handle it
  }, [navigate]);

  // Sync activeView with URL changes (for back/forward buttons)
  useEffect(() => {
    const view = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);
    setActiveView(view);
  }, [location.pathname]);

  // Fetch products for navigation (admin only)
  const { products: navProducts } = useOrganizationProducts(
    isAdmin ? selectedOrganizationSlug : null
  );

  // Handle 403 product access denied errors globally
  useEffect(() => {
    const unsubscribe = onProductAccessDenied((error) => {
      console.error('🚫 Product access denied:', error);

      // Show error message
      const message = `Access to "${error.product}" has been denied. Your organization may no longer have access to this feature.`;
      alert(message);

      // Redirect to dashboard
      setActiveView('dashboard');

      // Refetch products to update UI
      if (selectedOrganizationSlug) {
        // The products cache has already been cleared by the api_client
        // The hooks will refetch automatically
      }
    });

    return unsubscribe;
  }, [selectedOrganizationSlug]);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode (development)
    if (hasInitialized.current) {
      console.log('⏭️ Skipping duplicate initialization (React Strict Mode)');
      return;
    }
    hasInitialized.current = true;

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
    if (!isAdmin && activeView !== 'dashboard' && activeView !== 'strategic_map' && activeView !== 'strategic_map_v2' && activeView !== 'document_parser' && activeView !== 'contact_management' && activeView !== 'inventory' && activeView !== 'integrations' && activeView !== 'sales_management') {
      setActiveView('dashboard');
    }
  }, [isAdmin, activeView]);

  const navItems = useMemo(() => {
    // Normal users see no nav items (back button navigation only)
    if (!isAdmin) {
      return [];
    }

    // Admin users see system tabs + dynamic products (no Dashboard - use back button)
    const systemTabs = [
      { key: 'account', label: 'Account', icon: UserCircle2, section: 'General' },
      { key: 'users', label: 'Users', icon: Users, section: 'Team' },
      { key: 'audit_log', label: 'Audit Log', icon: FileText, section: 'System' },
      { key: 'organization', label: 'Organization', icon: Building2, section: 'System' },
    ];

    // Icon mapping for products in navigation
    // Maps custom icon component names to lucide-react icons for navigation sidebar
    const productIconMap = {
      'TargetIcon': Map,          // Strategic Map uses Map icon in nav
      'DocumentIcon': FileText,   // Document Parser uses FileText in nav
      'ContactBookIcon': Users,   // Contact Management uses Users in nav
    };

    // Add product tabs dynamically
    const productTabs = (navProducts || []).map(product => ({
      key: product.key,
      label: product.name,  // Use the name field directly
      icon: productIconMap[product.icon] || LayoutDashboard,
      section: 'Product',
    }));

    return [...systemTabs, ...productTabs];
  }, [isAdmin, navProducts]);

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

  // Helper to reset authentication state
  const resetAuthState = () => {
    authInProgress.current = false;
  };

  const handleOrganizationSelected = (slug, orgInfo) => {
    // Reset initialization flag when manually changing organizations
    hasInitialized.current = false;
    // Also reset authentication state
    resetAuthState();

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
    // Prevent multiple simultaneous authentication attempts (ref-based guard)
    if (authInProgress.current) {
      console.log('⏳ Authentication already in progress (ref guard), skipping...');
      return;
    }

    // Check if already authenticated before starting new auth
    const existingToken = Cookies.get('lk_token') || localStorage.getItem('lk_token');
    if (existingToken && userInfo) {
      console.log('✅ Already authenticated, skipping auth initialization');
      setIsLoading(false);
      return;
    }

    // Set authentication guard
    authInProgress.current = true;

    const AUTH_TIMEOUT_MS = 15000; // Increased timeout for OAuth flow
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
      // NOTE: selectedOrganizationSlug should already be set by the caller
      // (either in initial useEffect line 767 or in handleOrganizationSelected line 857)
      // Removing redundant setSelectedOrganizationSlug call to prevent unnecessary re-renders

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
            resetAuthState();
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
          resetAuthState();
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
        // Clear OAuth redirect flag on success
        sessionStorage.removeItem('oauth_redirect_attempted');

        // Show greeting toast based on Malaysia time
        const displayName = userData.en_name || userData.name || 'User';
        const malaysiaHour = new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kuala_Lumpur' });
        const hour = parseInt(malaysiaHour, 10);
        let greeting = 'Good Evening';
        if (hour >= 0 && hour < 12) greeting = 'Good Morning';
        else if (hour >= 12 && hour < 15) greeting = 'Good Afternoon';

        if (window.tt?.showToast) {
          window.tt.showToast({
            title: `${greeting}, ${displayName}!`,
            icon: 'success',
            duration: 2500
          });
        } else {
          // Browser fallback - log to console
          console.log(`🎉 ${greeting}, ${displayName}!`);
        }

        if (!DISABLE_AUTO_NAVIGATION) {
          setIsLoading(false);
        }
        resetAuthState();
      } else if (!isJSAPIAvailable) {
        // Check if external browser OAuth is allowed
        const allowExternalBrowser = process.env.REACT_APP_ALLOW_EXTERNAL_BROWSER === 'true';
        if (!allowExternalBrowser) {
          // External browser OAuth is disabled and JSAPI not available
          setAuthError('This application must be opened within Lark. Please open it from the Lark app.');
          setIsLoading(false);
          resetAuthState();
          return;
        }
        // Check if we've already attempted OAuth (prevent infinite redirect loop)
        const oauthAttempted = sessionStorage.getItem('oauth_redirect_attempted');
        if (oauthAttempted) {
          console.error('❌ OAuth authentication failed after redirect. Please try again.');
          sessionStorage.removeItem('oauth_redirect_attempted');
          setAuthError('Authentication failed. Please try again or contact support.');
          setIsLoading(false);
          resetAuthState();
          return;
        }
        // Mark that we're attempting OAuth redirect
        sessionStorage.setItem('oauth_redirect_attempted', 'true');
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
            resetAuthState();
          } else {
            setAuthError('No user information returned from authentication.');
            setIsLoading(false);
            resetAuthState();
          }
        } else {
          setAuthError('JSAPI authentication failed. Please select organisation again.');
          setIsLoading(false);
          resetAuthState();
        }
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication error');
      setIsLoading(false);
      resetAuthState();
    }
  };

  const handleResetOrganization = () => {
    // Reset initialization flag when logging out
    hasInitialized.current = false;
    // Also reset authentication state
    resetAuthState();

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
      case 'document_parser':
        return (
          <DocumentParser
            organizationSlug={selectedOrganizationSlug}
          />
        );
      case 'contact_management':
        return (
          <ContactManagementApp
            organizationSlug={selectedOrganizationSlug}
          />
        );
      case 'sales_management':
        return (
          <SalesManagementApp
            organizationSlug={selectedOrganizationSlug}
          />
        );
      case 'inventory':
        return (
          <InventoryProduct
            organizationSlug={selectedOrganizationSlug}
          />
        );
      case 'integrations':
        return (
          <IntegrationsDashboard
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
        return <DashboardContent onNavigate={navigateToView} organizationSlug={selectedOrganizationSlug} userInfo={userInfo} organizationName={selectedOrganizationName} />;
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
      onNavigate={navigateToView}
      navItems={navItems}
      mainClassName={activeView === 'dashboard' ? "bg-soft-gradient" : undefined}
    >
      {renderActiveView()}
    </ProtectedLayout>
  );
};

export default Home;
