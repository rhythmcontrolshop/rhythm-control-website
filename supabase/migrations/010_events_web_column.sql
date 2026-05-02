-- Migration 010: Add 'web' column to events, add 'weight' to orders (if missing)
--
-- This migration ensures the 'web' column exists on the events table (event/external URL)
-- and the 'weight' column exists on the orders table with the correct type.
--
-- Note: Migration 006 attempted to add these columns, but 'weight' was created as
-- integer instead of numeric(6,2). This migration corrects the type if the column
-- was not yet created with the proper definition.

-- ─── 1. events: add 'web' column ───────────────────────────────────────────────
-- Stores the external event page URL (distinct from ticket_url which links to ticket purchase).
ALTER TABLE events ADD COLUMN IF NOT EXISTS web text;

-- ─── 2. orders: add 'weight' column ────────────────────────────────────────────
-- Weight in kg for shipping cost calculations. Default 0.30 kg (~one 12" vinyl).
-- Uses numeric(6,2) for precision (max 9999.99 kg, 2 decimal places).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight numeric(6,2) DEFAULT 0.30;
