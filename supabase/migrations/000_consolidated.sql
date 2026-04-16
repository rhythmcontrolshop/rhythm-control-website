-- ═══════════════════════════════════════════════════════════════════════════════
-- RHYTHM CONTROL — MIGRACIÓN CONSOLIDADA DEFINITIVA
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Este script consolida 001_initial + 002_ecommerce + v1_patches
-- Compatible con el código TypeScript actual del proyecto.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 0. EXTENSIONES ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. TABLA: releases ─────────────────────────────────────────────────────
-- Fuente: Discogs Marketplace. Precio base = lo que cuesta en Discogs.
CREATE TABLE IF NOT EXISTS releases (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discogs_listing_id   bigint UNIQUE NOT NULL,
  discogs_release_id   bigint NOT NULL,
  title                text NOT NULL,
  artists              text[] NOT NULL DEFAULT '{}',
  labels               text[] NOT NULL DEFAULT '{}',
  catno                text NOT NULL DEFAULT '',
  genres               text[] NOT NULL DEFAULT '{}',
  styles               text[] NOT NULL DEFAULT '{}',
  format               text NOT NULL DEFAULT '',
  year                 integer,
  country              text NOT NULL DEFAULT '',
  condition            text NOT NULL,
  sleeve_condition     text NOT NULL DEFAULT '',
  price                numeric(10,2) NOT NULL,           -- Precio base Discogs
  currency             text NOT NULL DEFAULT 'EUR',
  cover_image          text NOT NULL DEFAULT '',
  thumb                text NOT NULL DEFAULT '',
  -- Datos extendidos (Supabase enrichment)
  back_cover_image     text,
  bpm                  integer,
  key                  text,
  key_camelot          text,
  spotify_id           text,
  spotify_preview_url  text,
  youtube_id           text,
  youtube_track_ids    jsonb,
  bandcamp_album_id    text,
  bandcamp_track_id    text,
  discogs_tracklist    jsonb,
  discogs_notes        text,
  artist_profile       text,
  comments             text,
  -- Shopify (legacy)
  shopify_product_id   text,
  shopify_variant_id   text,
  -- Inventario
  quantity             integer NOT NULL DEFAULT 1,
  barcode              text,
  location             text,                              -- Ubicación física en tienda
  -- Estado
  status               text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'sold', 'reserved', 'hidden')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. TABLA: events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  venue        text NOT NULL,
  city         text NOT NULL,
  country      text NOT NULL DEFAULT 'ES',
  date         date NOT NULL,
  start_time   time NOT NULL,
  end_time     time,
  type         text NOT NULL DEFAULT 'dj_set'
               CHECK (type IN ('dj_set', 'live', 'release_party', 'in_store', 'other')),
  flyer_url    text,
  ticket_url   text,
  lineup       text[] NOT NULL DEFAULT '{}',
  description  text,
  is_featured  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. TABLA: labels ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS labels (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,
  logo_url          text,
  description       text,
  discogs_label_id  bigint,
  bandcamp_url      text,
  instagram_url     text,
  is_own_label      boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. TABLA: profiles ─────────────────────────────────────────────────────
-- Extiende auth.users de Supabase
CREATE TABLE IF NOT EXISTS profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text NOT NULL,
  username          text UNIQUE,
  avatar_url        text,
  city              text,
  country           text,
  discogs_username  text,
  instagram_handle  text,
  -- Campos extendidos para e-commerce
  first_name        text,
  last_name         text,
  full_name         text,
  phone             text,
  tax_id            text,                                 -- NIF/CIF
  address           text,
  postal_code       text,
  province          text,
  country_code      text DEFAULT 'ES',
  role              text NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('customer', 'admin')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. TABLA: wantlist ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wantlist (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discogs_release_id   bigint NOT NULL,
  title                text NOT NULL,
  artists              text[] NOT NULL DEFAULT '{}',
  cover_image          text NOT NULL DEFAULT '',
  added_at             timestamptz NOT NULL DEFAULT now(),
  notified             boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, discogs_release_id)
);

