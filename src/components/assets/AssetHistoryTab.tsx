import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, ArrowRight, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssignmentRecord } from '@/lib/asset-types';

interface AssetHistoryTabProps {
  assetId: number;
}

export function AssetHistoryTab({ assetId }: AssetHistoryTabProps) {
  const [history, setHistory] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [assetId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          profile:profiles!assignments_profile_id_fkey(full_name, email, department)
        `)
        .eq('asset_id', assetId)
        .order('assigned_date', { ascending: false });

      if (error) throw error;

      setHistory((data as unknown as AssignmentRecord[]) || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">Historial de Custodia</CardTitle>
        <CardDescription>
          Registro completo de todas las personas que han tenido este dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay historial de custodia registrado</p>
            <p className="text-sm mt-1">
              Las asignaciones y devoluciones aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {history.map((record, index) => {
                const isActive = !record.return_date && index === 0;
                return (
                  <div key={record.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className={`
                      relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground border-2 border-border'
                      }
                    `}>
                      <User className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="font-medium">
                          {record.employee_name || record.profile?.full_name || record.employee_email || record.profile?.email || 'Usuario desconocido'}
                        </span>
                        {record.client_name && (
                          <span className="text-sm text-muted-foreground">
                            · {record.client_name}
                          </span>
                        )}
                        {record.profile?.department && (
                          <span className="text-sm text-muted-foreground">
                            ({record.profile.department})
                          </span>
                        )}
                        {isActive ? (
                          <Badge variant="default" className="w-fit text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            En custodia
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Devuelto
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(record.assigned_date)}</span>
                        {record.return_date && (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            <span>{formatDate(record.return_date)}</span>
                          </>
                        )}
                      </div>

                      {record.notes && (
                        <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
