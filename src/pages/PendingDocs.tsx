import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  Upload, 
  FileText,
  Laptop,
  Smartphone,
  User,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import type { AssignmentWithDetails, Asset, Profile } from '@/lib/supabase-types';
import { toast } from 'sonner';

export default function PendingDocs() {
  const { isAdmin } = useAuth();
  const [pendingAssignments, setPendingAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithDetails | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingDocs();
    }
  }, [isAdmin]);

  const fetchPendingDocs = async () => {
    try {
      // Fetch assignments without signed documents
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .is('return_date', null)
        .or('signed.eq.false,pdf_document_url.is.null')
        .order('assigned_date', { ascending: false });

      // Fetch assets
      const { data: assetsData } = await supabase
        .from('assets')
        .select('*');

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      if (assignmentsData && assetsData && profilesData) {
        const enrichedAssignments = assignmentsData.map(a => ({
          ...a,
          included_accessories: (a.included_accessories || []) as string[],
          asset: assetsData.find(asset => asset.id === a.asset_id) as Asset,
          profile: profilesData.find(profile => profile.id === a.profile_id) as Profile,
        }));
        setPendingAssignments(enrichedAssignments as AssignmentWithDetails[]);
      }
    } catch (error) {
      console.error('Error fetching pending docs:', error);
      toast.error('Error al cargar documentos pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede superar 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedAssignment) return;

    setUploading(true);

    try {
      const fileName = `${selectedAssignment.id}_${Date.now()}.pdf`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Store only the filename (not a public URL)
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          pdf_document_url: fileName,
          signed: true,
        })
        .eq('id', selectedAssignment.id);

      if (updateError) throw updateError;

      toast.success('Documento subido correctamente');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedAssignment(null);
      fetchPendingDocs();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/my-devices" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Documentación Pendiente</h1>
        <p className="text-muted-foreground">
          Entregas que requieren el documento firmado
        </p>
      </div>

      {/* Stats */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <p>
              <span className="font-semibold">{pendingAssignments.length}</span> entrega(s)
              pendiente(s) de documentación firmada
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : pendingAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-medium">Todo en orden</h3>
            <p className="text-muted-foreground">
              No hay documentos pendientes de firma
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingAssignments.map((assignment) => {
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
                    <Badge variant="outline" className="badge-pendiente">
                      Pendiente
                    </Badge>
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
                      Entregado el{' '}
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
                    className="w-full mt-2"
                    variant="outline"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setUploadDialogOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Documento Firmado
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Documento Firmado</DialogTitle>
            <DialogDescription>
              Sube el PDF escaneado con las firmas del empleado y del responsable IT
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedAssignment.asset?.device_type === 'portatil' ? (
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {selectedAssignment.asset?.brand} {selectedAssignment.asset?.model}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Asignado a: {selectedAssignment.profile?.full_name}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pdf-file">Archivo PDF</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? 'Subiendo...' : 'Subir Documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