-- ─── 6. TABLA: track_requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS track_requests (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                text NOT NULL,
  artist               text NOT NULL,
  discogs_release_id   bigint,
  votes                integer NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open', 'found', 'ordered', 'available', 'closed')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── 7. TABLA: request_votes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES track_requests(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);

-- ─── 8. TABLA: sync_jobs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  items_processed   integer NOT NULL DEFAULT 0,
  items_total       integer NOT NULL DEFAULT 0,
  error             text,
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── 9. TABLA: reservations ─────────────────────────────────────────────────
-- Click & Collect — reserva con código de recogida
CREATE TABLE IF NOT EXISTS reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id      uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  customer_name   text NOT NULL,
  customer_phone  text NOT NULL,
  customer_email  text NOT NULL,
  pickup_code     text NOT NULL UNIQUE,
  expires_at      timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'collected', 'cancelled', 'expired')),
  confirmed_at    timestamptz,
  collected_at    timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 10. TABLA: price_channels ──────────────────────────────────────────────
-- Canales de precio con coeficientes ajustables desde admin
-- Físico (x0.95), Online (x1.05), Discogs (x1.10)
CREATE TABLE IF NOT EXISTS price_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,             -- 'physical', 'online', 'discogs'
  name        text NOT NULL,                     -- 'Tienda física', 'Tienda online', 'Discogs'
  coefficient numeric(6,4) NOT NULL DEFAULT 1.0, -- multiplicador sobre precio base
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

-- ─── 11. TABLA: shipping_rates ──────────────────────────────────────────────
-- Tarifas de envío gestionables desde admin
-- Inspirado en Packlink: envío a domicilio o recogida en oficina de correos
CREATE TABLE IF NOT EXISTS shipping_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  zone            text NOT NULL DEFAULT 'es_peninsula',
  method          text NOT NULL DEFAULT 'home_delivery'
                  CHECK (method IN ('home_delivery', 'post_office', 'click_collect')),
  carrier         text,
  min_weight_kg   numeric(6,2) NOT NULL DEFAULT 0,
  max_weight_kg   numeric(6,2) NOT NULL DEFAULT 2,
  price           numeric(8,2) NOT NULL,
  free_above      numeric(8,2),
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Tarifas iniciales para España
INSERT INTO shipping_rates (name, description, zone, method, carrier, min_weight_kg, max_weight_kg, price, free_above, sort_order) VALUES
  ('Click & Collect',      'Recogida en tienda BCN',  'es_barcelona', 'click_collect', NULL,      0, 99, 0.00,  NULL,  0),
  ('Estándar Península',   '3-5 días laborables',     'es_peninsula', 'home_delivery', 'Correos', 0, 2, 4.50, 50.00, 1),
  ('Express Península',    '24-48h laborables',       'es_peninsula', 'home_delivery', 'MRW',     0, 2, 7.90, NULL,   2),
  ('Recogida Oficina',     '5-7 días, en oficina',    'es_peninsula', 'post_office',   'Correos', 0, 2, 3.90, 50.00, 3),
  ('Baleares',             '5-7 días laborables',      'es_baleares',  'home_delivery', 'Correos', 0, 2, 6.50, 80.00, 4),
  ('Canarias',             '7-10 días laborables',     'es_canarias',  'home_delivery', 'Correos', 0, 2, 9.90, NULL,   5),
  ('Portugal',             '5-7 días laborables',      'pt',           'home_delivery', 'SEUR',    0, 2, 7.00, 80.00, 6),
  ('UE Resto',             '7-14 días laborables',     'eu',           'home_delivery', 'Correos', 0, 2, 12.00, NULL,  7)
ON CONFLICT DO NOTHING;

-- ─── 12. TABLA: orders ──────────────────────────────────────────────────────
-- Pedidos online (pago con Stripe)
CREATE TABLE IF NOT EXISTS orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text UNIQUE NOT NULL,
  user_id             uuid REFERENCES profiles(id) ON DELETE SET NULL,
  customer_email      text NOT NULL,
  customer_name       text NOT NULL,
  customer_phone      text,
  shipping_address    jsonb,
  shipping_method     text,
  shipping_rate_id    uuid REFERENCES shipping_rates(id),
  shipping_cost       numeric(8,2) NOT NULL DEFAULT 0,
  price_channel       text NOT NULL DEFAULT 'online',
  subtotal            numeric(10,2) NOT NULL,
  tax_rate            numeric(5,4) NOT NULL DEFAULT 0.04,
  tax_amount          numeric(10,2) NOT NULL,
  total               numeric(10,2) NOT NULL,
  stripe_session_id   text UNIQUE,
  stripe_payment_intent text,
  payment_status      text NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  pickup_code         text UNIQUE,
  status              text NOT NULL DEFAULT 'created'
                      CHECK (status IN ('created', 'processing', 'shipped', 'delivered', 'collected', 'cancelled')),
  tracking_number     text,
  tracking_url        text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── 13. TABLA: order_items ─────────────────────────────────────────────────
