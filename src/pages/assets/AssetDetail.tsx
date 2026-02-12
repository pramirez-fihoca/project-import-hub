import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { AssetWithDetails } from '@/lib/asset-types';
import { toast } from 'sonner';

// Tab components
import { AssetGeneralTab } from '@/components/assets/AssetGeneralTab';
import { AssetAssignmentTab } from '@/components/assets/AssetAssignmentTab';
import { AssetHistoryTab } from '@/components/assets/AssetHistoryTab';
import { AssetDocumentsTab } from '@/components/assets/AssetDocumentsTab';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<AssetWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && isAdmin) {
      fetchAsset();
    }
  }, [id, isAdmin]);

  const fetchAsset = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', Number(id))
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error('Equipo no encontrado');
        navigate('/assets');
        return;
      }
      
      setAsset(data as AssetWithDetails);
    } catch (error) {
      console.error('Error fetching asset:', error);
      toast.error('Error al cargar el equipo');
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetUpdate = () => {
    fetchAsset();
  };

  if (!isAdmin) {
    return <Navigate to="/my-devices" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  const assetTitle = `${asset.brand} ${asset.model}`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={assetTitle}
        description={`S/N: ${asset.serial_number}`}
        breadcrumbs={[
          { label: 'Inventario', href: '/assets' },
          { label: assetTitle },
        ]}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="assignment">Asignación</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <AssetGeneralTab asset={asset} onUpdate={handleAssetUpdate} />
        </TabsContent>

        <TabsContent value="assignment">
          <AssetAssignmentTab asset={asset} onUpdate={handleAssetUpdate} />
        </TabsContent>

        <TabsContent value="history">
          <AssetHistoryTab assetId={asset.id} />
        </TabsContent>

        <TabsContent value="documents">
          <AssetDocumentsTab assetId={asset.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
