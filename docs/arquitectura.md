# Arquitectura — Canvas Dashboard

## Visión general

App personal para iPhone (no publicada en App Store, uso 100% individual) que centraliza:

1. Tareas de Canvas (LMS estudiantil de UMB/UNAL)
2. Un calendario de horario (sueño, lectura, gimnasio, trabajo en tareas)

Construida con **React Native + Expo**, corriendo en modo desarrollo vía **Expo Go**
mientras se construye. No requiere Mac.

## Stack

| Capa                                 | Tecnología                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                            | Expo SDK 54 (React Native 0.81.4, React 19.1.0)                                                                                                                                                                                                                                                                                 |
| Lenguaje                             | JavaScript                                                                                                                                                                                                                                                                                                                      |
| Almacenamiento de credenciales       | `expo-secure-store` (cifrado en el dispositivo)                                                                                                                                                                                                                                                                                 |
| Almacenamiento de Finanzas / Horario | `expo-sqlite` (bases de datos locales, sin sincronizar)                                                                                                                                                                                                                                                                         |
| Navegación                           | `@react-navigation` v7 — Drawer (menú lateral ☰, no pestañas inferiores). Requiere `react-native-gesture-handler` + `react-native-reanimated` (con `babel.config.js` propio). v6 no es viable: su Drawer usa una API de Reanimated eliminada en v3+ — ver `docs/decisiones.md`                                                 |
| Calendario                           | `expo-calendar` → Calendario nativo del iPhone (EventKit)                                                                                                                                                                                                                                                                       |
| Notificaciones                       | `expo-notifications` — locales únicamente, sin Expo push token ni servidor                                                                                                                                                                                                                                                      |
| Respaldo de datos                    | `expo-file-system` (API nueva `File`/`Paths`) + `expo-sharing` + `expo-document-picker`                                                                                                                                                                                                                                         |
| Tareas académicas                    | API REST de Canvas (token de acceso personal)                                                                                                                                                                                                                                                                                   |
| Control de versiones                 | Git (local, opcionalmente GitHub privado)                                                                                                                                                                                                                                                                                       |
| Calidad de código                    | ESLint 9 (`eslint-config-expo`, flat config) + Prettier (`eslint-config-prettier` desactiva el choque de reglas de estilo) — `npm run lint`, `npm run format` / `format:check`. Tests: Jest (`jest-expo`) — `npm test` / `npm run test:watch`, por ahora solo sobre la lógica de dinero de `financeDb.js` (`financeDb.test.js`) |
| Asistente de desarrollo              | Claude Code, operando directo sobre este repo                                                                                                                                                                                                                                                                                   |

## Módulos de la app

### Utilidades compartidas

- `formatters.js` — funciones de fecha/hora/dinero (`pad2`, `isoDate`,
  `parseIsoDate`, `timeToHHMM`, `hhmmToDate`, `formatTimeLabel`,
  `nextDateForWeekday`, `combineDateAndTime`, `monthKey`,
  `previousMonthKey`, `monthLabel`, `percentChange`, `formatMoney`).
  Antes vivían duplicadas de forma independiente dentro de
  `FinanceScreen.js` y `ScheduleScreen.js` (mismo nombre, mismo cuerpo en
  el caso de `pad2`) — se centralizaron en una revisión de arquitectura
  para no repetir el patrón que ya causó bugs de UI documentados abajo.
  Cualquier pantalla nueva que necesite formatear fecha/hora/dinero debe
  importar de acá, no reimplementar.
- `ErrorBoundary.js` — componente de clase de React (única forma de
  capturar errores de render; no tiene equivalente en hooks) que envuelve
  toda la app en `App.js`. Sin esto, un error no capturado en cualquier
  pantalla dejaba una pantalla en blanco sin recuperación. Muestra el
  mensaje de error y un botón "Reintentar" que limpia el estado y vuelve a
  montar el árbol.

### 0. Hoy

