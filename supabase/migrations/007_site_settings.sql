-- Migration 007: Site settings table for Discogs config and CMS content

-- Single key-value table for all site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}',
  category    text NOT NULL DEFAULT 'general',  -- discogs, legal, store, general
  label       text NOT NULL DEFAULT '',           -- Human-readable label for admin UI
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES profiles(id)
);

-- RLS: Only admins can write, anyone can read
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_read_all" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "site_settings_admin_write" ON site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed: Discogs configuration
INSERT INTO site_settings (key, value, category, label) VALUES
  ('discogs_username', '"rhythmcontrolshop"', 'discogs', 'Discogs Username'),
  ('discogs_token', '""', 'discogs', 'Discogs Personal Access Token')
ON CONFLICT (key) DO NOTHING;

-- Seed: Store info (used by footer, contact, legal pages)
INSERT INTO site_settings (key, value, category, label) VALUES
  ('store_name', '"RHYTHM CONTROL BARCELONA"', 'store', 'Nombre de la tienda'),
  ('store_address', '"Rda. de Sant Pau, 19-21, Local 28, Eixample, 08015 Barcelona, España"', 'store', 'Dirección'),
  ('store_email', '"rhythmcontrolshop@gmail.com"', 'store', 'Email de contacto'),
  ('store_phone', '"696 59 21 06"', 'store', 'Teléfono'),
  ('store_schedule', '["LUN 15:00–19:45", "MAR 15:00–19:45", "MIÉ 15:00–20:00", "JUE 15:00–19:45", "VIE 15:00–19:45", "SÁB 12:00–19:45", "DOM CERRADO"]', 'store', 'Horario'),
  ('store_social_instagram', '"https://instagram.com/rhythmcontrol.bcn"', 'store', 'Instagram URL'),
  ('store_social_mixcloud', '"https://mixcloud.com/rhythmcontrolshop"', 'store', 'Mixcloud URL')
ON CONFLICT (key) DO NOTHING;

-- Seed: Legal texts (full content as JSON strings)
INSERT INTO site_settings (key, value, category, label) VALUES
  ('legal_aviso', '"En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:"', 'legal', 'Aviso Legal - Introducción'),
  ('legal_privacidad', '"En cumplimiento del Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), informamos sobre la política de privacidad de este sitio web."', 'legal', 'Política de Privacidad - Introducción'),
  ('legal_cookies', '"Este sitio web utiliza cookies propias y de terceros para mejorar la experiencia de navegación y analizar el tráfico del sitio."', 'legal', 'Política de Cookies - Introducción'),
  ('legal_terminos', '"Las presentes condiciones generales regulan el uso del sitio web y la compra online de productos ofrecidos a través del mismo."', 'legal', 'Términos y Condiciones - Introducción')
ON CONFLICT (key) DO NOTHING;
