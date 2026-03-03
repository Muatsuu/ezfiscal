
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Empresas table
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  endereco text,
  telefone text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 5. Empresa-users linking table
CREATE TABLE public.empresa_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, user_id)
);
ALTER TABLE public.empresa_users ENABLE ROW LEVEL SECURITY;

-- Security definer to check empresa membership
CREATE OR REPLACE FUNCTION public.is_empresa_member(_user_id uuid, _empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresa_users
    WHERE user_id = _user_id AND empresa_id = _empresa_id
  )
$$;

-- RLS for empresas
CREATE POLICY "Users can view their empresas" ON public.empresas
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.empresa_users WHERE empresa_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can manage empresas" ON public.empresas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for empresa_users
CREATE POLICY "Users can view own memberships" ON public.empresa_users
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage memberships" ON public.empresa_users
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 6. Add empresa_id to notas_fiscais
ALTER TABLE public.notas_fiscais ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

-- 7. Add empresa_id to fornecedores
ALTER TABLE public.fornecedores ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

-- 8. Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS for audit_logs
CREATE POLICY "Users can view audit logs of their empresas" ON public.audit_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.is_empresa_member(auth.uid(), empresa_id)
  );
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Update trigger for empresas
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Assign admin role to existing admin user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'enzokasma001@gmail.com'
ON CONFLICT DO NOTHING;

-- 11. Function to get user role (for frontend)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;