- `notifications.js` — notificaciones **locales** (`expo-notifications`), sin
  Expo push token ni servidor: `scheduleReminder(id, {title, body, date})`
  programa (o reemplaza, si el id ya existía) un aviso para una fecha
  futura; no hace nada si la fecha ya pasó. Sin proceso en segundo plano que
  reprograme solo — cada pantalla que los usa los vuelve a programar cada
  vez que se abre (ids estables por día, así reabrir el mismo día reemplaza
  en vez de duplicar). Usado por `TodayScreen.js` (10 min antes de una clase
  o evento, 1h antes de que venza una tarea urgente) y `FinanceScreen.js`
  (1 día antes del pago de cada tarjeta de crédito configurada).
- `TodayScreen.js` — primera sección del menú: resumen del día en una sola
  pantalla — tareas urgentes de Canvas (vencen en menos de 24h o ya
  vencidas, mismo criterio `isUrgent` que `TasksScreen.js`), clases de hoy
  (`scheduleDb.js`, filtradas por `Date.getDay()`) y eventos de hoy del
  Calendario del iPhone (`listEventsForDay` de `deviceCalendar.js`). Antes
  había que revisar Tareas/Horario/Calendario por separado. Reutiliza
  `useWorkBlockScheduler.js` para poder programar un bloque de trabajo
  directo desde una tarea urgente, igual que en `TasksScreen.js`. Si el
  permiso de Calendario no está dado, esa sección queda vacía en vez de
  bloquear el resto de la pantalla.

### 1. Tareas (Canvas)

- `LoginScreen.js` — formulario para guardar token + URL de institución
- `canvasApi.js` — wrapper de fetch con el token, centraliza todas las llamadas
- `TasksScreen.js` — lista las tareas _pendientes_ (`/users/self/todo`)
- `CoursesScreen.js` — lista los cursos activos (`/courses`) y, al entrar a uno,
  _todas_ sus tareas (`/courses/:id/assignments`), no solo las pendientes —
  complementa a `TasksScreen.js`
- `useWorkBlockScheduler.js` — hook: programa una tarea como bloque de trabajo
  en el Calendario (dificultad manual → duración; día/hora libres). Compartido
  por `TasksScreen.js` y `CoursesScreen.js`
- `useAssignmentSubmission.js` — hook: entrega una tarea por texto o URL.
  Compartido por `TasksScreen.js` y `CoursesScreen.js`
- `canvasCache.js` — guarda la última respuesta buena de `/users/self/todo`
  y `/courses` (vía `expo-file-system`, `Paths.cache`) para que
  `TasksScreen.js`/`CoursesScreen.js` no queden vacíos sin conexión —
  muestran esos datos con un aviso en vez de un error a secas
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
  permiso de Calendario, igual que el resto de la app. El modal "Nueva
  clase" vive en `AddClassModal.js` (junto con la lista `DAYS`, que
  `ScheduleScreen.js` reimporta) y ambos comparten estilos vía
  `scheduleStyles.js` — antes el modal estaba definido dentro del mismo
  archivo que la pantalla.

### 4. Finanzas (Fase 5, completa en su versión manual)

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
  (ingresos/gastos/balance), gráfico de barras "Gastos por categoría" (la
  categoría con más gasto marca el 100%, cada barra usa el mismo color de
  identidad que esa categoría tiene en el resto de la app vía
  `colorFromString`), presupuestos del mes por categoría (barra de progreso
  con aviso de color al acercarse/exceder), formulario para agregar
  movimientos, lista de movimientos del mes, y apartado de tarjetas de
  crédito (gasto del corte, cupo disponible, próximo pago, compras,
  configuración de cupo/corte/pago). Programa una notificación local un día
  antes del pago de cada tarjeta (`notifications.js`). Ingresos y Gastos
  muestran un badge de comparación contra el mes anterior (▲/▼ N%, color
  según sea favorable u no — no según el signo). Fase 5 completa en su
  versión manual — ver `docs/planner.md`. Los 4 modales de esta pantalla
  (`AddTransactionModal.js`, `CardPurchasesModal.js`, `ConfigCardModal.js`,
  `BudgetModal.js`) viven en archivos propios, compartiendo estilos vía
  `financeStyles.js` — antes los cuatro estaban definidos dentro de
  `FinanceScreen.js`, que llegó a 904 líneas en un solo archivo (pantalla +
  4 modales + utilidades de fecha/dinero locales). Se dividió en una
  revisión de arquitectura para que cada modal sea legible y editable por
  separado.

