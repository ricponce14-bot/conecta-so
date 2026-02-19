-- ================================================
-- CONNECTA OPERATING SYSTEM 2026
-- Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'VENDEDOR')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'VENDEDOR')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. EXPO LEADS TABLE
CREATE TABLE expo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  contacto_nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  ciudad TEXT,
  giro TEXT,
  vendedor_id UUID REFERENCES profiles(id),
  estado TEXT NOT NULL DEFAULT 'LEAD' CHECK (estado IN ('LEAD', 'CONTACTADO', 'PROPUESTA', 'NEGOCIACION', 'CERRADO', 'PERDIDO')),
  precio_stand DECIMAL(12,2) DEFAULT 0,
  anticipo_requerido DECIMAL(12,2) GENERATED ALWAYS AS (precio_stand * 0.5) STORED,
  monto_pagado DECIMAL(12,2) DEFAULT 0,
  anticipo_pagado BOOLEAN DEFAULT FALSE,
  fecha_ultimo_contacto DATE,
  fecha_proxima_accion DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SPONSOR LEADS TABLE
CREATE TABLE sponsor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  contacto TEXT NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'ALIADO' CHECK (nivel IN ('ORO', 'PLATA', 'ALIADO')),
  valor_total DECIMAL(12,2) DEFAULT 0,
  vendedor_id UUID REFERENCES profiles(id),
  estado TEXT NOT NULL DEFAULT 'PROSPECTO' CHECK (estado IN ('PROSPECTO', 'NEGOCIACION', 'CERRADO', 'PERDIDO')),
  monto_pagado DECIMAL(12,2) DEFAULT 0,
  anticipo_pagado BOOLEAN DEFAULT FALSE,
  fecha_seguimiento DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TICKETS TABLE
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  generales_vendidos INTEGER DEFAULT 0,
  vip_vendidos INTEGER DEFAULT 0,
  consumo_estimado DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COSTS TABLE
CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto TEXT NOT NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  pagado DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PRE-LOAD FIXED COSTS (525,100 MXN baseline)
-- ================================================
INSERT INTO costs (concepto, total, pagado) VALUES
  ('Talento', 263600, 0),
  ('Venue', 75500, 0),
  ('Sonido', 30000, 0),
  ('Operativos', 121000, 0),
  ('Día adicional', 35000, 0);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expo_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- EXPO_LEADS policies
CREATE POLICY "Admins can do everything with expo_leads"
  ON expo_leads FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Vendedores can view own expo_leads"
  ON expo_leads FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid() OR is_admin());

CREATE POLICY "Vendedores can insert expo_leads"
  ON expo_leads FOR INSERT TO authenticated
  WITH CHECK (vendedor_id = auth.uid() OR is_admin());

CREATE POLICY "Vendedores can update own expo_leads"
  ON expo_leads FOR UPDATE TO authenticated
  USING (vendedor_id = auth.uid() OR is_admin());

-- SPONSOR_LEADS policies
CREATE POLICY "Admins can do everything with sponsor_leads"
  ON sponsor_leads FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Vendedores can view own sponsor_leads"
  ON sponsor_leads FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid() OR is_admin());

CREATE POLICY "Vendedores can insert sponsor_leads"
  ON sponsor_leads FOR INSERT TO authenticated
  WITH CHECK (vendedor_id = auth.uid() OR is_admin());

CREATE POLICY "Vendedores can update own sponsor_leads"
  ON sponsor_leads FOR UPDATE TO authenticated
  USING (vendedor_id = auth.uid() OR is_admin());

-- TICKETS policies (admin full, vendedor read-only)
CREATE POLICY "Admins full access tickets"
  ON tickets FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Vendedores can view tickets"
  ON tickets FOR SELECT TO authenticated USING (true);

-- COSTS policies (admin full, vendedor read-only)
CREATE POLICY "Admins full access costs"
  ON costs FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Vendedores can view costs"
  ON costs FOR SELECT TO authenticated USING (true);
