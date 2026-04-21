import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  Package, 
  Users, 
  AlertTriangle, 
  DollarSign,
  Laptop,
  Smartphone,
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardKPIs, Asset } from '@/lib/supabase-types';

function KPICard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = 'default'
}: { 
  title: string; 
  value: string | number; 
  description?: string;
  icon: React.ElementType;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'accent';
}) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent',
  };

  return (
    <Card className="kpi-card transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs text-success">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs>({
    gastoTotalAnual: 0,
    equiposStock: 0,
    equiposAsignados: 0,
    equiposBaja: 0,
    equiposRenovacion: 0,
    solicitudesPendientes: 0,
  });
  const [renewalAssets, setRenewalAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all assets
      const { data: assets } = await supabase
        .from('assets')
        .select('*');

      if (assets) {
        const currentYear = new Date().getFullYear();
        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear}-12-31`;

        const gastoAnual = assets
          .filter(a => a.purchase_date && a.purchase_date >= yearStart && a.purchase_date <= yearEnd)
          .reduce((sum, a) => sum + (parseFloat(a.purchase_price as any) || 0), 0);

        setKpis({
          gastoTotalAnual: gastoAnual,
          equiposStock: assets.filter(a => a.status === 'stock').length,
          equiposAsignados: assets.filter(a => a.status === 'asignado').length,
          equiposBaja: assets.filter(a => a.status === 'baja').length,
          equiposRenovacion: assets.filter(a => a.needs_renewal).length,
          solicitudesPendientes: 0, // Will update below
        });

        setRenewalAssets(
          (assets as Asset[]).filter(a => a.needs_renewal).slice(0, 5)
        );
      }

      // Fetch pending requests count
      const { count } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente');

      if (count !== null) {
        setKpis(prev => ({ ...prev, solicitudesPendientes: count }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/my-devices" replace />;
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen del inventario IT</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Gasto Anual"
          value={`€${kpis.gastoTotalAnual.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          description="Inversión en equipos este año"
          icon={DollarSign}
          variant="accent"
        />
        <KPICard
          title="En Stock"
          value={kpis.equiposStock}
          description="Equipos disponibles"
          icon={Package}
          variant="success"
        />
        <KPICard
          title="Asignados"
          value={kpis.equiposAsignados}
          description="Equipos en uso"
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Solicitudes Pendientes"
          value={kpis.solicitudesPendientes}
          description="Requieren atención"
          icon={ClipboardList}
          variant={kpis.solicitudesPendientes > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Alerts Section */}
      {kpis.equiposRenovacion > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle className="text-lg">Equipos que requieren renovación</CardTitle>
            </div>
            <CardDescription>
              {kpis.equiposRenovacion} equipo(s) marcado(s) para renovación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {renewalAssets.map(asset => (
                <div 
                  key={asset.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-card border"
                >
                  <div className="flex items-center gap-3">
                    {asset.device_type === 'portatil' ? (
                      <Laptop className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{asset.brand} {asset.model}</p>
                      <p className="text-sm text-muted-foreground">S/N: {asset.serial_number}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="badge-pendiente">
                    Requiere renovación
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Equipos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm">En Stock</span>
                </div>
                <span className="font-medium">{kpis.equiposStock}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-sm">Asignados</span>
                </div>
                <span className="font-medium">{kpis.equiposAsignados}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm">De Baja</span>
                </div>
                <span className="font-medium">{kpis.equiposBaja}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="/assets" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm">Ver inventario completo</span>
            </a>
            <a 
              href="/assignments" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm">Gestionar entregas</span>
            </a>
            <a 
              href="/pending-docs" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-sm">Documentos pendientes</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
