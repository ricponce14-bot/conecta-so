-- ================================================
-- CONECTA 2026 — Migration v2
-- Territorial Sales, New Pipeline & Pricing
-- Run in Supabase SQL Editor (top to bottom)
-- ================================================

-- -----------------------------------------------
-- STEP 1: Add 'zona' column to both tables
-- -----------------------------------------------
ALTER TABLE expo_leads
  ADD COLUMN IF NOT EXISTS zona TEXT;

ALTER TABLE sponsor_leads
  ADD COLUMN IF NOT EXISTS zona TEXT;

-- -----------------------------------------------
-- STEP 2: Add 'tipo_stand' to expo_leads
-- -----------------------------------------------
ALTER TABLE expo_leads
  ADD COLUMN IF NOT EXISTS tipo_stand TEXT;

-- -----------------------------------------------
-- STEP 3: Add 'tipo_patrocinio' to sponsor_leads
-- -----------------------------------------------
ALTER TABLE sponsor_leads
  ADD COLUMN IF NOT EXISTS tipo_patrocinio TEXT;

-- -----------------------------------------------
-- STEP 4: Migrate existing 'estado' values
-- expo_leads: old → new pipeline
-- -----------------------------------------------
UPDATE expo_leads SET estado = 'Prospecto Nuevo'  WHERE estado = 'LEAD';
UPDATE expo_leads SET estado = 'Contactado'        WHERE estado = 'CONTACTADO';
UPDATE expo_leads SET estado = 'Cita Agendada'     WHERE estado = 'PROPUESTA';
UPDATE expo_leads SET estado = 'Negociación'       WHERE estado = 'NEGOCIACION';
UPDATE expo_leads SET estado = 'Cerrado Pagado'    WHERE estado = 'CERRADO';
UPDATE expo_leads SET estado = 'Perdido'           WHERE estado = 'PERDIDO';

-- sponsor_leads: old → new pipeline
UPDATE sponsor_leads SET estado = 'Prospecto Nuevo' WHERE estado = 'PROSPECTO';
UPDATE sponsor_leads SET estado = 'Contactado'       WHERE estado = 'CONTACTADO';
UPDATE sponsor_leads SET estado = 'Cita Agendada'    WHERE estado = 'PROPUESTA';
UPDATE sponsor_leads SET estado = 'Negociación'      WHERE estado = 'NEGOCIACION';
UPDATE sponsor_leads SET estado = 'Cerrado Pagado'   WHERE estado = 'CERRADO';
UPDATE sponsor_leads SET estado = 'Perdido'          WHERE estado = 'PERDIDO';

-- -----------------------------------------------
-- STEP 5: Update CHECK constraints on expo_leads
-- -----------------------------------------------
ALTER TABLE expo_leads DROP CONSTRAINT IF EXISTS expo_leads_estado_check;
ALTER TABLE expo_leads
  ADD CONSTRAINT expo_leads_estado_check
  CHECK (estado IN (
    'Prospecto Nuevo',
    'Contactado',
    'Cita Agendada',
    'Negociación',
    'Cerrado Pagado',
    'Perdido'
  ));

-- -----------------------------------------------
-- STEP 6: Update CHECK constraints on sponsor_leads
-- -----------------------------------------------
ALTER TABLE sponsor_leads DROP CONSTRAINT IF EXISTS sponsor_leads_estado_check;
ALTER TABLE sponsor_leads
  ADD CONSTRAINT sponsor_leads_estado_check
  CHECK (estado IN (
    'Prospecto Nuevo',
    'Contactado',
    'Cita Agendada',
    'Negociación',
    'Cerrado Pagado',
    'Perdido'
  ));

-- -----------------------------------------------
-- STEP 7: Update DEFAULT values for 'estado'
-- -----------------------------------------------
ALTER TABLE expo_leads
  ALTER COLUMN estado SET DEFAULT 'Prospecto Nuevo';

ALTER TABLE sponsor_leads
  ALTER COLUMN estado SET DEFAULT 'Prospecto Nuevo';

-- -----------------------------------------------
-- STEP 8: RPC — Get stats grouped by zone
-- Returns: zona, total_leads, cerrados, revenue_expo, revenue_sponsors
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION get_zone_stats()
RETURNS TABLE (
  zona          TEXT,
  total_expo    BIGINT,
  cerrados_expo BIGINT,
  revenue_expo  NUMERIC,
  total_sponsors    BIGINT,
  cerrados_sponsors BIGINT,
  revenue_sponsors  NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH zones AS (
    SELECT DISTINCT zona FROM expo_leads WHERE zona IS NOT NULL
    UNION
    SELECT DISTINCT zona FROM sponsor_leads WHERE zona IS NOT NULL
  ),
  expo_stats AS (
    SELECT
      zona,
      COUNT(*)                                                              AS total_expo,
      COUNT(*) FILTER (WHERE estado = 'Cerrado Pagado')                    AS cerrados_expo,
      COALESCE(SUM(precio_stand) FILTER (WHERE estado = 'Cerrado Pagado'), 0) AS revenue_expo
    FROM expo_leads
    WHERE zona IS NOT NULL
    GROUP BY zona
  ),
  sponsor_stats AS (
    SELECT
      zona,
      COUNT(*)                                                              AS total_sponsors,
      COUNT(*) FILTER (WHERE estado = 'Cerrado Pagado')                    AS cerrados_sponsors,
      COALESCE(SUM(valor_total) FILTER (WHERE estado = 'Cerrado Pagado'), 0) AS revenue_sponsors
    FROM sponsor_leads
    WHERE zona IS NOT NULL
    GROUP BY zona
  )
  SELECT
    z.zona,
    COALESCE(e.total_expo, 0)         AS total_expo,
    COALESCE(e.cerrados_expo, 0)      AS cerrados_expo,
    COALESCE(e.revenue_expo, 0)       AS revenue_expo,
    COALESCE(s.total_sponsors, 0)     AS total_sponsors,
    COALESCE(s.cerrados_sponsors, 0)  AS cerrados_sponsors,
    COALESCE(s.revenue_sponsors, 0)   AS revenue_sponsors
  FROM zones z
  LEFT JOIN expo_stats    e ON e.zona = z.zona
  LEFT JOIN sponsor_stats s ON s.zona = z.zona
  ORDER BY COALESCE(e.revenue_expo, 0) + COALESCE(s.revenue_sponsors, 0) DESC;
$$;

-- -----------------------------------------------
-- DONE — verify with:
-- SELECT * FROM expo_leads LIMIT 3;
-- SELECT * FROM sponsor_leads LIMIT 3;
-- SELECT * FROM get_zone_stats();
-- -----------------------------------------------
