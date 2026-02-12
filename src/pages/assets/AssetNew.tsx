import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import type { AssetType } from '@/lib/supabase-types';
import { toast } from 'sonner';

export default function AssetNew() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    device_type: 'portatil' as AssetType,
    brand: '',
    model: '',
    serial_number: '',
    imei: '',
    purchase_date: '',
    purchase_price: '',
    specifications: '',
    notes: '',
    assign_first_name: '',
    assign_last_name: '',
    assigned_to: '',
    assignment_date: '',
    client_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: newAsset, error } = await supabase.from('assets').insert({
        device_type: formData.device_type,
        brand: formData.brand,
        model: formData.model,
        serial_number: formData.serial_number,
        imei: formData.imei || null,
        purchase_date: formData.purchase_date || null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        specifications: formData.specifications || null,
        notes: formData.notes || null,
        assigned_to: formData.assigned_to || null,
        assignment_date: formData.assignment_date || null,
        status: formData.assigned_to ? 'asignado' : 'stock',
      }).select().single();

      if (error) throw error;

      // If initial assignment provided, create assignment record
      if (formData.assigned_to && newAsset) {
        const fullName = `${formData.assign_first_name.trim()} ${formData.assign_last_name.trim()}`.trim();

        // Optionally look up profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.assigned_to)
          .maybeSingle();

        const { error: assignError } = await supabase.from('assignments').insert({
          asset_id: newAsset.id,
          profile_id: profile?.id || null,
          assigned_date: formData.assignment_date || new Date().toISOString().split('T')[0],
          notes: 'Asignación inicial al crear el equipo',
          employee_name: fullName || null,
          employee_email: formData.assigned_to.trim(),
          client_name: formData.client_name.trim() || null,
        });
        if (assignError) {
          console.error('Error creating assignment record:', assignError);
          toast.error('Equipo creado, pero hubo un error al registrar la asignación');
        }
      }

      toast.success('Equipo creado correctamente');
      navigate('/assets');
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        toast.error('Ya existe un equipo con ese número de serie');
      } else {
        toast.error('Error al crear el equipo');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/my-devices" replace />;
  }

  const isValid = formData.brand && formData.model && formData.serial_number;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nuevo Equipo"
        description="Registra un nuevo activo en el inventario"
        breadcrumbs={[
          { label: 'Inventario', href: '/assets' },
          { label: 'Nuevo Equipo' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/assets')}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Equipo'}
            </Button>
          </>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Technical Data */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Datos Técnicos</CardTitle>
              <CardDescription>Información del equipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="device_type">Tipo de Equipo *</Label>
                <Select
                  value={formData.device_type}
                  onValueChange={(v) => setFormData({ ...formData, device_type: v as AssetType })}
                >
                  <SelectTrigger id="device_type">
                    <SelectValue />
                  </SelectTrigger>
                <SelectContent>
                    <SelectItem value="portatil">Portátil</SelectItem>
                    <SelectItem value="movil">Móvil</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="raton">Ratón</SelectItem>
                    <SelectItem value="maletin">Maletín</SelectItem>
                    <SelectItem value="auriculares">Auriculares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Dell, HP, Apple..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Latitude 5520..."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="serial_number">Número de Serie *</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Identificador único del equipo"
                  className="font-mono"
                />
              </div>

              {formData.device_type === 'portatil' && (
                <div className="grid gap-2">
                  <Label htmlFor="specifications">Especificaciones</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="CPU, RAM, disco, pantalla..."
                    rows={3}
                  />
                </div>
              )}

              {formData.device_type === 'movil' && (
                <div className="grid gap-2">
                  <Label htmlFor="imei">IMEI</Label>
                  <Input
                    id="imei"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    placeholder="Opcional para móviles"
                    className="font-mono"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Financial & Assignment */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Datos Financieros y Asignación</CardTitle>
              <CardDescription>Información de compra y custodia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="purchase_date">Fecha de Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchase_price">Precio de Compra (€)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-4">Asignación Inicial (Opcional)</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Si asignas el equipo ahora, el estado cambiará a "Asignado"
                </p>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="assign_first_name">Nombre</Label>
                      <Input
                        id="assign_first_name"
                        value={formData.assign_first_name}
                        onChange={(e) => setFormData({ ...formData, assign_first_name: e.target.value })}
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assign_last_name">Apellido</Label>
                      <Input
                        id="assign_last_name"
                        value={formData.assign_last_name}
                        onChange={(e) => setFormData({ ...formData, assign_last_name: e.target.value })}
                        placeholder="Apellido"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assigned_to">Email Corporativo</Label>
                    <Input
                      id="assigned_to"
                      type="email"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignment_date">Fecha de Entrega</Label>
                    <Input
                      id="assignment_date"
                      type="date"
                      value={formData.assignment_date}
                      onChange={(e) => setFormData({ ...formData, assignment_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="client_name">Cliente / Ubicación</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Nombre del cliente o ubicación"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
