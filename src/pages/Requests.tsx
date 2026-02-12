import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  MessageSquare
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
import { Textarea } from '@/components/ui/textarea';
import type { RequestWithProfile, Profile, RequestStatus } from '@/lib/supabase-types';
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

export default function Requests() {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithProfile | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseAction, setResponseAction] = useState<'aprobar' | 'rechazar'>('aprobar');

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin]);

  const fetchRequests = async () => {
    try {
      const { data: requestsData } = await supabase
        .from('requests')
        .select('*')
        .order('request_date', { ascending: false });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      if (requestsData && profilesData) {
        const enrichedRequests = requestsData.map(r => ({
          ...r,
          status: r.status as RequestStatus,
          profile: profilesData.find(p => String(p.id) === String(r.profile_id)) as unknown as Profile,
        }));
        setRequests(enrichedRequests as RequestWithProfile[]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedRequest) return;

    try {
      const newStatus = responseAction === 'aprobar' ? 'aprobado' : 'rechazado';

      const { error } = await supabase
        .from('requests')
        .update({
          status: newStatus,
          admin_response: responseText || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success(
        responseAction === 'aprobar' 
          ? 'Solicitud aprobada' 
          : 'Solicitud rechazada'
      );
      setResponseDialogOpen(false);
      setSelectedRequest(null);
      setResponseText('');
      fetchRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Error al responder la solicitud');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pendiente');
  const processedRequests = requests.filter(r => r.status !== 'pendiente');

  if (!isAdmin) {
    return <Navigate to="/my-devices" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Solicitudes de Material</h1>
        <p className="text-muted-foreground">
          Gestiona las peticiones de los empleados
        </p>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-warning" />
          Pendientes ({pendingRequests.length})
        </h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay solicitudes pendientes
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-warning/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{request.material_type}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3" />
                        {request.profile?.full_name}
                        <span className="text-muted-foreground">•</span>
                        <Calendar className="h-3 w-3" />
                        {new Date(request.request_date).toLocaleDateString('es-ES')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={statusStyles[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm">{request.justification}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setSelectedRequest(request);
                        setResponseAction('aprobar');
                        setResponseDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRequest(request);
                        setResponseAction('rechazar');
                        setResponseDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Historial</h2>
          <div className="space-y-3">
            {processedRequests.map((request) => {
              const StatusIcon = statusIcons[request.status];
              return (
                <Card key={request.id} className="opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${
                            request.status === 'aprobado' ? 'text-success' : 'text-destructive'
                          }`} />
                          {request.material_type}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3" />
                          {request.profile?.full_name}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={statusStyles[request.status]}>
                        {statusLabels[request.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  {request.admin_response && (
                    <CardContent>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 mt-0.5" />
                        <p>{request.admin_response}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'aprobar'
                ? 'Confirma la aprobación de esta solicitud'
                : 'Indica el motivo del rechazo'}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted mb-4">
                <p className="font-medium">{selectedRequest.material_type}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Solicitado por: {selectedRequest.profile?.full_name}
                </p>
                <p className="text-sm mt-2">{selectedRequest.justification}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="response">
                  Respuesta {responseAction === 'rechazar' && '(requerido)'}
                </Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={
                    responseAction === 'aprobar'
                      ? 'Comentario opcional...'
                      : 'Motivo del rechazo...'
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRespond}
              variant={responseAction === 'rechazar' ? 'destructive' : 'default'}
              disabled={responseAction === 'rechazar' && !responseText}
            >
              {responseAction === 'aprobar' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
