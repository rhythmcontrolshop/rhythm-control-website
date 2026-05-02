-- ============================================================
-- RHYTHM CONTROL — Migration 005: reserva atómica de stock
-- ============================================================

-- reserve_releases: intenta reservar todos los releases en una sola
-- operación. Si alguno no está 'active', no reserva ninguno y devuelve ok=false.
-- Usa CTE con RETURNING para saber exactamente qué filas se actualizaron,
-- evitando la ventana de race condition del patrón SELECT + UPDATE.

CREATE OR REPLACE FUNCTION reserve_releases(p_release_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  reserved_ids uuid[];
BEGIN
  WITH updated AS (
    UPDATE releases
    SET status = 'reserved'
    WHERE id = ANY(p_release_ids)
      AND status = 'active'
    RETURNING id
  )
  SELECT array_agg(id) INTO reserved_ids FROM updated;

  -- Todos reservados correctamente
  IF array_length(reserved_ids, 1) IS NOT DISTINCT FROM array_length(p_release_ids, 1) THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  -- Reserva parcial: revertir solo los que acabamos de cambiar
  IF reserved_ids IS NOT NULL THEN
    UPDATE releases SET status = 'active' WHERE id = ANY(reserved_ids);
  END IF;

  RETURN jsonb_build_object('ok', false);
END;
$$;


-- unreserve_releases: libera releases reservados en caso de error
-- tras una reserva atómica (Stripe falla, order no se crea, etc.)

CREATE OR REPLACE FUNCTION unreserve_releases(p_release_ids uuid[])
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE releases
  SET status = 'active'
  WHERE id = ANY(p_release_ids)
    AND status = 'reserved';
END;
$$;
