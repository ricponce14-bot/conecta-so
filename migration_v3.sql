-- ================================================
-- CONECTA 2026 — Migration v3
-- Add zona_asignada to profiles (seller zone assignment)
-- Run in Supabase SQL Editor
-- ================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS zona_asignada TEXT;

-- RLS: admin can update any profile's zona_asignada
-- (existing policies allow admin to view all profiles; update is currently limited to own profile)
-- We add a policy so admin can update zona_asignada on any VENDEDOR profile

CREATE POLICY "Admins can update seller zone"
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Verify:
-- SELECT id, name, zona_asignada FROM profiles WHERE role = 'VENDEDOR';
