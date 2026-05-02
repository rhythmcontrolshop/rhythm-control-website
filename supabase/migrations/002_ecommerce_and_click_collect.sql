-- ============================================================
-- RHYTHM CONTROL — Migration 002: E-commerce + Click & Collect
-- Añade: reservations, orders, price_channels, shipping_rates,
--        columnas extendidas en releases y profiles
-- ============================================================

-- ── EXTENDER TABLA: releases ──────────────────────────────────
-- Añadir columnas que el código ya referencia pero no estaban en 001

ALTER TABLE releases ADD COLUMN IF NOT EXISTS back_cover_image    text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS bandcamp_album_id   text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS bandcamp_track_id   text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS youtube_track_ids   jsonb;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS discogs_tracklist   jsonb;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS discogs_notes       text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS artist_profile      text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS quantity            integer NOT NULL DEFAULT 1;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS barcode             text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS location            text;  -- ubicación física en tienda


-- ── EXTENDER TABLA: profiles ──────────────────────────────────
-- Columnas que ShippingAddressForm y UpdateProfileForm usan

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id        text;       -- NIF/CIF
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code  text DEFAULT 'ES';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role          text NOT NULL DEFAULT 'customer'
                          CHECK (role IN ('customer', 'admin'));

-- Trigger para calcular full_name automáticamente
CREATE OR REPLACE FUNCTION compute_full_name()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.full_name = TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  IF NEW.full_name = '' THEN NEW.full_name = NULL; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_full_name
  BEFORE INSERT OR UPDATE OF first_name, last_name ON profiles
  FOR EACH ROW EXECUTE FUNCTION compute_full_name();


-- ── TABLA: reservations ───────────────────────────────────────
-- Click & Collect — reserva con código de recogida

CREATE TABLE IF NOT EXISTS reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id      uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  customer_name   text NOT NULL,
  customer_phone  text NOT NULL,
  customer_email  text NOT NULL,                          -- obligatorio para enviar código
  pickup_code     text NOT NULL UNIQUE,                   -- formato RC-XXXXX
  expires_at      timestamptz NOT NULL,                   -- 72h desde creación
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'collected', 'cancelled', 'expired')),
  confirmed_at    timestamptz,
  collected_at    timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservations_pickup_code_idx ON reservations(pickup_code);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status);
CREATE INDEX IF NOT EXISTS reservations_expires_idx ON reservations(expires_at);


-- ── TABLA: price_channels ─────────────────────────────────────
-- Canales de precio con coeficientes ajustables desde admin
-- Físico (x0.95), Online (x1.05), Discogs (x1.10)

CREATE TABLE IF NOT EXISTS price_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,             -- 'physical', 'online', 'discogs'
  name        text NOT NULL,                     -- 'Tienda física', 'Tienda online', 'Discogs'
  coefficient numeric(6,4) NOT NULL DEFAULT 1.0, -- multiplicador sobre price base
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES profiles(id)
);

-- Valores iniciales
INSERT INTO price_channels (slug, name, coefficient, sort_order) VALUES
  ('physical', 'Tienda física',  0.9500, 1),
  ('online',   'Tienda online',  1.0500, 2),
  ('discogs',  'Discogs',        1.1000, 3)
ON CONFLICT (slug) DO NOTHING;

CREATE TRIGGER price_channels_updated_at
  BEFORE UPDATE ON price_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── TABLA: shipping_rates ─────────────────────────────────────
-- Tarifas de envío gestionables desde admin
-- Inspirado en Packlink: envío a domicilio o recogida en oficina de correos

CREATE TABLE IF NOT EXISTS shipping_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,                        -- 'Estándar Península', 'Express', 'Correos Oficina'
  description     text,                                 -- '3-5 días laborables'
  zone            text NOT NULL DEFAULT 'es_peninsula', -- zona geográfica
  method          text NOT NULL DEFAULT 'home_delivery'
                  CHECK (method IN ('home_delivery', 'post_office', 'click_collect')),
  carrier         text,                                 -- 'Correos', 'SEUR', 'MRW', etc.
  min_weight_kg   numeric(6,2) NOT NULL DEFAULT 0,
  max_weight_kg   numeric(6,2) NOT NULL DEFAULT 2,
  price           numeric(8,2) NOT NULL,                -- tarifa en EUR
  free_above      numeric(8,2),                         -- envío gratuito si pedido > X
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Tarifas iniciales para España
INSERT INTO shipping_rates (name, description, zone, method, carrier, min_weight_kg, max_weight_kg, price, free_above, sort_order) VALUES
  ('Estándar Península',   '3-5 días laborables',    'es_peninsula', 'home_delivery', 'Correos', 0, 2, 4.50, 50.00, 1),
  ('Express Península',    '24-48h laborables',      'es_peninsula', 'home_delivery', 'MRW',     0, 2, 7.90, NULL,   2),
  ('Recogida Oficina',     '5-7 días, en oficina',   'es_peninsula', 'post_office',   'Correos', 0, 2, 3.90, 50.00, 3),
  ('Baleares',             '5-7 días laborables',     'es_baleares',  'home_delivery', 'Correos', 0, 2, 6.50, 80.00, 4),
  ('Portugal',             '5-7 días laborables',     'pt',           'home_delivery', 'SEUR',    0, 2, 7.00, 80.00, 5),
  ('UE Resto',             '7-14 días laborables',    'eu',           'home_delivery', 'Correos', 0, 2, 12.00, NULL,  6),
  ('Click & Collect',      'Recogida en tienda BCN',  'es_barcelona', 'click_collect', NULL,      0, 99, 0.00,  NULL,  0)
ON CONFLICT DO NOTHING;