### 5. Navegación

- `App.js` — decide entre LoginScreen (si no hay token de Canvas) o el menú
  lateral (Drawer, ícono ☰ arriba a la izquierda) con Hoy/Tareas/Cursos/
  Horario/Calendario/Finanzas/Ajustes. `CustomDrawerContent` agrega el botón
  "Cerrar sesión" al final del menú (antes vivía en `TasksScreen.js`, ahora
  ninguna pantalla lo necesita). Cada sección conserva su ícono (emoji) y
  color de identidad como antes en la tab bar, ahora en el ítem del menú.
  Los tres estados de la app (cargando, login, menú principal) están
  envueltos en `ErrorBoundary.js`, además de `GestureHandlerRootView` y
  `SafeAreaProvider`.

### 6. Diseño visual

- `theme.js` — paleta de colores, radios, espaciados y tipografía compartidos
  (diseño oscuro "futurista": fondo casi negro con tinte azul-violeta,
  tarjetas con borde sutil y resplandor cian, acentos en degradado
  cian → violeta), aplicados a todas las pantallas reales. Un solo lugar
  para tocar el estilo visual en vez de repetir valores sueltos por archivo.
  Incluye `gradients` (pares de color para `expo-linear-gradient`),
  `colors.warning` (color de estado reservado — avisos como "presupuesto
  acercándose al límite", nunca reusado como color de identidad), `palette`
  (7 colores, validados con la herramienta de paletas categóricas del skill
  de dataviz contra el fondo oscuro de la app — ver `docs/decisiones.md`) y
  `colorFromString(texto)`, que asigna siempre el mismo color de la paleta
  al mismo texto (curso, evento, categoría) — así cada uno tiene una
  identidad de color consistente en toda la app sin guardar nada nuevo.
  Usado para: la franja de color a la izquierda de las tarjetas de
  tarea/curso, el punto de color de cada evento en Calendario, las barras
  del gráfico "Gastos por categoría" en Finanzas, y el color activo de cada
  sección del menú (`App.js`)
- `AppButton.js` — botón reutilizable (`Pressable`) con variantes `primary`
  (degradado cian → violeta vía `expo-linear-gradient`) / `secondary` (fondo
  cian translúcido con borde de resplandor) / `neutral` / `plain`, y tamaños
  `default` / `small` / `large`. Reemplaza al `<Button>` nativo de React
  Native, que no permite personalizar fondo, radio ni padding. Usado en
  todas las pantallas; **no usar `<Button>` de `react-native` directamente
  en pantallas nuevas**, usar `AppButton` para mantener el estilo
  consistente

### 7. Ajustes

- `backup.js` — respaldo/restauración de Finanzas y Horario (las únicas
  bases de datos que solo viven en el dispositivo). `exportBackup()` junta
  todo (`financeDb.js` + `scheduleDb.js`) en un JSON, lo escribe con la API
  nueva de `expo-file-system` (`File`/`Paths`, no la API legacy basada en
  `documentDirectory`/`writeAsStringAsync`) y lo comparte con
  `expo-sharing`. `pickBackupFile()` usa `expo-document-picker` (ya
  instalado, mismo que las entregas de tareas) para elegir un `.json` y
  devuelve el contenido ya parseado; `restoreBackup()` reemplaza TODOS los
  datos actuales por los del archivo (destructivo a propósito — es
  restauración, no combinación). `financeDb.js`/`scheduleDb.js` exponen
  `exportAllData()`/`importAllData()` y `exportAllClasses()`/
  `importAllClasses()` para esto — conservan los `id` originales al
  restaurar, para que las referencias entre tablas (`category_id`,
  `account_id`) sigan siendo válidas.
- `SettingsScreen.js` — última sección del menú: dos botones ("Exportar
  respaldo", "Restaurar desde respaldo") con confirmación explícita antes
  de restaurar (`Alert` con la fecha del archivo y una advertencia clara de
  que reemplaza los datos actuales).

## Fuera del alcance de esta app (decisión explícita)

- **Gimnasio (logging de entrenos, progreso, pesos/reps):** se usa la app **Liftoff**
  en paralelo. Esta app solo crea el _bloque de horario_ en el calendario, no
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
