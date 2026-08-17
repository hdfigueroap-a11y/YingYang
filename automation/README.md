# Automatización con n8n

Workflows de n8n (no forman parte de la app Expo — corren en tu instancia de
n8n, que ya tenías corriendo antes de esto) que avisan por **email** sobre
novedades en Canvas. Corresponden a la Fase 4 del roadmap (ver
`../docs/planner.md`).

## Qué hace cada uno

- **`canvas-tareas-nuevas.json`** — todos los días a las 7am, revisa
  `/users/self/todo` y te manda un email solo si aparece una tarea que no
  estaba la vez anterior (no te satura con las mismas tareas cada día).
- **`canvas-promedio-notas.json`** — todos los días a las 8am, revisa las
  notas actuales de tus cursos activos y te manda un email solo si algo
  cambió desde la última vez. El promedio es **simple** (no ponderado por
  créditos) — Canvas no expone créditos por curso de forma genérica. Si
  quieres pesarlo, hay un comentario en el nodo "Calcular promedio" con cómo
  hacerlo a mano.
- **`canvas-anuncios.json`** — todos los días a las 9:30am, revisa el feed de
  actividad reciente de Canvas (`GET /users/self/activity_stream`, que cubre
  todos tus cursos activos en una sola llamada) y te manda un email solo con
  los anuncios nuevos (filtra el resto de tipos de actividad — discusiones,
  calificaciones, etc.).

Los tres guardan su "última corrida" en el _workflow static data_ de n8n
(no en ningún archivo ni base de datos externa) — es lo que les permite
avisar solo cuando hay algo nuevo, en vez de mandar el mismo email todos los
días.

> **Descartado:** un workflow de "material nuevo" (`GET /courses/:id/files`
> por cada curso) se construyó y probó, pero la cuenta de Canvas del usuario
> no tiene permiso para listar archivos por API (típico en cuentas de
> estudiante, según cómo cada profesor configure el curso) — Canvas devuelve
> error de permisos en vez de la lista. Se descartó en vez de dejarlo
> instalado sin funcionar. Ver `docs/decisiones.md`.

## Seguridad — antes de importar

**No reuses el Access Token de Canvas que ya tiene guardado la app.** Genera
uno nuevo específico para n8n (Canvas → Perfil → Configuración → New Access
Token, con fecha de expiración) — así, si algún día hay que revocar uno, el
otro sigue funcionando. El token nunca va dentro de estos archivos `.json`:
vive únicamente en el almacén de credenciales cifrado de n8n.

Lo mismo aplica a la contraseña del correo: usá una **contraseña de
aplicación**, no la contraseña real de tu cuenta (Gmail, Outlook, etc. la
generan aparte específicamente para esto y se pueden revocar sin afectar el
login normal).

## Instalación (una sola vez)

1. **Credencial de Canvas en n8n**: Credentials → New → "Header Auth".
   - Name: `Canvas API Token` (así se llama en los nodos de estos workflows)
   - Header Name: `Authorization`
   - Header Value: `Bearer <tu-token-nuevo-de-canvas>`
2. **Credencial SMTP en n8n**: Credentials → New → "SMTP".
   - Name: `SMTP Canvas Dashboard` (así se llama en los nodos)
   - Host/Port/User/Password de tu proveedor de correo. Para Gmail:
     `smtp.gmail.com`, puerto `465` (SSL) o `587` (TLS), tu usuario es tu
     correo completo, y la contraseña es una **contraseña de aplicación**
     (Cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas
     de aplicaciones — requiere tener 2FA activado).
3. **Importar los workflows**: en n8n, Workflows → Import from File → elegí
   `canvas-tareas-nuevas.json` (repetí con los otros dos archivos).
4. **Por cada workflow importado**:
   - Abrí el nodo **"Configuración"** y cambiá `canvas_base_url` por la URL
     real de tu institución (ej. `https://umb.instructure.com`).
   - Abrí el nodo HTTP Request y volvé a seleccionar la credencial
     **Canvas API Token** — el import no trae credenciales con el secreto,
     solo el nombre.
   - Abrí el nodo **"Enviar email"**: seleccioná la credencial **SMTP Canvas
     Dashboard**, y reemplazá `REEMPLAZAR@ejemplo.com` en `fromEmail` y
     `toEmail` por tu correo real (puede ser el mismo en ambos campos).
   - Probá con el botón "Execute Workflow" antes de activarlo.
   - Activá el workflow (toggle "Active" arriba a la derecha).

## Si quieres reiniciar el "ya visto"

Los workflows solo avisan sobre lo nuevo comparado con su última corrida. Si
alguna vez querés que vuelvan a avisar sobre todo lo actual (por ejemplo,
para probarlos), lo más simple es duplicar el workflow en n8n — el duplicado
arranca con su propio _static data_ vacío.
