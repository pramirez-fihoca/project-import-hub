import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  PackageCheck, 
  Loader2,
  ArrowDownToLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAssigned = !!currentAssignment;

  return (
    <div className="max-w-2xl">
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
                Este dispositivo no está asignado a ningún empleado. Para asignarlo a un empleado, ve a la sección <strong>Entregas</strong> y crea una nueva entrega seleccionando un equipo en stock.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