CREATE TRIGGER shipping_rates_updated_at
  BEFORE UPDATE ON shipping_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── TABLA: orders ─────────────────────────────────────────────
-- Pedidos online (pago con Stripe)

CREATE TABLE IF NOT EXISTS orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text UNIQUE NOT NULL,              -- formato RC-XXXXX (auto)
  user_id             uuid REFERENCES profiles(id) ON DELETE SET NULL,
  -- Datos de contacto (snapshot al hacer pedido)
  customer_email      text NOT NULL,
  customer_name       text NOT NULL,
  customer_phone      text,
  -- Dirección de envío
  shipping_address    jsonb,                             -- { address, city, postalCode, province, countryCode }
  shipping_method     text,                              -- 'home_delivery' | 'post_office' | 'click_collect'
  shipping_rate_id    uuid REFERENCES shipping_rates(id),
  shipping_cost       numeric(8,2) NOT NULL DEFAULT 0,
  -- Canal de precio
  price_channel       text NOT NULL DEFAULT 'online',    -- 'physical' | 'online' | 'discogs'
  -- Totales
  subtotal            numeric(10,2) NOT NULL,            -- sin IVA
  tax_rate            numeric(5,4) NOT NULL DEFAULT 0.04,-- IVA superreducido 4% (vinilos)
  tax_amount          numeric(10,2) NOT NULL,
  total               numeric(10,2) NOT NULL,            -- subtotal + tax + shipping
  -- Stripe
  stripe_session_id   text UNIQUE,
  stripe_payment_intent text,
  payment_status      text NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  -- Pickup (Click & Collect)
  pickup_code         text UNIQUE,                       -- solo si shipping_method = click_collect
  -- Estado del pedido
  status              text NOT NULL DEFAULT 'created'
                      CHECK (status IN ('created', 'processing', 'shipped', 'delivered', 'collected', 'cancelled')),
  tracking_number     text,
  tracking_url        text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Generar order_number automáticamente
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  num integer;
  code text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS integer)), 0) + 1 INTO num
    FROM orders WHERE order_number ~ '^RC-\d{5}$';
  code := 'RC-' || LPAD(num::text, 5, '0');
  RETURN code;
END;
$$;

CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS orders_pickup_code_idx ON orders(pickup_code);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── TABLA: order_items ────────────────────────────────────────
-- Líneas de pedido (snapshot del precio al comprar)

CREATE TABLE IF NOT EXISTS order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  release_id      uuid REFERENCES releases(id) ON DELETE SET NULL,
  -- Snapshot del producto al hacer pedido
  title           text NOT NULL,
  artists         text[] NOT NULL DEFAULT '{}',
  condition       text,
  cover_image     text,
  price_base      numeric(10,2) NOT NULL,    -- precio base (Discogs)
  price_channel   numeric(10,2) NOT NULL,    -- precio con coeficiente de canal
  quantity        integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);


-- ── TABLA: pos_sales ──────────────────────────────────────────
-- Ventas en tienda (POS — Point of Sale)

CREATE TABLE IF NOT EXISTS pos_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     text UNIQUE NOT NULL,              -- formato POS-XXXXX
  operator_id     uuid REFERENCES profiles(id),       -- quien hace la venta
  -- Totales
  subtotal        numeric(10,2) NOT NULL,
  tax_rate        numeric(5,4) NOT NULL DEFAULT 0.04,
  tax_amount      numeric(10,2) NOT NULL,
  total           numeric(10,2) NOT NULL,
  -- Método de pago en tienda
  payment_method  text NOT NULL DEFAULT 'cash'
                  CHECK (payment_method IN ('cash', 'card', 'bizum')),
  -- Cliente (opcional — si se identifica)
  customer_email  text,
  customer_name   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION generate_pos_sale_number()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  num integer;
  code text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 5) AS integer)), 0) + 1 INTO num
    FROM pos_sales WHERE sale_number ~ '^POS-\d{5}$';
  code := 'POS-' || LPAD(num::text, 5, '0');
  RETURN code;
END;
$$;


-- ── TABLA: pos_sale_items ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS pos_sale_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_sale_id     uuid NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  release_id      uuid REFERENCES releases(id) ON DELETE SET NULL,
  title           text NOT NULL,
  artists         text[] NOT NULL DEFAULT '{}',
  condition       text,
  price_base      numeric(10,2) NOT NULL,
  price_channel   numeric(10,2) NOT NULL,    -- con coeficiente physical
  quantity        integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pos_sale_items_sale_idx ON pos_sale_items(pos_sale_id);


-- ── ROW LEVEL SECURITY — Nuevas tablas ────────────────────────

ALTER TABLE reservations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sale_items ENABLE ROW LEVEL SECURITY;

-- Reservations: lectura propia (por email), admin via service_role
CREATE POLICY "reservations_own_read" ON reservations
  FOR SELECT USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Price channels: lectura pública (para calcular precios), escritura solo admin
CREATE POLICY "price_channels_public_read" ON price_channels
  FOR SELECT USING (is_active = true);

-- Shipping rates: lectura pública, escritura solo admin
CREATE POLICY "shipping_rates_public_read" ON shipping_rates
  FOR SELECT USING (is_active = true);

-- Orders: lectura propia, creación autenticada, admin via service_role
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_own_insert" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Order items: lectura a través de orders
CREATE POLICY "order_items_via_order" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- POS: solo admin via service_role
-- (sin policies = solo accesible con service_role key)

-- ── ÍNDICES ADICIONALES ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS releases_barcode_idx ON releases(barcode);
CREATE INDEX IF NOT EXISTS releases_quantity_idx ON releases(quantity) WHERE quantity > 0;
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
