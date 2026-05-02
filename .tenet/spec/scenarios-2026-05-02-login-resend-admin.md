# Scenarios: login-resend-admin

Date: 2026-05-02

---

## Scenarios (Success)

1. **Registro completo con confirmación**
   - Usuario va a `/registro`, rellena email válido, password "Abc12345", envía
   - Ve página `/registro/pendiente` con su email y botón reenviar
   - Abre email → hace clic en enlace → aterriza en `/registro/confirmado`
   - Hace clic en "IR A MI CUENTA" → está en `/cuenta` autenticado
   - Expected: `email_confirmed_at` no null en Supabase, welcome email recibido

2. **Login estándar**
   - Usuario registrado y confirmado va a `/login`, introduce credenciales correctas
   - En < 3s está en `/cuenta` con sesión activa
   - Expected: cookie de sesión presente, `supabase.auth.getUser()` devuelve el usuario

3. **Recuperar contraseña**
   - Usuario va a `/admin/recover`, introduce su email
   - Ve mensaje "EMAIL ENVIADO" en la página
   - En < 5min llega email con botón "RESTABLECER CONTRASEÑA"
   - Link lleva a `/admin/reset-password` con formulario de nueva contraseña
   - Usuario introduce "NuevaPass99" y envía
   - Puede iniciar sesión con la nueva contraseña
   - Expected: `/recuperar?success=true` visible tras el cambio

4. **Admin crea tarifa de envío**
   - Admin va a `/admin/shipping`, hace clic en "+ NUEVA TARIFA"
   - Rellena: nombre="Islas Canarias", precio=8.50, método=Domicilio, zona=Canarias
   - Deja "GRATIS DESDE" vacío
   - Hace clic en "GUARDAR"
   - La nueva tarifa aparece en la lista
   - Al recargar la página la tarifa persiste con `free_above = null`
   - Expected: POST `/api/admin/shipping-rates` → 200, tarifa en DB

5. **Admin edita cliente**
   - Admin va a `/admin/clientes`, hace clic en "EDITAR" en la fila de Maria Font
   - Slide-over abre con sus datos actuales
   - Cambia teléfono a "699 111 222"
   - Hace clic en "GUARDAR"
   - Slide-over se cierra, tabla muestra el nuevo teléfono
   - Al recargar persiste
   - Expected: PATCH `/api/admin/users` → 200, `profiles.phone` actualizado en DB

6. **Reenviar email de confirmación**
   - Usuario en `/registro/pendiente` hace clic en "REENVIAR EMAIL"
   - Ve mensaje de éxito "Email reenviado"
   - Llega nuevo email de confirmación en < 5min
   - Expected: `supabase.auth.resend()` retorna sin error

7. **Admin ajustes guarda textos legales**
   - Admin va a `/admin/ajustes`, tab "LEGAL"
   - Edita el campo "Aviso Legal - Introducción"
   - Hace clic en "GUARDAR"
   - Ve mensaje verde "1 ajuste(s) guardado(s)"
   - Al recargar el texto nuevo persiste
   - Expected: PATCH `/api/admin/settings` → 200

---

## Anti-Scenarios (Failure — must NOT happen)

1. **Login con email no confirmado no muestra error claro**
   - ANTI: Usuario con email sin confirmar intenta login → ve pantalla en blanco, error genérico, o bucle infinito
   - MUST: Ver mensaje "Por favor confirma tu email" + botón para reenviar

2. **Emails con link al dominio viejo**
   - ANTI: Welcome email o password reset contienen link a `rhythm-control-website.vercel.app`
   - MUST: Todos los links en emails apuntan a `rhythmcontrolbarcelona.com`

3. **Guardar tarifa sin campos requeridos no da feedback**
   - ANTI: Admin hace clic en "GUARDAR" sin rellenar nombre o precio → no pasa nada o redirige sin mensaje
   - MUST: Mensaje de error inline "Nombre, método y precio son obligatorios"

4. **free_above pre-rellenado con 0**
   - ANTI: Al crear nueva tarifa, el campo "GRATIS DESDE" muestra "0" → admin guarda sin darse cuenta → envío siempre gratis
   - MUST: El campo está vacío (null) por defecto

5. **Slide-over de cliente pierde datos al fallar el save**
   - ANTI: Admin edita cliente, save falla → slide-over se cierra y los cambios se pierden
   - MUST: El slide-over permanece abierto con los datos del formulario y muestra error inline

6. **Auth callback roto — enlace de confirmación no funciona**
   - ANTI: Usuario hace clic en enlace de email → error 404 o página en blanco → cuenta nunca se confirma
   - MUST: `/auth/callback` procesa el code correctamente y redirige a `/registro/confirmado`

7. **Rate limiting silencioso**
   - ANTI: Tras 11 intentos fallidos de login, el usuario no ve ningún mensaje y puede seguir intentando
   - MUST: Después del umbral (10 intentos/min) se muestra "Demasiados intentos. Espera 1 minuto."

8. **Admin no autorizado puede editar clientes**
   - ANTI: Usuario no-admin puede hacer PATCH a `/api/admin/users` con una cookie de usuario normal
   - MUST: `requireAdminWithClient()` rechaza con 401/403 cualquier petición sin sesión admin válida
