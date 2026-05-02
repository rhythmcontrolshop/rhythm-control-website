-- Migration 011: Cash register sessions + Spanish invoicing
--
-- 1. Cash register sessions (cierre de caja)
-- 2. Invoice numbers (numeración correlativa española)
-- 3. Fix pos_sales: add discount, cash_received, change, session_id

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CASH REGISTER SESSIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pos_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number  text NOT NULL UNIQUE,            -- SES-00001
  operator_id     uuid NOT NULL REFERENCES profiles(id),
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'closed', 'forced_close')),
  opened_at       timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  opening_cash    numeric(10,2) NOT NULL DEFAULT 0,  -- efectivo inicial en caja
  expected_cash   numeric(10,2),                       -- calculado al cerrar
  actual_cash     numeric(10,2),                       -- contado físicamente
  cash_difference numeric(10,2),                       -- actual - expected
  total_sales     integer NOT NULL DEFAULT 0,          -- nº de ventas
  total_cash      numeric(10,2) NOT NULL DEFAULT 0,   -- total cobrado en efectivo
  total_card      numeric(10,2) NOT NULL DEFAULT 0,   -- total cobrado en tarjeta
  total_bizum     numeric(10,2) NOT NULL DEFAULT 0,   -- total cobrado en bizum
  total_discount  numeric(10,2) NOT NULL DEFAULT 0,   -- descuentos aplicados
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pos_sessions" ON pos_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index: active session lookup
CREATE INDEX IF NOT EXISTS pos_sessions_operator_idx ON pos_sessions(operator_id);
CREATE INDEX IF NOT EXISTS pos_sessions_status_idx ON pos_sessions(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. INVOICES (Facturas españolas)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  text NOT NULL UNIQUE,              -- F-2026/00001
  invoice_type    text NOT NULL DEFAULT 'F'
                  CHECK (invoice_type IN ('F', 'R')), -- F=Factura, R=Rectificativa
  rectifies_id    uuid REFERENCES invoices(id),       -- solo para rectificativas

  -- Origen: puede ser un pedido online o una venta POS
  source_type     text NOT NULL CHECK (source_type IN ('order', 'pos_sale')),
  source_id       uuid NOT NULL,                      -- orders.id o pos_sales.id

  -- Datos del cliente
  customer_name   text,
  customer_nif    text,                               -- NIF/CIF del cliente
  customer_email  text,
  customer_address jsonb,                             -- dirección completa

  -- Datos del comercio
  seller_name     text NOT NULL DEFAULT 'Rhythm Control',
  seller_nif      text NOT NULL DEFAULT '',           -- NIF de la tienda (a configurar)
  seller_address  jsonb NOT NULL DEFAULT '{}',        -- dirección fiscal

  -- Totales
  subtotal        numeric(10,2) NOT NULL,
  tax_rate        numeric(5,4) NOT NULL DEFAULT 0.04,
  tax_amount      numeric(10,2) NOT NULL,
  discount_pct    numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total           numeric(10,2) NOT NULL,

  -- Líneas (detalle de la factura)
  lines           jsonb NOT NULL DEFAULT '[]',        -- [{title, artists, qty, price, channel, condition}]

  -- Estado
  status          text NOT NULL DEFAULT 'issued'
                  CHECK (status IN ('issued', 'cancelled', 'rectified')),
  issued_at       timestamptz NOT NULL DEFAULT now(),
  cancelled_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (
    customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS invoices_number_idx ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS invoices_source_idx ON invoices(source_type, source_id);
CREATE INDEX IF NOT EXISTS invoices_issued_idx ON invoices(issued_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FIX POS_SALES: add missing columns
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE pos_sales ADD COLUMN IF NOT EXISTS session_id     uuid REFERENCES pos_sessions(id);
ALTER TABLE pos_sales ADD COLUMN IF NOT EXISTS discount_pct   numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE pos_sales ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE pos_sales ADD COLUMN IF NOT EXISTS cash_received  numeric(10,2);
ALTER TABLE pos_sales ADD COLUMN IF NOT EXISTS change_amount  numeric(10,2);
ALTER TABLE pos_sales ADD COLUMN IF NOT EXISTS invoice_id     uuid REFERENCES invoices(id);

CREATE INDEX IF NOT EXISTS pos_sales_session_idx ON pos_sales(session_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ADD invoice_id to orders
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. SITE SETTINGS: seller fiscal data
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert default fiscal settings if site_settings exists
INSERT INTO site_settings (key, value) VALUES
  ('seller_nif', '"PENDIENTE"'),
  ('seller_address', '{"street": "", "city": "Barcelona", "postal_code": "", "province": "Barcelona", "country": "ES"}'),
  ('invoice_prefix', '"F"'),
  ('invoice_next_number', '1'),
  ('invoice_year', '2026'),
  ('pos_session_prefix', '"SES"'),
  ('pos_session_next_number', '1')
ON CONFLICT (key) DO NOTHING;
