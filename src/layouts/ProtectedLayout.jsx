import { useState } from "react";
import {
  Box,
  Drawer,
  CssBaseline,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Building2,
  User,
  LogOut,
  RefreshCw,
} from "lucide-react";

const drawerWidthExpanded = 248;
const drawerWidthCollapsed = 76;

const defaultNavItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "General" },
  { key: "account", label: "Account", icon: Settings, section: "General" },
  { key: "users", label: "Users", icon: Users, section: "Users" },
  { key: "audit_log", label: "Audit Log", icon: FileText, section: "System" },
  { key: "organization", label: "Organization", icon: Building2, section: "System" },
];

function ProtectedLayout({
  user,
  organizationName,
  organizationSlug,
  activeView,
  onNavigate,
  navItems = defaultNavItems,
  onLogout,
  onChangeOrganization,
  onRefreshData,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const groupedNav = navItems.reduce((acc, item) => {
    const section = item.section || "General";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {});

  const handleNavigate = (key) => {
    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: collapsed ? drawerWidthCollapsed : drawerWidthExpanded,
            boxSizing: "border-box",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.shortest,
              }),
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
        open
      >
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 2, gap: 1 }}>
          <IconButton size="small" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
          {!collapsed && (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Inside Advisory
              </Typography>
              {organizationName && (
                <Typography variant="caption" color="text.secondary">
                  {organizationName}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <Divider />
        <Box sx={{ px: 2.5, py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box
            component="img"
            src="/inside-advisory/logo.png"
            alt="Inside Advisory"
            sx={{ width: collapsed ? 32 : 120, transition: 'width 0.2s ease' }}
          />
          <Divider flexItem sx={{ borderColor: 'divider' }} />
          <Avatar
            sx={{ width: 42, height: 42 }}
            src={user?.avatar_url || user?.avatarUrl || undefined}
          >
            <User size={20} />
          </Avatar>
          {!collapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.en_name || user?.name || "User"}
              </Typography>
              {organizationSlug && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {organizationSlug}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {Object.entries(groupedNav).map(([section, items]) => (
            <Box key={section}>
              {!collapsed && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 2, py: 1.5, display: "block" }}
                >
                  {section}
                </Typography>
              )}
              <List sx={{ py: 0 }}>
                {items.map((item) => {
                  const Icon = item.icon;
                  const selected = item.key === activeView;
                  return (
                    <ListItemButton
                      key={item.key}
                      selected={selected}
                      onClick={() => handleNavigate(item.key)}
                      sx={{
                        borderRadius: collapsed ? "0" : 2,
                        mx: collapsed ? 0 : 1,
                        my: 0.5,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Icon size={18} />
                      </ListItemIcon>
                      {!collapsed && <ListItemText primary={item.label} />}
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>
        <Divider />
        <Box sx={{ p: collapsed ? 1.5 : 2.5, display: "flex", flexDirection: "column", gap: 1.5, pb: collapsed ? 2 : 3 }}>
          {!collapsed && (
            <Stack spacing={1}>
              {onChangeOrganization && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshCw size={16} />}
                  onClick={onChangeOrganization}
                >
                  Change Organization
                </Button>
              )}
              {onRefreshData && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshCw size={16} />}
                  onClick={onRefreshData}
                >
                  Refresh Data
                </Button>
              )}
              {onLogout && (
                <Button fullWidth
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<LogOut size={16} />}
                  onClick={onLogout}
                >
                  Logout
                </Button>
              )}
            </Stack>
          )}
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 3, md: 4 },
            maxWidth: "1600px",
            margin: "0 auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default ProtectedLayout;
