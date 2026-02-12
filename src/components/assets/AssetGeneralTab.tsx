import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssetWithDetails } from '@/lib/asset-types';
import type { AssetType, AssetStatus } from '@/lib/supabase-types';
import { toast } from 'sonner';

interface AssetGeneralTabProps {
  asset: AssetWithDetails;
  onUpdate: () => void;
}

export function AssetGeneralTab({ asset, onUpdate }: AssetGeneralTabProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    device_type: asset.device_type,
    brand: asset.brand,
    model: asset.model,
    serial_number: asset.serial_number,
    imei: asset.imei || '',
    purchase_date: asset.purchase_date || '',
    purchase_price: asset.purchase_price?.toString() || '',
    status: asset.status,
    needs_renewal: asset.needs_renewal,
    specifications: asset.specifications || '',
    notes: asset.notes || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update({
          device_type: formData.device_type,
          brand: formData.brand,
          model: formData.model,
          serial_number: formData.serial_number,
          imei: formData.imei || null,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          status: formData.status,
          specifications: formData.specifications || null,
          needs_renewal: formData.needs_renewal,
          notes: formData.notes || null,
        })
        .eq('id', asset.id);

      if (error) throw error;

      toast.success('Equipo actualizado correctamente');
      onUpdate();
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        toast.error('Ya existe un equipo con ese número de serie');
      } else {
        toast.error('Error al actualizar el equipo');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Technical Data */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Datos Técnicos</CardTitle>
            <CardDescription>Información del equipo</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="device_type">Tipo de Equipo</Label>
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
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="serial_number">Número de Serie</Label>
            <Input
              id="serial_number"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
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
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial & Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Estado y Datos Financieros</CardTitle>
          <CardDescription>Información de compra y estado actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as AssetStatus })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">En Stock</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="baja">De Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              <Label htmlFor="purchase_price">Precio (€)</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Checkbox
              id="needs_renewal"
              checked={formData.needs_renewal}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, needs_renewal: !!checked })
              }
            />
            <Label htmlFor="needs_renewal" className="cursor-pointer">
              Requiere renovación
            </Label>
          </div>

          <div className="pt-6">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
