import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  FileText,
  Download,
  Laptop,
  Smartphone,
  Calendar,
  User,
  PackageCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { Asset, Profile, AssignmentWithDetails, Accessory } from '@/lib/supabase-types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

export default function Assignments() {
  const { isAdmin } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch assignments with related data
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch assets
      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .order('brand');

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      // Fetch accessories
      const { data: accessoriesData } = await supabase
        .from('accessories')
        .select('*');

      if (assignmentsData && assetsData && profilesData) {
        const enrichedAssignments = assignmentsData.map(a => ({
          ...a,
          included_accessories: (a.included_accessories || []) as string[],
          asset: assetsData.find(asset => asset.id === a.asset_id) as unknown as Asset,
          profile: profilesData.find(profile => profile.id === a.profile_id) as unknown as Profile,
        }));
        setAssignments(enrichedAssignments as unknown as AssignmentWithDetails[]);
      }

      setAssets((assetsData as unknown as Asset[]) || []);
      setProfiles((profilesData as unknown as Profile[]) || []);
      setAccessories((accessoriesData as Accessory[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar las entregas');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (
    asset: Asset,
    profile: Profile,
    selectedAccessories: string[],
    date: string
  ) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('FIHOCA IT MANAGER', 20, 25);
    doc.setFontSize(12);
    doc.text('Acta de Entrega de Material Informático', 20, 33);

    // Reset colors
    doc.setTextColor(0, 0, 0);

    // Date
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date(date).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`, 20, 55);

    // Employee Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMPLEADO', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Nombre: ${profile.full_name}`, 20, 80);
    doc.text(`Email: ${profile.email}`, 20, 88);
    doc.text(`Departamento: ${profile.department || 'No especificado'}`, 20, 96);

    // Equipment Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EQUIPO', 20, 115);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Tipo: ${asset.device_type === 'portatil' ? 'Portátil' : 'Móvil'}`, 20, 125);
    doc.text(`Marca: ${asset.brand}`, 20, 133);
    doc.text(`Modelo: ${asset.model}`, 20, 141);
    doc.text(`Número de Serie: ${asset.serial_number}`, 20, 149);
    if (asset.imei) {
      doc.text(`IMEI: ${asset.imei}`, 20, 157);
    }

    // Accessories Section
    if (selectedAccessories.length > 0) {
      const yOffset = asset.imei ? 175 : 167;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCESORIOS INCLUIDOS', 20, yOffset);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      selectedAccessories.forEach((acc, i) => {
        doc.text(`• ${acc}`, 25, yOffset + 10 + (i * 8));
      });
    }

    // Signature Section
    const signY = 220;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMAS', 20, signY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.text('Entregado por (IT):', 20, signY + 15);
    doc.line(20, signY + 35, 90, signY + 35);
    
    doc.text('Recibido por (Empleado):', 110, signY + 15);
    doc.line(110, signY + 35, 180, signY + 35);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Documento generado automáticamente por Fihoca IT Manager', 20, 280);

    return doc;
  };

  const handleCreateAssignment = async () => {
    if (!selectedAsset || !selectedProfile) {
      toast.error('Selecciona un equipo y un empleado');
      return;
    }

    try {
      const asset = assets.find(a => String(a.id) === selectedAsset);
      const profile = profiles.find(p => String(p.id) === selectedProfile);
      
      if (!asset || !profile) return;

      const assignedDate = new Date().toISOString().split('T')[0];

      // Create assignment
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          asset_id: asset.id,
          profile_id: profile.id,
          assigned_date: assignedDate,
          included_accessories: selectedAccessories as any,
          notes: assignmentNotes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update asset status and assigned_to
      await supabase
        .from('assets')
        .update({ 
          status: 'asignado',
          assigned_to: profile.email,
          assignment_date: assignedDate
        })
        .eq('id', asset.id);

      // Generate PDF
      const doc = generatePDF(asset, profile, selectedAccessories, assignedDate);
      const pdfBlob = doc.output('blob');
      const fileName = `entrega_${asset.serial_number}_${Date.now()}.pdf`;
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Entrega creada y PDF generado');
      setAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Error al crear la entrega');
    }
  };

  const resetForm = () => {
    setSelectedAsset('');
    setSelectedProfile('');
    setSelectedAccessories([]);
    setAssignmentNotes('');
  };

  const handleReturnDevice = async (assignment: AssignmentWithDetails) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Close assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({ return_date: today })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      // Set asset to stock
      if (assignment.asset_id) {
        const { error: assetError } = await supabase
          .from('assets')
          .update({ status: 'stock', assigned_to: null, assignment_date: null })
          .eq('id', assignment.asset_id);

        if (assetError) throw assetError;
      }

      toast.success('Dispositivo devuelto. Estado: En Stock');
      fetchData();
    } catch (error) {
      console.error('Error returning device:', error);
      toast.error('Error al registrar la devolución');
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.asset?.brand.toLowerCase().includes(term) ||
      a.asset?.model.toLowerCase().includes(term) ||
      a.asset?.serial_number.toLowerCase().includes(term) ||
      a.profile?.full_name.toLowerCase().includes(term)
    );
  });

  const activeAssignments = filteredAssignments.filter(a => !a.return_date);
  const historicAssignments = filteredAssignments.filter(a => a.return_date);

  const availableAssets = assets.filter(a => a.status === 'stock');

  if (!isAdmin) {
    return <Navigate to="/my-devices" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Entregas</h1>
          <p className="text-muted-foreground">Asigna equipos a empleados</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Entrega
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por equipo o empleado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Active Assignments */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Asignaciones Activas</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activeAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay asignaciones activas
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAssignments.map((assignment) => {
              const includedAccessories = (assignment.included_accessories || []) as string[];
              return (
                <Card key={assignment.id} className="hover:shadow-card transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {assignment.asset?.device_type === 'portatil' ? (
                          <Laptop className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-base">
                            {assignment.asset?.brand} {assignment.asset?.model}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            S/N: {assignment.asset?.serial_number}
                          </CardDescription>
                        </div>
                      </div>
                      {!assignment.signed && (
                        <Badge variant="outline" className="badge-pendiente">
                          Sin firmar
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.profile?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(assignment.assigned_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    {includedAccessories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {includedAccessories.map((acc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {acc}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => handleReturnDevice(assignment)}
                    >
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Registrar Devolución
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Historic Assignments */}
      {historicAssignments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Histórico de Entregas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historicAssignments.map((assignment) => (
              <Card key={assignment.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {assignment.asset?.device_type === 'portatil' ? (
                      <Laptop className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {assignment.asset?.brand} {assignment.asset?.model}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        S/N: {assignment.asset?.serial_number}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{assignment.profile?.full_name}</p>
                  <p>
                    {new Date(assignment.assigned_date).toLocaleDateString('es-ES')} → {' '}
                    {new Date(assignment.return_date!).toLocaleDateString('es-ES')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Assignment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Entrega de Equipo</DialogTitle>
            <DialogDescription>
              Asigna un equipo disponible a un empleado
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Equipo a entregar</Label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un equipo disponible" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay equipos disponibles
                    </SelectItem>
                  ) : (
                    availableAssets.map((asset) => (
                      <SelectItem key={asset.id} value={String(asset.id)}>
                        {asset.brand} {asset.model} ({asset.serial_number})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Empleado receptor</Label>
              <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={String(profile.id)}>
                      {profile.full_name} ({profile.department || 'Sin departamento'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Accesorios incluidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {accessories.map((acc) => (
                  <div key={acc.id} className="flex items-center gap-2">
                    <Checkbox
                      id={acc.id}
                      checked={selectedAccessories.includes(acc.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAccessories([...selectedAccessories, acc.name]);
                        } else {
                          setSelectedAccessories(
                            selectedAccessories.filter((a) => a !== acc.name)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={acc.id} className="cursor-pointer text-sm">
                      {acc.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAssignment} disabled={!selectedAsset || !selectedProfile}>
              <Download className="h-4 w-4 mr-2" />
              Crear y Generar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
