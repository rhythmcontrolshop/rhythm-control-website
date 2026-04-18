-- ============================================================
-- RHYTHM CONTROL — Migration 004: disputed payment_status
-- Añade 'disputed' al CHECK de orders.payment_status
-- ============================================================

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'disputed'));
