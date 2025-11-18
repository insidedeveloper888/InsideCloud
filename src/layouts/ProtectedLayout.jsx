import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

/**
 * ProtectedLayout Component
 *
 * Main application layout with navigation header, mobile drawer, and footer
 * Replaces Material-UI with Tailwind CSS + shadcn/ui (ADR-002)
 *
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {string} props.organizationName - Organization display name
 * @param {string} props.organizationSlug - Organization slug
 * @param {string} props.activeView - Currently active view key
 * @param {Function} props.onNavigate - Navigation handler
 * @param {Array} props.navItems - Navigation items array
 * @param {React.ReactNode} props.children - Page content
 */
function ProtectedLayout({
  user,
  organizationName,
  organizationSlug,
  activeView,
  onNavigate,
  navItems = [],
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (key) => {
    if (onNavigate) {
      onNavigate(key);
    }
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const name = user?.en_name || user?.name || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Mobile drawer content
  const drawer = (
    <div className="flex flex-col h-full w-[85vw] sm:w-[280px] max-w-[320px]">
      {/* Drawer header with close button */}
      <div className="flex justify-end items-center p-3 sm:p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDrawerToggle}
          className="h-8 w-8"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="border-t border-neutral-200" />

      {/* User profile section */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col items-center space-y-2 mb-4 sm:mb-6">
          <Avatar className="w-14 h-14 sm:w-16 sm:h-16">
            <AvatarImage
              src={user?.avatar_url || user?.avatarUrl}
              alt={user?.en_name || user?.name}
            />
            <AvatarFallback>
              <User size={24} className="text-neutral-600" />
            </AvatarFallback>
          </Avatar>
          <h3 className="text-[15px] sm:text-base font-semibold text-neutral-900">
            {user?.en_name || user?.name || "User"}
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-500">
            {organizationName || organizationSlug || "Organisation"}
          </p>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = item.key === activeView;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 sm:py-2.5 rounded-lg text-[14px] sm:text-[15px] font-medium transition-colors",
                  isSelected
                    ? "bg-primary-50 text-gray-900"
                    : "text-gray-900 hover:bg-neutral-100"
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-3 sm:p-4 border-t border-neutral-200">
        <p className="text-[10px] sm:text-xs text-neutral-500 text-center">
          © 2025 Inside Advisory
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hide scrollbars globally */}
      <style>
        {`
          * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          *::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="px-2 sm:px-3 md:px-4">
          <div className="flex items-center justify-between h-11 sm:h-12 md:h-12">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDrawerToggle}
                className="h-9 w-9 sm:h-10 sm:w-10 "
              >
                <Menu size={20} />
              </Button>
            </div>

            {/* Desktop navigation tabs */}
            <nav className="hidden md:flex flex-1 items-center space-x-1 mr-4">
              {navItems.map((item) => {
                const isSelected = item.key === activeView;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.key)}
                    className={cn(
                      "px-3 lg:px-4 py-2 text-xs lg:text-[13px] font-medium transition-colors border-b-2 whitespace-nowrap",
                      isSelected
                        ? "text-gray-900 border-primary-600"
                        : "text-neutral-600 border-transparent hover:text-primary-600"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User profile section (always visible) */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-2 lg:space-x-3 ml-auto">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 md:w-7 md:h-7 lg:w-8 lg:h-8">
                <AvatarImage
                  src={user?.avatar_url || user?.avatarUrl}
                  alt={user?.en_name || user?.name}
                />
                <AvatarFallback className="text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              {/* User name and org (hidden on very small screens) */}
              <div className="hidden sm:flex md:flex flex-col max-w-[120px] md:max-w-[150px] lg:max-w-[180px]">
                <p className="text-[11px] sm:text-xs md:text-[11px] lg:text-[13px] font-semibold text-neutral-900 truncate leading-tight">
                  {user?.en_name || user?.name || "User"}
                </p>
                <p className="hidden md:block text-[10px] lg:text-[11px] text-neutral-500 truncate leading-tight">
                  {organizationName || organizationSlug || "Organisation"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleDrawerToggle}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 bg-white shadow-xl md:hidden">
            {drawer}
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 min-h-[calc(100vh-44px)] sm:min-h-[calc(100vh-48px)]">
        <div
          className={cn(
            activeView === "strategic_map" || activeView === "strategic_map_v2"
              ? "p-0"
              : "px-4 sm:px-6 md:px-8 py-5 md:py-7"
          )}
        >
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 bg-white border-t border-neutral-200">
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-xs text-neutral-500 text-center">
            © 2025 Inside Advisory. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ProtectedLayout;
