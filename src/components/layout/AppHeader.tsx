import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ClipboardList, 
  Users,
  Laptop,
  LogOut,
  Menu
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  const location = useLocation();
  // Support active state for nested routes (e.g., /assets/123)
  const isActive = to === '/assets' 
    ? location.pathname.startsWith('/assets')
    : location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        "hover:bg-accent/10 hover:text-accent",
        isActive && "bg-accent/10 text-accent"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon: Icon, label }: NavItemProps) {
  const location = useLocation();
  const isActive = to === '/assets' 
    ? location.pathname.startsWith('/assets')
    : location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
        "hover:bg-muted",
        isActive && "bg-accent/10 text-accent"
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-soft">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
            <Laptop className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-semibold text-base text-foreground">Fihoca</h1>
            <p className="text-xs text-muted-foreground">IT Manager</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        {/* User Menu & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {profile?.full_name?.split(' ')[0] || 'Usuario'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Usuario'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-1 mt-6">
                {menuItems.map((item) => (
                  <div key={item.to} onClick={() => setMobileOpen(false)}>
                    <MobileNavItem
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                    />
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
