-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create asset_type enum
CREATE TYPE public.asset_type AS ENUM ('portatil', 'movil');

-- Create asset_status enum
CREATE TYPE public.asset_status AS ENUM ('stock', 'asignado', 'baja');

-- Create request_status enum
CREATE TYPE public.request_status AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    departamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Create accessories table (catalog)
CREATE TABLE public.accessories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create assets table (inventory)
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo asset_type NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    numero_serie TEXT UNIQUE NOT NULL,
    imei TEXT,
    fecha_compra DATE,
    precio_compra DECIMAL(10,2),
    estado asset_status DEFAULT 'stock' NOT NULL,
    requiere_renovacion BOOLEAN DEFAULT false NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create assignments table (historical tracking)
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    fecha_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_devolucion DATE,
    pdf_document_url TEXT,
    signed BOOLEAN DEFAULT false NOT NULL,
    accesorios_incluidos JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create requests table
CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tipo_material TEXT NOT NULL,
    justificacion TEXT NOT NULL,
    estado request_status DEFAULT 'pendiente' NOT NULL,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    respuesta_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Create function to get user profile id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    USING (public.is_admin());

-- USER_ROLES POLICIES
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin());

-- ACCESSORIES POLICIES
CREATE POLICY "All authenticated users can view accessories"
    ON public.accessories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage accessories"
    ON public.accessories FOR ALL
    USING (public.is_admin());

-- ASSETS POLICIES
CREATE POLICY "All authenticated users can view assets"
    ON public.assets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can insert assets"
    ON public.assets FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update assets"
    ON public.assets FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Only admins can delete assets"
    ON public.assets FOR DELETE
    USING (public.is_admin());

-- ASSIGNMENTS POLICIES
CREATE POLICY "Users can view their own assignments or admins can view all"
    ON public.assignments FOR SELECT
    USING (
        public.is_admin() OR 
        profile_id = public.get_profile_id(auth.uid())
    );

CREATE POLICY "Only admins can create assignments"
    ON public.assignments FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update assignments"
    ON public.assignments FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Only admins can delete assignments"
    ON public.assignments FOR DELETE
    USING (public.is_admin());

-- REQUESTS POLICIES
CREATE POLICY "Users can view their own requests or admins can view all"
    ON public.requests FOR SELECT
    USING (
        public.is_admin() OR 
        profile_id = public.get_profile_id(auth.uid())
    );

CREATE POLICY "Authenticated users can create their own requests"
    ON public.requests FOR INSERT
    WITH CHECK (profile_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update their own pending requests or admins can update all"
    ON public.requests FOR UPDATE
    USING (
        public.is_admin() OR 
        (profile_id = public.get_profile_id(auth.uid()) AND estado = 'pendiente')
    );

CREATE POLICY "Users can delete their own pending requests or admins can delete all"
    ON public.requests FOR DELETE
    USING (
        public.is_admin() OR 
        (profile_id = public.get_profile_id(auth.uid()) AND estado = 'pendiente')
    );

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Admins can access all documents"
    ON storage.objects FOR ALL
    USING (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Users can view their own assignment documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.pdf_document_url LIKE '%' || storage.objects.name
            AND a.profile_id = public.get_profile_id(auth.uid())
        )
    );

-- Insert default accessories
INSERT INTO public.accessories (nombre, descripcion) VALUES
    ('Ratón', 'Ratón inalámbrico'),
    ('Mochila', 'Mochila para portátil'),
    ('Cargador', 'Cargador del equipo'),
    ('Teclado', 'Teclado externo'),
    ('Adaptador', 'Adaptador USB-C/HDMI');