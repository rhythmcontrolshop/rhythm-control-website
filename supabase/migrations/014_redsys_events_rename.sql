-- 014_redsys_events_rename.sql
-- Renombrar redsys_notifications → redsys_events para consistencia con stripe_events
-- Añadir columna de auditoría de importe procesado

-- Renombrar tabla
ALTER TABLE redsys_notifications RENAME TO redsys_events;

-- Renombrar índice
ALTER INDEX idx_redsys_notifications_ds_order RENAME TO idx_redsys_events_ds_order;

-- Columna de auditoría: importe que Redsys reportó haber cobrado (en céntimos)
-- Permite comparar con order.total sin recalcular
ALTER TABLE redsys_events ADD COLUMN processed_amount_cents integer;

-- Columna para registrar resultado del procesamiento ('processed' | 'amount_mismatch' | 'order_not_found')
ALTER TABLE redsys_events ADD COLUMN processing_result text DEFAULT 'processed';

-- RLS: la política hereda con el rename, pero actualizamos el nombre para claridad
DROP POLICY "Admins can read redsys_notifications" ON redsys_events;
DROP POLICY "Service role can insert redsys_notifications" ON redsys_events;

CREATE POLICY "Admins can read redsys_events"
  ON redsys_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can insert redsys_events"
  ON redsys_events
  FOR INSERT
  WITH CHECK (true);
