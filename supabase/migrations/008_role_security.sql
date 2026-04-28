-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 008: Seguridad de roles + protección contra inyección de rol
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEMA: El trigger handle_new_user() leía raw_user_meta_data->>'role', lo que
-- permitía a un usuario malicioso inyectar role='admin' al registrarse vía API directa.
--
-- SOLUCIÓN:
-- 1. El trigger SIEMPRE asigna role='customer' (ignora user_metadata)
-- 2. RLS impide que los usuarios actualicen su propio campo 'role'
-- 3. Solo el service_role (admin) puede cambiar roles

-- ─── 1. Fix trigger: SIEMPRE asignar 'customer' ──────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    'customer'  -- SIEMPRE customer, NUNCA confiar en user input
  );
  RETURN NEW;
END;
$$;

-- ─── 2. RLS: Impedir que usuarios cambien su propio rol ──────────────────────
-- Reemplazar la policy existente de update para que NO permita cambiar el campo 'role'
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
  -- La subconsulta asegura que el role no cambió. Solo el service_role
  -- (que bypasea RLS) puede modificar el campo role.

-- ─── 3. Index adicional para búsquedas de admin ──────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
