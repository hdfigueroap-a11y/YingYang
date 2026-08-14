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
| Almacenamiento de Finanzas / Horario | `expo-sqlite` (bases de datos locales, sin sincronizar) |
| Navegación | `@react-navigation` v7 — Drawer (menú lateral ☰, no pestañas inferiores). Requiere `react-native-gesture-handler` + `react-native-reanimated` (con `babel.config.js` propio). v6 no es viable: su Drawer usa una API de Reanimated eliminada en v3+ — ver `docs/decisiones.md` |
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

### 3. Horario de clases
- `scheduleDb.js` — capa de datos SQLite, separada de `financeDb.js` (dominio
  distinto). Tabla `classes`: nombre, día de la semana (1=lunes..6=sábado,
  misma numeración que `Date.getDay()`), hora de inicio/fin ('HH:MM'), lugar
  opcional.
- `ScheduleScreen.js` — vista semanal (lunes a sábado) de las clases fijas,
  agrupadas por día. Cada clase se puede "agendar" como evento **semanal
  recurrente** en el Calendario del iPhone (`createWeeklyRecurringEvent` en
  `deviceCalendar.js`, 16 ocurrencias por defecto ≈ un semestre) — eso sí pide
  permiso de Calendario, igual que el resto de la app.

### 4. Finanzas (Fase 5, en construcción)
- `financeDb.js` — capa de datos SQLite (`expo-sqlite`), 100% local, sin
  ningún servicio externo ni credencial (no se integra con ningún banco —
  ver `docs/decisiones.md`). Esquema: `accounts`, `categories`
  (ingreso/gasto), `transactions` (monto siempre positivo, el signo lo da la
  categoría; `installments` = cuotas), `budgets` (límite mensual por
  categoría). Las cuentas `credito` tienen cupo/día de corte/día de pago
  (`credit_limit`, `cutoff_day`, `due_day`); `getCreditCards()` calcula al
  vuelo lo gastado en el corte actual y la próxima fecha de pago, y
  `getInstallmentProgress()` calcula cuántas cuotas de una compra ya se
  cobraron. `initDatabase()` crea las tablas y siembra cuentas/categorías
  por defecto la primera vez.
- `FinanceScreen.js` — sección "Finanzas" del menú: selector de mes, resumen
  (ingresos/gastos/balance), presupuestos del mes por categoría (barra de
  progreso con aviso de color al acercarse/exceder), formulario para agregar
  movimientos, lista de movimientos del mes, y apartado de tarjetas de
  crédito (gasto del corte, cupo disponible, próximo pago, compras,
  configuración de cupo/corte/pago). Fase 5 completa en su versión manual —
  ver `docs/planner.md`.

### 5. Navegación
- `App.js` — decide entre LoginScreen (si no hay token de Canvas) o el menú
  lateral (Drawer, ícono ☰ arriba a la izquierda) con Tareas/Cursos/
  Horario/Calendario/Finanzas. `CustomDrawerContent` agrega el botón "Cerrar
  sesión" al final del menú (antes vivía en `TasksScreen.js`, ahora ninguna
  pantalla lo necesita). Cada sección conserva su ícono (emoji) y color de
  identidad como antes en la tab bar, ahora en el ítem del menú

### 6. Diseño visual
- `theme.js` — paleta de colores, radios, espaciados y tipografía compartidos
  (diseño oscuro "futurista": fondo casi negro con tinte azul-violeta,
  tarjetas con borde sutil y resplandor cian, acentos en degradado
  cian → violeta), aplicados a todas las pantallas reales. Un solo lugar
  para tocar el estilo visual en vez de repetir valores sueltos por archivo.
  Incluye `gradients` (pares de color para `expo-linear-gradient`), `palette`
  (10 colores neón) y `colorFromString(texto)`, que asigna siempre el mismo
  color de la paleta al mismo texto (curso, evento) — así cada curso tiene
  una identidad de color consistente en toda la app sin guardar nada nuevo.
  Usado para: la franja de color a la izquierda de las tarjetas de
  tarea/curso, el punto de color de cada evento en Calendario, y el color
  activo de cada pestaña de la tab bar (`App.js`)
- `AppButton.js` — botón reutilizable (`Pressable`) con variantes `primary`
  (degradado cian → violeta vía `expo-linear-gradient`) / `secondary` (fondo
  cian translúcido con borde de resplandor) / `neutral` / `plain`, y tamaños
  `default` / `small` / `large`. Reemplaza al `<Button>` nativo de React
  Native, que no permite personalizar fondo, radio ni padding. Usado en
  todas las pantallas; **no usar `<Button>` de `react-native` directamente
  en pantallas nuevas**, usar `AppButton` para mantener el estilo
  consistente

## Fuera del alcance de esta app (decisión explícita)

- **Gimnasio (logging de entrenos, progreso, pesos/reps):** se usa la app **Liftoff**
  en paralelo. Esta app solo crea el *bloque de horario* en el calendario, no
  reemplaza a Liftoff — Liftoff no tiene API pública, no es integrable.
- **Notion / Obsidian / Readwise / Hermes Agent:** evaluados como posibles
  piezas de automatización futura, no implementados todavía. Ver `planner.md`.

**Finanzas ya no está fuera de alcance** — pasó de exploración a fase activa
del roadmap (Fase 5 en `planner.md`) y ya tiene código (`financeDb.js`,
`FinanceScreen.js`), todo manual y local. n8n sigue siendo la excepción de
automatización activa (ver `automation/`).

## Por qué NO se usa Google Calendar ni Microsoft Graph

Ver `decisiones.md` para el detalle — resumen: Google Cloud exigía activar una
cuenta de Facturación (prepago reembolsable de COP 30.000) para crear credenciales
OAuth; Microsoft Graph vía Azure se bloqueó al usar la cuenta institucional
(requería permisos de administrador que la universidad no habilita a estudiantes).
Se optó por el Calendario nativo del iPhone (`expo-calendar`), que no depende de
ninguna cuenta ni servicio externo.
