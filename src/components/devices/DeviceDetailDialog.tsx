import { 
  Laptop, 
  Smartphone, 
  Calendar,
  FileText,
  Hash,
  Tag,
  Euro,
  StickyNote
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AssignmentWithDetails } from '@/lib/supabase-types';

interface DeviceDetailDialogProps {
  assignment: AssignmentWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceDetailDialog({ assignment, open, onOpenChange }: DeviceDetailDialogProps) {
  if (!assignment?.asset) return null;

  const { asset } = assignment;
  const includedAccessories = (assignment.included_accessories || []) as string[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              {asset.device_type === 'portatil' ? (
                <Laptop className="h-6 w-6 text-primary" />
              ) : (
                <Smartphone className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {asset.brand} {asset.model}
              </DialogTitle>
              <DialogDescription className="font-mono">
                S/N: {asset.serial_number}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Device Info Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tipo
              </p>
              <p className="font-medium capitalize">{asset.device_type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> Número de Serie
              </p>
              <p className="font-mono text-sm">{asset.serial_number}</p>
            </div>
            {asset.imei && (
              <div className="space-y-1 col-span-2">
                <p className="text-sm text-muted-foreground">IMEI</p>
                <p className="font-mono text-sm">{asset.imei}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Assignment Info */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Información de Asignación
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                <p className="font-medium">
                  {new Date(assignment.assigned_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Estado Documento</p>
                <Badge 
                  variant="outline" 
                  className={assignment.signed ? 'badge-aprobado' : 'badge-pendiente'}
                >
                  {assignment.signed ? 'Firmado' : 'Pendiente firma'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Accessories */}
          {includedAccessories.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Accesorios Incluidos</h4>
                <div className="flex flex-wrap gap-2">
                  {includedAccessories.map((acc, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {acc}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Purchase Info */}
          {(asset.purchase_date || asset.purchase_price) && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Información del Equipo
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {asset.purchase_date && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Fecha de Compra</p>
                      <p className="font-medium">
                        {new Date(asset.purchase_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                  {asset.purchase_price && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Precio</p>
                      <p className="font-medium">
                        €{parseFloat(asset.purchase_price as any).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {assignment.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notas
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {assignment.notes}
                </p>
              </div>
            </>
          )}

          {/* Renewal Warning */}
          {asset.needs_renewal && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-sm text-warning font-medium">
                ⚠️ Este equipo está marcado para renovación
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
