import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  PackageCheck, 
  UserPlus,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AssetWithDetails } from '@/lib/asset-types';

import { toast } from 'sonner';
import { AssignmentRecord } from '@/lib/asset-types';

interface AssetAssignmentTabProps {
  asset: AssetWithDetails;
  onUpdate: () => void;
}

export function AssetAssignmentTab({ asset, onUpdate }: AssetAssignmentTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<AssignmentRecord | null>(null);
  
  const [returnNotes, setReturnNotes] = useState('');
  const [assignFirstName, setAssignFirstName] = useState('');
  const [assignLastName, setAssignLastName] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignClient, setAssignClient] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [asset.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active assignment (no return_date)
      const { data: activeAssignment } = await supabase
        .from('assignments')
        .select(`*, profile:profiles!assignments_profile_id_fkey(full_name, email, department)`)
        .eq('asset_id', asset.id)
        .is('return_date', null)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentAssignment(activeAssignment as unknown as AssignmentRecord | null);
    } catch (error) {
      console.error('Error fetching assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!currentAssignment) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Close assignment record
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({ return_date: today, notes: returnNotes || currentAssignment.notes })
        .eq('id', currentAssignment.id);

      if (assignmentError) throw assignmentError;

      // 2. Set asset to stock and clear assigned_to
      const { error: assetError } = await supabase
        .from('assets')
        .update({ 
          status: 'stock', 
          assigned_to: null, 
          assignment_date: null 
        })
        .eq('id', asset.id);

      if (assetError) throw assetError;

      toast.success('Dispositivo devuelto. Estado: En Stock');
      setReturnNotes('');
      onUpdate();
      fetchData();
    } catch (error) {
      console.error('Error returning device:', error);
      toast.error('Error al registrar la devolución');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignFirstName || !assignLastName || !assignEmail || !assignDate) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const fullName = `${assignFirstName.trim()} ${assignLastName.trim()}`;

      // Optionally look up profile by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', assignEmail.trim())
        .maybeSingle();

      // 1. Create assignment record
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          asset_id: asset.id,
          profile_id: profile?.id || null,
          assigned_date: assignDate,
          notes: assignNotes || null,
          employee_name: fullName,
          employee_email: assignEmail.trim(),
          client_name: assignClient.trim() || null,
        });

      if (assignmentError) throw assignmentError;

      // 2. Update asset status
      const { error: assetError } = await supabase
        .from('assets')
        .update({ 
          status: 'asignado', 
          assigned_to: assignEmail.trim(),
          assignment_date: assignDate
        })
        .eq('id', asset.id);

      if (assetError) throw assetError;

      toast.success(`Dispositivo asignado a ${fullName}`);
      setAssignFirstName('');
      setAssignLastName('');
      setAssignEmail('');
      setAssignDate(new Date().toISOString().split('T')[0]);
      setAssignClient('');
      setAssignNotes('');
      onUpdate();
      fetchData();
    } catch (error) {
      console.error('Error assigning device:', error);
      toast.error('Error al asignar el dispositivo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAssigned = !!currentAssignment;
  const isInStock = asset.status === 'stock';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Custody Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Custodia Actual
          </CardTitle>
          <CardDescription>Estado actual del dispositivo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAssigned && currentAssignment ? (
            <>
              <Alert className="border-primary/50 bg-primary/5">
                <User className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Asignado</AlertTitle>
                <AlertDescription>
                  <div className="mt-1 space-y-1">
                    <p className="font-medium">{currentAssignment.employee_name || currentAssignment.profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{currentAssignment.employee_email || currentAssignment.profile?.email}</p>
                    {currentAssignment.profile?.department && (
                      <p className="text-sm text-muted-foreground">{currentAssignment.profile.department}</p>
                    )}
                    {currentAssignment.client_name && (
                      <p className="text-sm text-muted-foreground">Cliente: <strong>{currentAssignment.client_name}</strong></p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Desde: {new Date(currentAssignment.assigned_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Return form */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <ArrowDownToLine className="h-4 w-4" />
                  Registrar Devolución
                </h4>
                <p className="text-sm text-muted-foreground">
                  El dispositivo pasará a estado <strong>"En Stock"</strong> y quedará disponible para nueva asignación.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="return_notes">Notas de devolución</Label>
                  <Textarea
                    id="return_notes"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Estado del equipo, observaciones..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleReturn} 
                  disabled={saving} 
                  variant="outline"
                  className="w-full"
                >
                  <PackageCheck className="h-4 w-4 mr-2" />
                  {saving ? 'Procesando...' : 'Confirmar Devolución'}
                </Button>
              </div>
            </>
          ) : (
            <Alert className="border-success/50 bg-success/10">
              <PackageCheck className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">En Stock</AlertTitle>
              <AlertDescription>
                Este dispositivo no está asignado a ningún empleado y está disponible para nueva asignación.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* New Assignment */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nueva Asignación
          </CardTitle>
          <CardDescription>
            {isAssigned 
              ? 'Primero debes registrar la devolución del custodio actual'
              : 'Asigna este dispositivo a un empleado'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAssigned && (
            <Alert>
              <ArrowUpFromLine className="h-4 w-4" />
              <AlertTitle>Dispositivo en custodia</AlertTitle>
              <AlertDescription>
                Para asignar a un nuevo empleado, primero registra la devolución de <strong>{currentAssignment?.profile?.full_name}</strong>.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="assign_first_name">Nombre *</Label>
              <Input
                id="assign_first_name"
                value={assignFirstName}
                onChange={(e) => setAssignFirstName(e.target.value)}
                placeholder="Nombre"
                disabled={isAssigned}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assign_last_name">Apellido *</Label>
              <Input
                id="assign_last_name"
                value={assignLastName}
                onChange={(e) => setAssignLastName(e.target.value)}
                placeholder="Apellido"
                disabled={isAssigned}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assign_email">Email Corporativo *</Label>
            <Input
              id="assign_email"
              type="email"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              disabled={isAssigned}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assign_date">Fecha de Asignación *</Label>
            <Input
              id="assign_date"
              type="date"
              value={assignDate}
              onChange={(e) => setAssignDate(e.target.value)}
              disabled={isAssigned}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assign_client">Cliente / Ubicación</Label>
            <Input
              id="assign_client"
              value={assignClient}
              onChange={(e) => setAssignClient(e.target.value)}
              placeholder="Nombre del cliente o ubicación"
              disabled={isAssigned}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assign_notes">Notas de entrega</Label>
            <Textarea
              id="assign_notes"
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Observaciones, accesorios incluidos..."
              rows={3}
              disabled={isAssigned}
            />
          </div>

          <Button 
            onClick={handleAssign} 
            disabled={saving || isAssigned || !assignFirstName || !assignLastName || !assignEmail || !assignDate}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {saving ? 'Asignando...' : 'Asignar Dispositivo'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
