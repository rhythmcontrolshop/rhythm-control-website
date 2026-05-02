-- ============================================================
-- RHYTHM CONTROL — Migration 003: Stripe subscriptions & idempotency
-- Añade: stripe_events, stripe_customers, subscriptions
--        función decrement_release_quantity
-- ============================================================

-- ── TABLA: stripe_events ──────────────────────────────────────
-- Deduplicación de webhooks: cada event.id de Stripe se registra
-- antes de procesar para evitar efectos dobles en reintentos.

CREATE TABLE IF NOT EXISTS stripe_events (
  id           text PRIMARY KEY,          -- event.id de Stripe (evt_...)
  type         text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Limpiar eventos viejos (>30 días) — ejecutar con pg_cron si está disponible
-- SELECT cron.schedule('clean-stripe-events', '0 3 * * *',
--   $$DELETE FROM stripe_events WHERE processed_at < now() - interval '30 days'$$);


-- ── TABLA: stripe_customers ───────────────────────────────────
-- Enlace entre profiles.id y el customer ID de Stripe (cus_...).
-- Se crea al hacer el primer checkout o suscripción.

CREATE TABLE IF NOT EXISTS stripe_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id  text NOT NULL UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_customers_customer_idx ON stripe_customers(stripe_customer_id);


-- ── TABLA: subscriptions ──────────────────────────────────────
-- Estado actual de cada suscripción Stripe por usuario.
-- Se sincroniza via webhooks customer.subscription.* e invoice.*.

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id  text NOT NULL UNIQUE,
  stripe_customer_id      text NOT NULL,
  status                  text NOT NULL
                          CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  price_id                text NOT NULL,         -- Stripe Price ID (price_...)
  current_period_start    timestamptz NOT NULL,
  current_period_end      timestamptz NOT NULL,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  canceled_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx   ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_idx ON subscriptions(stripe_subscription_id);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE stripe_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;

-- stripe_events y stripe_customers: sin policies públicas
-- → solo accesibles via service_role (admin client en webhooks)

-- El propio usuario puede leer su suscripción
CREATE POLICY "subscriptions_own_read" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);


-- ── FUNCIÓN: decrement_release_quantity ───────────────────────
-- Decrementa stock y marca como 'sold' si llega a 0.
-- Llamada desde el webhook en checkout.session.completed.

CREATE OR REPLACE FUNCTION decrement_release_quantity(
  p_release_id uuid,
  p_qty        integer
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE releases
  SET
    quantity = GREATEST(0, quantity - p_qty),
    status   = CASE
                 WHEN quantity - p_qty <= 0 THEN 'sold'
                 ELSE status
               END
  WHERE id = p_release_id;
END;
$$;

-- Inversa: restaurar stock tras reembolso
CREATE OR REPLACE FUNCTION restore_release_quantity(
  p_release_id uuid,
  p_qty        integer
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE releases
  SET
    quantity = quantity + p_qty,
    status   = CASE
                 WHEN status = 'sold' THEN 'active'
                 ELSE status
               END
  WHERE id = p_release_id;
END;
$$;
