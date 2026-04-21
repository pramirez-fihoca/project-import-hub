import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ClipboardList, 
  Users,
  Laptop,
  LogOut,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import logoFihoca from '@/assets/logo-fihoca.jpg';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ to, icon: Icon, label, onClick }: NavItemProps & { onClick?: () => void }) {
  const location = useLocation();
  const isActive = to === '/assets'
    ? location.pathname.startsWith('/assets')
    : location.pathname === to;

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 h-9 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
        "text-sidebar-foreground hover:bg-sidebar-accent",
        isActive && "bg-secondary text-secondary-foreground hover:bg-secondary/90"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon: Icon, label, onClick }: NavItemProps & { onClick?: () => void }) {
  const location = useLocation();
  const isActive = to === '/assets'
    ? location.pathname.startsWith('/assets')
    : location.pathname === to;

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent",
        isActive && "bg-secondary text-secondary-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppHeader() {
  const { profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminMenuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/assets', icon: Package, label: 'Inventario' },
    { to: '/assignments', icon: FileText, label: 'Entregas' },
    { to: '/pending-docs', icon: ClipboardList, label: 'Docs Pendientes' },
    { to: '/requests', icon: Users, label: 'Solicitudes' },
  ];

  const userMenuItems = [
    { to: '/my-devices', icon: Laptop, label: 'Mis Dispositivos' },
    { to: '/my-requests', icon: ClipboardList, label: 'Mis Solicitudes' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border shadow-sm flex">
        {/* Left: Logo on white background */}
        <div className="bg-white flex items-center px-3 sm:px-6 h-16 border-r border-border gap-2 sm:gap-3 shrink-0">
          <img
            src={logoFihoca}
            alt="Fihoca"
            className="h-7 sm:h-8 w-auto"
          />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground whitespace-nowrap">
            IT MANAGER
          </span>
        </div>

        {/* Right: Navigation on burgundy background */}
        <div className="flex-1 bg-sidebar text-sidebar-foreground h-16 px-2 lg:px-4 flex items-center justify-end min-w-0">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 min-w-0 overflow-hidden">
            {menuItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>

          {/* Desktop Help & Logout */}
          <div className="hidden lg:flex items-center gap-1 ml-2 pl-2 border-l border-sidebar-border/50 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground h-9"
            >
              <HelpCircle className="h-4 w-4" />
              Ayuda
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground h-9"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden ml-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-sidebar text-sidebar-foreground z-50 lg:hidden border-b border-border shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => (
                <MobileNavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
              <div className="pt-4 mt-4 border-t border-sidebar-border space-y-1">
                {profile && (
                  <div className="px-4 py-2 text-sm">
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="text-xs text-sidebar-foreground/70">
                      {isAdmin ? 'Administrador' : 'Usuario'}
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda
                </Button>
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
