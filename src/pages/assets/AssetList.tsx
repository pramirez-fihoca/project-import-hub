import { useEffect, useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Laptop, 
  Smartphone, 
  AlertTriangle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { AssetWithDetails, statusLabels, statusStyles } from '@/lib/asset-types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ITEMS_PER_PAGE = 15;

export default function AssetList() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState<AssetWithDetails[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('asignado');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isAdmin) {
      fetchAssets();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterAssets();
    setCurrentPage(1);
  }, [assets, searchTerm, filterType, filterStatus]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*, assignments!assignments_asset_id_fkey(employee_name, employee_email, assigned_date, return_date)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich assets with active assignment data
      const enriched = (data || []).map((asset: any) => {
        const activeAssignment = (asset.assignments || []).find(
          (a: any) => a.return_date === null
        );
        return {
          ...asset,
          _assignedName: activeAssignment?.employee_name || activeAssignment?.employee_email || null,
          _assignmentDate: activeAssignment?.assigned_date || null,
        };
      });

      setAssets(enriched as AssetWithDetails[]);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success('Equipo eliminado correctamente');
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Error al eliminar el equipo');
    }
  };

  const filterAssets = () => {
    let result = [...assets];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a: any) =>
          a.brand.toLowerCase().includes(term) ||
          a.model.toLowerCase().includes(term) ||
          a.serial_number.toLowerCase().includes(term) ||
          (a.imei && a.imei.toLowerCase().includes(term)) ||
          (a.assigned_to && a.assigned_to.toLowerCase().includes(term)) ||
          (a._assignedName && a._assignedName.toLowerCase().includes(term))
      );
    }

    if (filterType !== 'all') {
      result = result.filter((a: any) => a.device_type === filterType);
    }

    if (filterStatus !== 'all') {
      result = result.filter((a: any) => a.status === filterStatus);
    }

    setFilteredAssets(result);
  };

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / ITEMS_PER_PAGE));
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!isAdmin) {
    return <Navigate to="/my-devices" replace />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Inventario"
        description="Gestión de equipos IT de la empresa"
        breadcrumbs={[{ label: 'Inventario' }]}
        actions={
          <Button asChild>
            <Link to="/assets/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Equipo
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por marca, modelo, serie o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="portatil">Portátil</SelectItem>
            <SelectItem value="movil">Móvil</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
            <SelectItem value="raton">Ratón</SelectItem>
            <SelectItem value="maletin">Maletín</SelectItem>
            <SelectItem value="auriculares">Auriculares</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="stock">En Stock</SelectItem>
            <SelectItem value="asignado">Asignado</SelectItem>
            <SelectItem value="baja">De Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Marca / Modelo</TableHead>
              <TableHead>Nº Serie</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead>F. Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    Cargando inventario...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">No se encontraron equipos</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAssets.map((asset) => (
                <TableRow key={asset.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {asset.device_type === 'portatil' ? (
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="capitalize">{asset.device_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{asset.brand}</p>
                        <p className="text-sm text-muted-foreground">{asset.model}</p>
                      </div>
                      {asset.needs_renewal && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{asset.serial_number}</TableCell>
                  <TableCell>
                    {(asset as any)._assignedName ? (
                      <span className="text-sm">{(asset as any)._assignedName}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(asset as any)._assignmentDate ? (
                      <span className="text-sm">
                        {new Date((asset as any)._assignmentDate).toLocaleDateString('es-ES')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[asset.status]}>
                      {statusLabels[asset.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {asset.purchase_price
                      ? `€${parseFloat(asset.purchase_price as any).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/assets/${asset.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará permanentemente <strong>{asset.brand} {asset.model}</strong> (S/N: {asset.serial_number}). Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(asset.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredAssets.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} de {filteredAssets.length} equipos
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
