-- supabase/migrations/009_redsys_migration.sql
-- Migración de Stripe a Redsys — añade campos necesarios

-- ─── Añadir campos de Redsys a la tabla orders ─────────────────────────────

-- Proveedor de pago (redsys | stripe)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'stripe';

-- Referencia de orden en Redsys (Ds_Order) — para buscar la orden al recibir IPN
ALTER TABLE orders ADD COLUMN IF NOT EXISTS redsys_order_ref text;

-- Código de autorización de Redsys
ALTER TABLE orders ADD COLUMN IF NOT EXISTS redsys_authorisation_code text;

-- Teléfono del cliente (ahora lo recogemos en checkout propio)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;

-- Fecha de pago confirmado
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Índice para buscar órdenes por referencia Redsys (usado en IPN)
CREATE INDEX IF NOT EXISTS idx_orders_redsys_order_ref ON orders (redsys_order_ref);

-- ─── Tabla de notificaciones Redsys (idempotencia, como stripe_events) ──────

CREATE TABLE IF NOT EXISTS redsys_notifications (
  id text PRIMARY KEY,                -- ID único: Ds_Order_Ds_Response_Ds_Date_Ds_Hour
  ds_order text NOT NULL,
  ds_response text NOT NULL,
  ds_amount text,
  ds_authorisation_code text,
  ds_date text,
  ds_hour text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redsys_notifications_ds_order ON redsys_notifications (ds_order);

-- ─── Renombrar "Click & Collect" a "GUARDI (Click&Collect)" en shipping_rates ─

UPDATE shipping_rates
SET name = 'GUARDI (Click&Collect)',
    description = 'Recoge tu pedido en nuestra tienda de Barcelona'
WHERE method = 'click_collect';

-- ─── Deprecar tabla reservations (todo pasará por orders con pago) ──────────
-- No borramos la tabla para mantener datos históricos, pero marcamos como obsoleta
COMMENT ON TABLE reservations IS 'DEPRECATED: Use orders with shipping_method=click_collect instead. New reservations should go through paid checkout.';

-- ─── RLS para redsys_notifications ─────────────────────────────────────────

ALTER TABLE redsys_notifications ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer notificaciones
CREATE POLICY "Admins can read redsys_notifications"
  ON redsys_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- El webhook (service_role) puede insertar
CREATE POLICY "Service role can insert redsys_notifications"
  ON redsys_notifications
  FOR INSERT
  WITH CHECK (true);