-- Líneas de pedido (snapshot del precio al comprar)
CREATE TABLE IF NOT EXISTS order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  release_id      uuid REFERENCES releases(id) ON DELETE SET NULL,
  title           text NOT NULL,
  artists         text[] NOT NULL DEFAULT '{}',
  condition       text,
  cover_image     text,
  price_base      numeric(10,2) NOT NULL,
  price_channel   numeric(10,2) NOT NULL,
  quantity        integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 14. TABLA: pos_sales ───────────────────────────────────────────────────
-- Ventas en tienda (POS — Point of Sale)
CREATE TABLE IF NOT EXISTS pos_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     text UNIQUE NOT NULL,
  operator_id     uuid REFERENCES profiles(id),
  subtotal        numeric(10,2) NOT NULL,
  tax_rate        numeric(5,4) NOT NULL DEFAULT 0.04,
  tax_amount      numeric(10,2) NOT NULL,
  total           numeric(10,2) NOT NULL,
  payment_method  text NOT NULL DEFAULT 'cash'
                  CHECK (payment_method IN ('cash', 'card', 'bizum')),
  customer_email  text,
  customer_name   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 15. TABLA: pos_sale_items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_sale_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_sale_id     uuid NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  release_id      uuid REFERENCES releases(id) ON DELETE SET NULL,
  title           text NOT NULL,
  artists         text[] NOT NULL DEFAULT '{}',
  condition       text,
  price_base      numeric(10,2) NOT NULL,
  price_channel   numeric(10,2) NOT NULL,
  quantity        integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 16. TABLA: discogs_sync_log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discogs_sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      integer NOT NULL,
  action          text NOT NULL CHECK (action IN ('created', 'updated', 'marked_sold', 'price_changed')),
  old_price       numeric(8,2),
  new_price       numeric(8,2),
  old_status      text,
  new_status      text,
  synced_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 17. TABLA: discogs_orders ──────────────────────────────────────────────
-- Órdenes recibidas a través de Discogs (sincronizadas vía API)
CREATE TABLE IF NOT EXISTS discogs_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discogs_order_id    integer NOT NULL UNIQUE,
  status              text NOT NULL DEFAULT 'new',
  buyer_username      text NOT NULL,
  buyer_email         text,
  total               numeric(8,2) NOT NULL,
  currency            text NOT NULL DEFAULT 'EUR',
  fee                 numeric(8,2),
  shipping_address    jsonb,
  notes               text,
  synced_at           timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── 18. TABLA: barcodes ────────────────────────────────────────────────────
-- Códigos de barras generados/asociados a releases
CREATE TABLE IF NOT EXISTS barcodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id      uuid NOT NULL REFERENCES releases(id),
  barcode         text NOT NULL UNIQUE,
  barcode_type    text NOT NULL DEFAULT 'ean13' CHECK (barcode_type IN ('ean13', 'qr', 'internal')),
  label           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 19. TABLA: recovery_tokens ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recovery_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  token       text NOT NULL UNIQUE,
  used        boolean NOT NULL DEFAULT false,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 20. SECUENCIA RC-XXXXX ─────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS rc_code_seq START 10000;

CREATE OR REPLACE FUNCTION generate_rc_code()
RETURNS text AS $$
BEGIN
  RETURN 'RC-' || nextval('rc_code_seq')::text;
END;
$$ LANGUAGE plpgsql;

-- ─── 21. TRIGGER: updated_at ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER releases_updated_at
  BEFORE UPDATE ON releases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER track_requests_updated_at
  BEFORE UPDATE ON track_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER price_channels_updated_at
  BEFORE UPDATE ON price_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shipping_rates_updated_at
  BEFORE UPDATE ON shipping_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 22. TRIGGER: full_name automático ──────────────────────────────────────
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

-- ─── 23. TRIGGER: auto-crear profile al registrarse ─────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- Eliminar si ya existe para evitar error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── 24. ROW LEVEL SECURITY ─────────────────────────────────────────────────

-- Activar RLS en todas las tablas
ALTER TABLE releases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wantlist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_channels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sale_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE discogs_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE discogs_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcodes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_tokens  ENABLE ROW LEVEL SECURITY;

-- ── Policies: releases ──────────────────────────────────────────────────────
CREATE POLICY "releases_public_read" ON releases
  FOR SELECT USING (status = 'active');

