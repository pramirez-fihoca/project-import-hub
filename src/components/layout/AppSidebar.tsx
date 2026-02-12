import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  ClipboardList, 
  Settings,
  Laptop,
  Smartphone,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
}

function SidebarItem({ to, icon: Icon, label, collapsed }: SidebarItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-primary font-medium",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export function AppSidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
    <aside 
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-sidebar-border",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Laptop className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Fihoca</h1>
              <p className="text-xs text-sidebar-foreground/60">IT Manager</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <Laptop className="h-4 w-4 text-accent-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* User Info */}
        {!collapsed && profile && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {isAdmin ? 'Administrador' : 'Usuario'}
            </p>
          </div>
        )}

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Colapsar
            </>
          )}
        </Button>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
