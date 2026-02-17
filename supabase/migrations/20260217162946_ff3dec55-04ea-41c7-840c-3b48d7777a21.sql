
-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.asset_status AS ENUM ('stock', 'asignado', 'baja');
CREATE TYPE public.asset_type AS ENUM ('portatil', 'movil', 'raton', 'maletin', 'auriculares', 'tablet', 'memoria', 'teclado', 'monitor');
CREATE TYPE public.request_status AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Accessories table
CREATE TABLE public.accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Assets table
CREATE TABLE public.assets (
  id SERIAL PRIMARY KEY,
  device_type asset_type NOT NULL DEFAULT 'portatil',
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  imei TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  status asset_status NOT NULL DEFAULT 'stock',
  needs_renewal BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  assigned_to TEXT,
  assignment_date DATE,
  accessories_stock JSONB DEFAULT '[]'::jsonb,
  specifications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assignments table
CREATE TABLE public.assignments (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES public.assets(id) ON DELETE SET NULL,
  profile_id INTEGER REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  pdf_document_url TEXT,
  signed BOOLEAN NOT NULL DEFAULT false,
  included_accessories JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  client_name TEXT,
  employee_name TEXT,
  employee_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID,
  material_type TEXT NOT NULL,
  justification TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pendiente',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only admins manage, users can read own
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Accessories: all authenticated can read, admins manage
CREATE POLICY "Authenticated can view accessories" ON public.accessories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage accessories" ON public.accessories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Assets: all authenticated can read, admins manage
CREATE POLICY "Authenticated can view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage assets" ON public.assets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Assignments: all authenticated can read, admins manage
CREATE POLICY "Authenticated can view assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage assignments" ON public.assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Requests: users see own, admins see all
CREATE POLICY "Users can view own requests" ON public.requests FOR SELECT USING (auth.uid()::text = profile_id::text);
CREATE POLICY "Users can create requests" ON public.requests FOR INSERT WITH CHECK (auth.uid()::text = profile_id::text);
CREATE POLICY "Admins can manage requests" ON public.requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
