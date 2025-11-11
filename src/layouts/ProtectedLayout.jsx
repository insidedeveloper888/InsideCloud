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
  Stack,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { User } from "lucide-react";

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 72;

function ProtectedLayout({
  user,
  organizationName,
  organizationSlug,
  activeView,
  onNavigate,
  navItems = [],
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
            display: "flex",
            flexDirection: "column",
          },
        }}
        open
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            px: 1,
            py: 1.5,
          }}
        >
          <IconButton size="small" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ px: collapsed ? 1 : 2.5, pt: 3, pb: 2, textAlign: "center" }}>
          <Box
            component="img"
            src="/inside-advisory/logo.png"
            alt="Inside Advisory"
            sx={{ width: collapsed ? 36 : 120, height: "auto", mb: collapsed ? 1 : 1.5 }}
          />
          {!collapsed && (
            <Stack spacing={1} alignItems="center">
              <Typography variant="subtitle2" fontWeight={600}>
                Inside Advisory
              </Typography>
              <Avatar
                sx={{ width: 48, height: 48 }}
                src={user?.avatar_url || user?.avatarUrl || undefined}
              >
                <User size={20} />
              </Avatar>
              <Typography variant="subtitle2" noWrap>
                {user?.en_name || user?.name || "User"}
              </Typography>
              {organizationSlug && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {organizationSlug}
                </Typography>
              )}
            </Stack>
          )}
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: "auto", px: collapsed ? 0 : 1.5, py: 1 }}>
          {Object.entries(groupedNav).map(([section, items]) => (
            <Box key={section} sx={{ mb: collapsed ? 0.5 : 1.5 }}>
              {!collapsed && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 1, pb: 0.75, display: "block" }}
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
                        mx: collapsed ? 0 : 0.5,
                        my: 0.25,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: collapsed ? 32 : 36 }}>
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
        <Box sx={{ px: collapsed ? 1 : 2, py: collapsed ? 1.5 : 2.5 }}>
          {!collapsed && (
            <Typography variant="caption" color="text.secondary" align="center">
              © 2025 Inside Advisory. All rights reserved.
            </Typography>
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
            maxWidth: "1200px",
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