-- ── Policies: events, labels ────────────────────────────────────────────────
CREATE POLICY "events_public_read" ON events FOR SELECT USING (true);
CREATE POLICY "labels_public_read" ON labels FOR SELECT USING (true);

-- ── Policies: profiles ──────────────────────────────────────────────────────
CREATE POLICY "profiles_own_read"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── Policies: wantlist ──────────────────────────────────────────────────────
CREATE POLICY "wantlist_own" ON wantlist FOR ALL USING (auth.uid() = user_id);

-- ── Policies: track_requests ────────────────────────────────────────────────
CREATE POLICY "requests_public_read"  ON track_requests FOR SELECT USING (true);
CREATE POLICY "requests_own_insert"   ON track_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "requests_own_update"   ON track_requests FOR UPDATE USING (auth.uid() = user_id);

-- ── Policies: request_votes ─────────────────────────────────────────────────
CREATE POLICY "votes_public_read"   ON request_votes FOR SELECT USING (true);
CREATE POLICY "votes_own_insert"    ON request_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_own_delete"    ON request_votes FOR DELETE USING (auth.uid() = user_id);

-- ── Policies: reservations ──────────────────────────────────────────────────
-- Lectura: propio usuario por email (para Click & Collect sin auth)
-- Admin via service_role (no necesita policy)
CREATE POLICY "reservations_own_read" ON reservations
  FOR SELECT USING (
    customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- ── Policies: price_channels ────────────────────────────────────────────────
-- Lectura pública (para calcular precios en frontend)
CREATE POLICY "price_channels_public_read" ON price_channels
  FOR SELECT USING (is_active = true);
-- Admin: lectura completa + escritura via service_role

-- ── Policies: shipping_rates ────────────────────────────────────────────────
-- Lectura pública (para checkout)
CREATE POLICY "shipping_rates_public_read" ON shipping_rates
  FOR SELECT USING (is_active = true);

-- ── Policies: orders ────────────────────────────────────────────────────────
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_own_insert" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ── Policies: order_items ───────────────────────────────────────────────────
CREATE POLICY "order_items_via_order" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- ── Policies: pos_sales, pos_sale_items ─────────────────────────────────────
-- Solo accesible via service_role (admin) — sin policies = solo service_role

-- ── Policies: barcodes ──────────────────────────────────────────────────────
-- Solo admin via service_role — sin policies públicas

-- ── Policies: discogs_sync_log, discogs_orders ──────────────────────────────
-- Solo admin via service_role — sin policies públicas

-- sync_jobs: sin policy → solo accesible via service_role (admin client)

-- ─── 25. ÍNDICES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS releases_status_idx      ON releases(status);
CREATE INDEX IF NOT EXISTS releases_genres_idx      ON releases USING gin(genres);
CREATE INDEX IF NOT EXISTS releases_styles_idx      ON releases USING gin(styles);
CREATE INDEX IF NOT EXISTS releases_artists_idx     ON releases USING gin(artists);
CREATE INDEX IF NOT EXISTS releases_listing_idx     ON releases(discogs_listing_id);
CREATE INDEX IF NOT EXISTS releases_release_idx     ON releases(discogs_release_id);
CREATE INDEX IF NOT EXISTS releases_barcode_idx     ON releases(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS releases_quantity_idx    ON releases(quantity) WHERE quantity > 0;
CREATE INDEX IF NOT EXISTS events_date_idx          ON events(date);
CREATE INDEX IF NOT EXISTS wantlist_user_idx        ON wantlist(user_id);
CREATE INDEX IF NOT EXISTS wantlist_release_idx     ON wantlist(discogs_release_id);
CREATE INDEX IF NOT EXISTS reservations_pickup_code_idx ON reservations(pickup_code);
CREATE INDEX IF NOT EXISTS reservations_status_idx  ON reservations(status);
CREATE INDEX IF NOT EXISTS reservations_expires_idx ON reservations(expires_at);
CREATE INDEX IF NOT EXISTS orders_user_idx          ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx        ON orders(status);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_pickup_code_idx   ON orders(pickup_code) WHERE pickup_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_created_at_idx    ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_idx    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS pos_sale_items_sale_idx  ON pos_sale_items(pos_sale_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx        ON profiles(role);
CREATE INDEX IF NOT EXISTS discogs_sync_log_listing ON discogs_sync_log(listing_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode     ON barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_barcodes_release_id  ON barcodes(release_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tokens_token ON recovery_tokens(token) WHERE NOT used;
