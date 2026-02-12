// Custom types for Supabase tables - matching English column names
export type AssetType = 'portatil' | 'movil' | 'raton' | 'maletin' | 'auriculares' | 'tablet' | 'memoria' | 'teclado' | 'monitor';
export type AssetStatus = 'stock' | 'asignado' | 'baja';
export type RequestStatus = 'pendiente' | 'aprobado' | 'rechazado';
export type AppRole = 'admin' | 'user';

export interface Profile {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Accessory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Asset {
  id: number;
  device_type: AssetType;
  brand: string;
  model: string;
  serial_number: string;
  imei: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  status: AssetStatus;
  needs_renewal: boolean;
  notes: string | null;
  assigned_to: string | null;
  assignment_date: string | null;
  accessories_stock: any | null;
  created_at: string;
  specifications: string | null;
  updated_at: string;
}

export interface Assignment {
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
  created_at: string;
  updated_at: string;
}

export interface AssignmentWithDetails extends Assignment {
  asset?: Asset;
  profile?: Profile;
}

export interface Request {
  id: string;
  profile_id: string;
  material_type: string;
  justification: string;
  status: RequestStatus;
  request_date: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestWithProfile extends Request {
  profile?: Profile;
}

// Dashboard KPIs
export interface DashboardKPIs {
  gastoTotalAnual: number;
  equiposStock: number;
  equiposAsignados: number;
  equiposBaja: number;
  equiposRenovacion: number;
  solicitudesPendientes: number;
}
