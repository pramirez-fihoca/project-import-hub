import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Request, RequestStatus } from '@/lib/supabase-types';
import { toast } from 'sonner';

const statusLabels: Record<RequestStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const statusStyles: Record<RequestStatus, string> = {
  pendiente: 'badge-pendiente',
  aprobado: 'badge-aprobado',
  rechazado: 'badge-rechazado',
};

const statusIcons: Record<RequestStatus, React.ElementType> = {
  pendiente: Clock,
  aprobado: CheckCircle,
  rechazado: XCircle,
};

export default function MyRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [materialType, setMaterialType] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchMyRequests();
    }
  }, [profile]);

  const fetchMyRequests = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('profile_id', String(profile.id))
        .order('request_date', { ascending: false });

      if (data) {
        setRequests(data.map(r => ({
          ...r,
          status: r.status as RequestStatus,
        })) as Request[]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Error al cargar tus solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile || !materialType || !justification) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('requests').insert({
        profile_id: String(profile.id),
        material_type: materialType,
        justification,
      } as any);

      if (error) throw error;

      toast.success('Solicitud enviada correctamente');
      setDialogOpen(false);
      setMaterialType('');
      setJustification('');
      fetchMyRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis Solicitudes</h1>
          <p className="text-muted-foreground">
            Pide nuevo material o equipos
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Sin solicitudes</h3>
            <p className="text-muted-foreground mt-1">
              No has realizado ninguna solicitud todavía
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera solicitud
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const StatusIcon = statusIcons[request.status];
            return (
              <Card key={request.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        request.status === 'pendiente' 
                          ? 'bg-warning/10 text-warning'
                          : request.status === 'aprobado'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{request.material_type}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(request.request_date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusStyles[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Tu justificación:
                    </p>
                    <p className="text-sm">{request.justification}</p>
                  </div>
                  
                  {request.admin_response && (
                    <div className={`p-3 rounded-lg ${
                      request.status === 'aprobado' 
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-destructive/10 border border-destructive/20'
                    }`}>
                      <p className="text-sm font-medium mb-1">
                        Respuesta del administrador:
                      </p>
                      <p className="text-sm">{request.admin_response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Material</DialogTitle>
            <DialogDescription>
              Describe qué material necesitas y por qué
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de material</Label>
              <Input
                id="tipo"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                placeholder="Ej: Portátil, Móvil, Ratón, Monitor..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="justificacion">Justificación</Label>
              <Textarea
                id="justificacion"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explica por qué necesitas este material..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!materialType || !justification || submitting}
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
