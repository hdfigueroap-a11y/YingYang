# Integración con Canvas

## Autenticación

Canvas usa un **Access Token personal**, generado en:
`Canvas > Perfil > Configuración > Approved Integrations > New Access Token`

- El token **hereda todos los permisos del usuario** — no hay scopes granulares
  para tokens personales (a diferencia de una Developer Key / OAuth app, que sí
  permite scopes pero requiere aprobación institucional — overkill para este
  proyecto).
- Se recomienda ponerle **fecha de expiración** (ej. 6 meses) al generarlo.
- El token se guarda cifrado en el dispositivo vía `expo-secure-store`, nunca en
  texto plano ni en el repositorio.
- **Nunca pegar el token en chats, capturas, ni commits.** (Ya ocurrió un incidente
  donde se compartió un token por chat — se recomendó revocarlo de inmediato desde
  Canvas y generar uno nuevo.)

## URL base

Depende de la institución, por ejemplo:
- UMB: `https://umb.instructure.com`
- UNAL: (URL propia de la institución)

Se guarda junto con el token en `saveCredentials(token, baseUrl)`.

## Endpoints usados actualmente

| Endpoint | Uso |
|---|---|
| `GET /api/v1/users/self/todo` | Lista de tareas pendientes (pantalla Tareas) |
| `GET /api/v1/courses?enrollment_state=active` | Lista de cursos activos (pantalla Cursos) |
| `GET /api/v1/courses/:id/assignments` | Todas las tareas de un curso (pantalla Cursos, al entrar a uno) |
| `POST /api/v1/courses/:id/assignments/:id/submissions` | Enviar entregas — texto (`online_text_entry`), URL (`online_url`) y archivo (`online_upload`) |
| `POST /api/v1/courses/:id/assignments/:id/submissions/self/files` | Paso 1 de la subida de archivos (pide la URL real de subida) |

## Endpoints documentados pero no implementados todavía

| Endpoint | Uso planeado |
|---|---|
| `GET /api/v1/calendar_events` | Sincronizar deadlines (alternativa a construir las reglas manualmente) |
| `GET /api/v1/users/self/grades` | Notas / promedio ponderado |
| `GET /api/v1/courses/:id/announcements` | Feed de avisos |

## Archivo relevante

`canvasApi.js` — centraliza todas las llamadas, con un wrapper `canvasFetch(path, options)`
que ya inyecta el header `Authorization: Bearer <token>` (y `Content-Type` cuando
hay `body`, para poder hacer también POST).

## Pantalla Cursos — explorar tareas más allá del to-do list

`CoursesScreen.js` usa `getCourses()` y `getAssignments(courseId)` (ya
existían en `canvasApi.js` sin usarse desde ninguna pantalla). Muestra la
lista de cursos activos; al entrar a uno, se listan **todas** sus tareas
(no solo las pendientes, a diferencia del to-do list de `TasksScreen.js`), con
las mismas acciones de programar bloque / entregar tarea.

## Envío de entregas (submissions)

Implementado en `canvasApi.js` (`submitTextEntry`, `submitUrl`, `submitFile`),
con la lógica de UI extraída al hook `useAssignmentSubmission.js` (compartido
por `TasksScreen.js` y `CoursesScreen.js`, para no duplicarla):

- Cada tarea que acepta `online_text_entry`, `online_url` u `online_upload` en
  su `submission_types` muestra un botón "Entregar tarea".
- Al tocarlo, si acepta más de un tipo se pregunta cuál usar (archivo → URL →
  texto, en ese orden); texto/URL se piden con `Alert.prompt` (nativo de
  iOS); archivo abre el selector de `expo-document-picker`.
- **Entrega por archivo** (`submitFile()` en `canvasApi.js`): sigue el flujo
  de 3 pasos que documenta Canvas para subidas
  (https://canvas.instructure.com/doc/api/file.file_uploads.html):
  1. `uploadSubmissionFile()` pide a Canvas una URL de subida específica para
     esa tarea (`POST .../submissions/self/files`, no el endpoint genérico
     `/files`).
  2. Sube el archivo real a esa URL vía `FormData` — sin el header
     `Authorization`, porque suele ser un host de almacenamiento distinto al
     de la API (siguiendo la recomendación de la documentación de Canvas).
  3. Con el `file_id` que Canvas devuelve, se crea el submission con
     `submission_type: 'online_upload'`.
- `expo-document-picker` se instaló con `npx expo install` (confirmado con el
  usuario) — no requiere configuración adicional en `app.json` (usa el picker
  nativo de archivos de iOS, no pide permisos de fototeca).

## Regla: tarea de Canvas → bloque de trabajo en el Calendario

Implementada en el hook `useWorkBlockScheduler.js` (compartido por
`TasksScreen.js` y `CoursesScreen.js`, para no duplicarla) — no requirió
cambios en `canvasApi.js`, ya que `due_at` viene incluido tanto en
`/users/self/todo` como en `/courses/:id/assignments`.

- **Todas** las tareas muestran el botón "Programar bloque de trabajo", tengan o
  no `due_at` — programar el bloque no depende de que la tarea tenga fecha
  límite.
- Al tocarlo, se pregunta la dificultad (Fácil = 1h, Difícil = 2h de bloque) —
  decisión manual del usuario, la app no la infiere.
- El selector siempre abre partiendo de "ahora + 5 minutos" — **no** sugiere
  una hora cercana a la fecha límite de la tarea (así era antes; se quitó
  porque el usuario prefiere elegir el día/hora libremente, sin que la app
  intente adivinar cuándo "debería" trabajar en la tarea).
- El usuario mueve esa fecha/hora a lo que quiera en el selector
  (`schedulePicker.js`) antes de confirmar — no se crea el evento sin
  confirmación manual.
- El evento creado usa `deviceCalendar.createEvent()`, con título
  `Trabajo: <nombre de la tarea>` y notas con la fecha límite original.
