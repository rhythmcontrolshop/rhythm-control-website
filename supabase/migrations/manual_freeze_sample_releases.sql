-- freeze_sample_releases.sql
-- Congela las primeras 200 releases activas como datos locales de demo.
-- Reasigna discogs_listing_id al rango 9000+ para que el sync de Discogs
-- no las toque ni las marque como sold.
--
-- ANTES DE EJECUTAR:
--   1. Hacer backup: EXPORTAR releases a CSV desde Supabase Dashboard
--   2. Opcional: ejecutar enrich primero (POST /api/admin/enrich) para
--      que las 200 tengan tracklist y notas completas
--
-- DESPUÉS DE EJECUTAR:
--   1. Verificar con: SELECT count(*), min(discogs_listing_id), max(discogs_listing_id)
--      FROM releases WHERE status = 'active';
--   2. El sync de Discogs ya no afecta a estos releases
--   3. Puedes configurar un token de cuenta vacía sin riesgo

BEGIN;

-- 1. Encontrar el ID máximo en el rango mock (para no colisionar)
SELECT COALESCE(MAX(discogs_listing_id), 8999) INTO _max_mock_id
FROM releases
WHERE discogs_listing_id >= 9000;

-- Crear tabla temporal con los 200 releases a congelar
-- (ordenados por created_at para coger los más antiguos primero = stock real)
CREATE TEMP TABLE _to_freeze AS
SELECT
  id,
  discogs_listing_id AS old_listing_id,
  discogs_release_id
FROM releases
WHERE status = 'active'
  AND discogs_listing_id < 9000  -- solo releases reales de Discogs
ORDER BY created_at ASC
LIMIT 200;

-- 2. Reasignar discogs_listing_id al rango mock
-- Usamos ROW_NUMBER() para generar IDs secuenciales únicos
UPDATE releases r
SET discogs_listing_id = f.new_listing_id
FROM (
  SELECT
    id,
    (_max_mock_id + ROW_NUMBER() OVER (ORDER BY old_listing_id))::bigint AS new_listing_id
  FROM _to_freeze
) f
WHERE r.id = f.id;

-- 3. Resultado
DO $$
DECLARE
  _count   int;
  _min_id  bigint;
  _max_id  bigint;
BEGIN
  SELECT count(*), min(discogs_listing_id), max(discogs_listing_id)
  INTO _count, _min_id, _max_id
  FROM _to_freeze;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'FREEZE COMPLETADO: % releases congelados', _count;
  RAISE NOTICE 'Rango de IDs nuevos: % a %', _min_id, _max_id;
  RAISE NOTICE 'Estos releases ya NO serán afectados por el sync de Discogs.';
  RAISE NOTICE '========================================';
END $$;

-- Limpiar
DROP TABLE _to_freeze;

COMMIT;
