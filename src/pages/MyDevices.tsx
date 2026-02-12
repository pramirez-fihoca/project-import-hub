import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Laptop, 
  Smartphone, 
  Package,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeviceDetailDialog } from '@/components/devices/DeviceDetailDialog';
import type { AssignmentWithDetails, Asset } from '@/lib/supabase-types';
import { toast } from 'sonner';

export default function MyDevices() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchMyDevices();
    }
  }, [profile]);

  const fetchMyDevices = async () => {
    if (!profile) return;

    try {
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('profile_id', profile.id as any)
        .is('return_date', null)
        .order('assigned_date', { ascending: false });

      const { data: assetsData } = await supabase
        .from('assets')
        .select('*');

      if (assignmentsData && assetsData) {
        const enrichedAssignments = assignmentsData.map(a => ({
          ...a,
          included_accessories: (a.included_accessories || []) as string[],
          asset: assetsData.find(asset => asset.id === a.asset_id) as unknown as Asset,
        }));
        setAssignments(enrichedAssignments as unknown as AssignmentWithDetails[]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Error al cargar tus dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceClick = (assignment: AssignmentWithDetails) => {
    setSelectedAssignment(assignment);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Dispositivos</h1>
        <p className="text-muted-foreground">
          Equipos actualmente asignados a ti
        </p>
      </div>

      {/* Devices Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Sin dispositivos asignados</h3>
            <p className="text-muted-foreground mt-1">
              No tienes ningún equipo asignado actualmente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => {
            const includedAccessories = (assignment.included_accessories || []) as string[];
            return (
              <Card 
                key={assignment.id} 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => handleDeviceClick(assignment)}
              >
                <div className="h-2 gradient-corporate" />
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {assignment.asset?.device_type === 'portatil' ? (
                        <Laptop className="h-6 w-6 text-primary" />
                      ) : (
                        <Smartphone className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{assignment.asset?.brand} {assignment.asset?.model}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription className="font-mono text-sm">
                        S/N: {assignment.asset?.serial_number}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium capitalize">{assignment.asset?.device_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha de entrega</p>
                      <p className="font-medium">
                        {new Date(assignment.assigned_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  {assignment.asset?.imei && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">IMEI</p>
                      <p className="font-mono">{assignment.asset.imei}</p>
                    </div>
                  )}

                  {includedAccessories.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Accesorios incluidos</p>
                      <div className="flex flex-wrap gap-1">
                        {includedAccessories.map((acc, i) => (
                          <Badge key={i} variant="secondary">
                            {acc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>
                        {assignment.signed ? 'Documento firmado' : 'Pendiente de firma'}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={assignment.signed ? 'badge-aprobado' : 'badge-pendiente'}
                    >
                      {assignment.signed ? 'Firmado' : 'Sin firmar'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Device Detail Dialog */}
      <DeviceDetailDialog
        assignment={selectedAssignment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
