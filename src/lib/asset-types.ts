import type { Asset, AssetType, AssetStatus } from '@/lib/supabase-types';
import type { Json } from '@/integrations/supabase/types';

// Extended Asset type with additional fields from database
export interface AssetWithDetails extends Asset {
  // All fields are already in Asset with English names
}

export interface AccessoryItem {
  id: string;
  name: string;
  included?: boolean;
}

export interface AssignmentRecord {
  id: number;
  asset_id: number | null;
  profile_id: number | null;
  assigned_date: string;
  return_date: string | null;
  pdf_document_url: string | null;
  signed: boolean;
  included_accessories: string[] | null;
  notes: string | null;
  employee_name: string | null;
  employee_email: string | null;
  client_name: string | null;
  profile?: {
    full_name: string;
    email: string;
    department: string | null;
  };
}

export const statusLabels: Record<AssetStatus, string> = {
  stock: 'En Stock',
  asignado: 'Asignado',
  baja: 'De Baja',
};

export const statusStyles: Record<AssetStatus, string> = {
  stock: 'badge-stock',
  asignado: 'badge-asignado',
  baja: 'badge-baja',
};

export const typeLabels: Record<AssetType, string> = {
  portatil: 'Portátil',
  movil: 'Móvil',
  raton: 'Ratón',
  maletin: 'Maletín',
  auriculares: 'Auriculares',
  tablet: 'Tablet',
  memoria: 'Memoria',
  teclado: 'Teclado',
  monitor: 'Monitor',
};
