# Arquitectura — Canvas Dashboard

## Visión general

App personal para iPhone (no publicada en App Store, uso 100% individual) que centraliza:
1. Tareas de Canvas (LMS estudiantil de UMB/UNAL)
2. Un calendario de horario (sueño, lectura, gimnasio, trabajo en tareas)

Construida con **React Native + Expo**, corriendo en modo desarrollo vía **Expo Go**
mientras se construye. No requiere Mac.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Expo SDK 54 (React Native 0.81.4, React 19.1.0) |
| Lenguaje | JavaScript |
| Almacenamiento de credenciales | `expo-secure-store` (cifrado en el dispositivo) |
| Navegación | `@react-navigation` (bottom tabs) |
| Calendario | `expo-calendar` → Calendario nativo del iPhone (EventKit) |
| Tareas académicas | API REST de Canvas (token de acceso personal) |
| Control de versiones | Git (local, opcionalmente GitHub privado) |
| Asistente de desarrollo | Claude Code, operando directo sobre este repo |

## Módulos de la app

### 1. Tareas (Canvas)
- `LoginScreen.js` — formulario para guardar token + URL de institución
- `canvasApi.js` — wrapper de fetch con el token, centraliza todas las llamadas
- `TasksScreen.js` — lista las tareas *pendientes* (`/users/self/todo`)
- `CoursesScreen.js` — lista los cursos activos (`/courses`) y, al entrar a uno,
  *todas* sus tareas (`/courses/:id/assignments`), no solo las pendientes —
  complementa a `TasksScreen.js`
- `useWorkBlockScheduler.js` — hook: programa una tarea como bloque de trabajo
  en el Calendario (dificultad manual → duración; día/hora libres). Compartido
  por `TasksScreen.js` y `CoursesScreen.js`
- `useAssignmentSubmission.js` — hook: entrega una tarea por texto o URL.
  Compartido por `TasksScreen.js` y `CoursesScreen.js`
- Ver `canvas-api.md` para el detalle de ambas reglas

### 2. Calendario (nativo del iPhone)
- `deviceCalendar.js` — wrapper de `expo-calendar`: permisos, crear/listar eventos
- `schedulePicker.js` — selector de fecha/hora reutilizable (Android nativo /
  modal iOS), usado por `useWorkBlockScheduler.js` y por `CalendarScreen.js`
- `CalendarScreen.js` — pantalla con bloques rápidos (sueño, lectura, gym, trabajo)
  y lista de próximos eventos

### 3. Navegación
- `App.js` — decide entre LoginScreen (si no hay token de Canvas) o las pestañas
  Tareas/Cursos/Calendario. Tab bar con ícono (emoji) y color de acento por
  pestaña activa

### 4. Diseño visual
- `theme.js` — paleta de colores, radios, espaciados y tipografía compartidos
  (estilo iOS nativo), aplicados a todas las pantallas reales. Un solo lugar
  para tocar el estilo visual en vez de repetir valores sueltos por archivo.
  Incluye `palette` (10 colores vivos) y `colorFromString(texto)`, que asigna
  siempre el mismo color de la paleta al mismo texto (curso, evento) — así
  cada curso tiene una identidad de color consistente en toda la app sin
  guardar nada nuevo. Usado para: la franja de color a la izquierda de las
  tarjetas de tarea/curso, el punto de color de cada evento en Calendario, y
  el color activo de cada pestaña de la tab bar (`App.js`)
- `AppButton.js` — botón reutilizable (`Pressable`) con variantes `primary` /
  `secondary` / `neutral` / `plain` y tamaños `default` / `small` / `large`.
  Reemplaza al `<Button>` nativo de React Native, que no permite personalizar
  fondo, radio ni padding — necesario para el estilo "pill" del diseño.
  Usado en todas las pantallas; **no usar `<Button>` de `react-native`
  directamente en pantallas nuevas**, usar `AppButton` para mantener el
  estilo consistente

## Fuera del alcance de esta app (decisión explícita)

- **Gimnasio (logging de entrenos, progreso, pesos/reps):** se usa la app **Liftoff**
  en paralelo. Esta app solo crea el *bloque de horario* en el calendario, no
  reemplaza a Liftoff — Liftoff no tiene API pública, no es integrable.
- **Finanzas:** explorado conceptualmente (Open Finance Colombia, parseo de correos
  bancarios vía n8n), no implementado todavía.
- **Notion / Obsidian / Readwise / n8n / Hermes Agent:** evaluados como posibles
  piezas de automatización futura, no implementados todavía. Ver `planner.md`.

## Por qué NO se usa Google Calendar ni Microsoft Graph

Ver `decisiones.md` para el detalle — resumen: Google Cloud exigía activar una
cuenta de Facturación (prepago reembolsable de COP 30.000) para crear credenciales
OAuth; Microsoft Graph vía Azure se bloqueó al usar la cuenta institucional
(requería permisos de administrador que la universidad no habilita a estudiantes).
Se optó por el Calendario nativo del iPhone (`expo-calendar`), que no depende de
ninguna cuenta ni servicio externo.
