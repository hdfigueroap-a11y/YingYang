# Planner — Roadmap del proyecto

## Fase 1 — MVP de Canvas ✅ Completada

1. Generar Access Token de Canvas
2. Crear proyecto en Expo
3. Pantalla de login/token seguro (`expo-secure-store`)
4. Mostrar lista de tareas pendientes reales
5. Verificado funcionando en iPhone físico vía Expo Go (SDK 54)

## Fase 2 — Calendario ✅ Completada

1. ~~Conectar Google Calendar~~ → ~~Microsoft Graph~~ → **Calendario nativo del
   iPhone** (`expo-calendar`) — ver `calendario.md` para el porqué del cambio
2. Bloques rápidos: sueño, lectura, gimnasio, trabajo (difícil/fácil)
3. ✅ Selector real de fecha/hora (`schedulePicker.js`, usado desde
   `CalendarScreen.js`) — reemplazó el placeholder de "en 5 minutos"
4. ✅ Bloque de trabajo por tarea: cualquier tarea (con o sin fecha límite) se
   programa en el día/hora que el usuario elija; la dificultad (fácil/difícil,
   define la duración) también la elige el usuario — lógica en
   `useWorkBlockScheduler.js`, ver `canvas-api.md` para el detalle
5. ✅ **Horario de clases** (`scheduleDb.js` + `ScheduleScreen.js`, nueva
   sección "Horario" en el menú): registro manual del horario fijo (lunes a
   sábado), y cada clase se puede convertir en evento semanal recurrente del
   Calendario del iPhone. Canvas no expone un horario semanal por API, así
   que no hay forma de traerlo automáticamente — ver `docs/decisiones.md`.

## Fase 3 — Envío de entregas (submissions) ✅ Completada

1. ✅ `POST /courses/:id/assignments/:id/submissions` — texto (`online_text_entry`)
   y URL (`online_url`), desde un botón "Entregar tarea" (`useAssignmentSubmission.js`)
2. ✅ Entrega por archivo (`online_upload`) — `expo-document-picker` instalado
   con confirmación del usuario. Flujo de 3 pasos de Canvas: pedir URL de
   subida específica de la tarea, subir el archivo, referenciar el `file_id`
   devuelto en el submission (`canvasApi.js`: `uploadSubmissionFile()` +
   `submitFile()`)

## Extra — Pantalla Cursos (no estaba en el roadmap original) ✅ Completada

`CoursesScreen.js` conecta `getCourses()` y `getAssignments()` de
`canvasApi.js`, que existían pero no se usaban desde ninguna pantalla.
Muestra los cursos activos y, al entrar a uno, todas sus tareas (no solo las
pendientes del to-do list). Usa los mismos hooks que `TasksScreen.js`
(`useWorkBlockScheduler.js`, `useAssignmentSubmission.js`), evitando duplicar
la lógica de programar bloque / entregar tarea.

## Extra — Pantalla "Hoy" (no estaba en el roadmap original) ✅ Completada

`TodayScreen.js`, primera sección del menú: resumen del día en un solo
lugar — tareas urgentes de Canvas, clases de hoy y eventos de hoy del
Calendario del iPhone — en vez de tener que revisar Tareas/Horario/
Calendario por separado. Reutiliza `useWorkBlockScheduler.js` para programar
un bloque directo desde una tarea urgente.

## Extra — Notificaciones locales (no estaba en el roadmap original) ✅ Completada

`expo-notifications` (instalado con permiso amplio del usuario — "te doy
todos los permisos que quieras"), 100% local, sin servidor ni Expo push
token. `notifications.js` programa avisos que se disparan aunque la app
esté cerrada: 10 minutos antes de una clase o evento de hoy, 1 hora antes
de que venza una tarea urgente (`TodayScreen.js`), y 1 día antes del pago de
cada tarjeta de crédito configurada (`FinanceScreen.js`). Limitación real,
documentada: sin un proceso en segundo plano, los avisos se (re)programan
cada vez que se abre la pantalla correspondiente — si la app no se abre en
varios días, esos días no generan aviso.

## Extra — Comparación mes a mes en Finanzas (no estaba en el roadmap original) ✅ Completada

Badge `▲/▼ N% vs. mes pasado` junto a Ingresos y Gastos en `FinanceScreen.js`
— reusa `getMonthSummary()` con el mes actual y el anterior, sin tablas ni
dependencias nuevas.

## Extra — Respaldo/restauración de datos (no estaba en el roadmap original) ✅ Completada

`backup.js` + `SettingsScreen.js` (última sección del menú, "Ajustes").
Finanzas y Horario solo viven en SQLite local — sin este respaldo, perder o
resetear el teléfono significa perder ese historial por completo.
"Exportar respaldo" junta todo en un `.json` y lo comparte con la hoja de
compartir nativa (Archivos, iCloud, correo); "Restaurar desde respaldo" lo
lee de vuelta y reemplaza todos los datos actuales (con confirmación
explícita antes, mostrando la fecha del archivo). `expo-file-system`,
`expo-sharing` y `expo-document-picker` (este último ya estaba instalado).

## Fase 4 — Automatización (n8n) ✅ Completada

El usuario ya tiene n8n corriendo (self-hosted/cloud, fuera de este repo).
Workflows en `automation/` (ver `automation/README.md` para instalación):

1. ✅ **Cron diario que jale tareas de Canvas y notifique por email** —
   `automation/canvas-tareas-nuevas.json`
2. ✅ **Detección de tarea nueva comparando snapshots del `/todo`** — mismo
   workflow; usa el _workflow static data_ de n8n para recordar qué
   assignment IDs ya se vieron, solo notifica los que no estaban antes
3. ✅ **Notas/promedio desde Canvas** — `automation/canvas-promedio-notas.json`.
   Es un promedio **simple**, no ponderado por créditos (Canvas no expone esa
   información de forma genérica); usa `GET /courses?include[]=total_scores`
   en vez de `/users/self/grades`
4. ❌ **Descartado: aviso de material nuevo.** Se construyó y probó
   (`GET /courses/:id/files` por curso), pero la cuenta de Canvas del
   usuario no tiene permiso para listar archivos por API — Canvas devuelve
   error de permisos en cuentas de estudiante según cómo el profesor
   configure el curso. No es arreglable desde este lado; se quitó del
   repo. Ver `docs/decisiones.md`.
5. ✅ **Feed de anuncios** — `automation/canvas-anuncios.json`. Usa
   `GET /users/self/activity_stream` (cubre todos los cursos activos en una
   sola llamada, sin recorrer curso por curso) filtrando solo anuncios.

Se descartó Telegram como canal (el usuario no puede usarlo) — los tres
workflows envían por email vía el nodo SMTP de n8n.

## Rediseño de navegación — ✅ Completado

Pestañas inferiores → menú lateral (Drawer, ícono ☰ arriba a la izquierda),
pedido explícito del usuario. Terminó en `@react-navigation/native` +
`@react-navigation/drawer` **v7** (no v6: su Drawer resultó incompatible de
raíz con Reanimated 4, que Expo SDK 54 exige — 3 rondas de errores en
dispositivo antes de migrar, ver `docs/decisiones.md` para el detalle
completo). Trae `react-native-gesture-handler` + `react-native-reanimated`

- `react-native-worklets`, con `babel.config.js` nuevo en la raíz. Se quitó
  `@react-navigation/bottom-tabs`, sin uso desde el cambio a Drawer. El botón
  "Cerrar sesión" se movió al pie del menú.

## Rediseño visual — ✅ Completado

La app pasó de un estilo claro tipo iOS nativo a un diseño oscuro
"futurista": fondo casi negro con tinte azul-violeta, tarjetas con borde
sutil y resplandor cian, acentos en degradado cian → violeta vía
`expo-linear-gradient` (instalado con confirmación del usuario). Todo sigue
centralizado en `theme.js`/`AppButton.js` — ver `docs/arquitectura.md` y
`docs/decisiones.md`.

## Rediseño de paleta de colores — ✅ Completado

El usuario dio libertad para cambiar los colores. La paleta categórica de
`theme.js` (usada por `colorFromString` para cursos/categorías/eventos) se
reconstruyó de 10 a 7 tonos, validada con la herramienta de paletas
categóricas del skill de dataviz contra el fondo oscuro de la app — la
anterior fallaba (colores muy claros para el fondo oscuro, y el cian de
acento casi idéntico a un teal de la paleta). Se agregó `colors.warning`
como color de estado reservado (antes el aviso de presupuesto usaba un
naranja suelto de la paleta categórica, mezclando roles). Ver
`docs/decisiones.md` para el detalle de la validación.

## Fase 5 — Finanzas personales ✅ Completada (registro manual)

Promovida de "exploración" a fase activa del roadmap, y ya construida por
completo en su versión manual. Plan por pasos:

1. ✅ **Diseño de datos y almacenamiento** — `expo-sqlite` (instalado con
   confirmación del usuario; se descartó JSON simple vía `AsyncStorage`
   porque el historial de movimientos crece indefinidamente y necesita
   agregación por mes/categoría, algo que SQL resuelve gratis). Esquema en
   `financeDb.js`: `accounts` (efectivo/débito/crédito/ahorro), `categories`
   (cada una de tipo `ingreso` o `gasto`), `transactions` (monto siempre
   positivo — el signo lo da la categoría), `budgets` (límite mensual por
   categoría). Incluye siembra de cuentas/categorías por defecto y funciones
   de acceso a datos (`getMonthSummary`, `getBudgetsForMonth`, etc.) — ver el
   archivo para el detalle.
2. ✅ **Tarjeta de crédito — manual, sin conectar a ningún banco.** Se
   evaluó enlazar con Nu directamente (ver `docs/decisiones.md`) y se
   descartó: no tiene API pública para apps personales, y la alternativa
   (agregadores como Belvo/Pluggy) es un servicio de pago de un tercero con
   su propia superficie de credenciales — demasiado para el alcance de esta
   app. Las cuentas de tipo `credito` ahora pueden tener cupo/día de
   corte/día de pago (`credit_limit`, `cutoff_day`, `due_day`), y los
   movimientos tienen `installments` (cuotas, 1 = de contado). El "cuándo
   vence" se calcula al vuelo a partir de esos días, no se guarda una fecha
   fija (`getCreditCards()`, `getCardPurchases()`,
   `getInstallmentProgress()` en `financeDb.js`).
3. ✅ **Registro manual**: `FinanceScreen.js` — 4ta pestaña "Finanzas".
   Selector de mes, resumen (ingresos/gastos/balance), formulario para
   agregar ingreso/gasto (monto, fecha, categoría, cuenta, nota, cuotas si
   la cuenta es de crédito), lista de movimientos del mes (tocar uno lo
   elimina), y apartado de tarjetas de crédito (gasto del corte actual,
   cupo disponible, próxima fecha de pago, ver compras, configurar
   cupo/día de corte/día de pago). Reutiliza `theme.js`/`AppButton.js` como
   el resto de la app.
4. ✅ **Presupuestos y alertas**: sección "Presupuestos del mes" en
   `FinanceScreen.js` — un presupuesto por categoría de gasto, con barra de
   progreso (gastado / presupuestado) que cambia de color: acento normal,
   ámbar (`colors.warning`) al llegar al 80%, rojo al excederlo. Tocar un
   presupuesto lo edita o lo elimina (`setBudget`/`deleteBudget` en
   `financeDb.js`).
5. ✅ **Gráfico "Gastos por categoría"**: barras horizontales en
   `FinanceScreen.js` (la categoría con más gasto marca el 100%), sin
   librería de gráficos — son `View`s con ancho en porcentaje, igual patrón
   que las barras de presupuesto. Nueva consulta `getExpenseByCategory(mes)`
   en `financeDb.js`.
6. **(Futuro, sin decidir)** Automatizar con n8n: parsear notificaciones de
   transacciones bancarias desde Gmail, o esperar a que Open Finance
   Colombia (Decreto 0368/2026, todavía en despliegue) exponga una API
   abierta de bancos.

## Fase 6 — Otras fuentes (exploración, no decidida)

- **Notion**: como base de datos visible de tareas/estado (tiene API REST pública,
  a diferencia de Obsidian)
- **Obsidian + Readwise**: notas locales + sincronización de highlights de lectura
  — sistema independiente, no bloquea nada del proyecto principal
- **Hermes Agent**: framework de agente open source (Nous Research) que combina
  Notion (datos estructurados) + Obsidian (memoria narrativa) — evaluado, no
  adoptado todavía
- **Claude API** (no Claude Code) para el "cerebro" que analiza carga de tareas y
  sugiere horario — distinto de Claude Code, que se usa para desarrollar la app

## Fase 7 — Calidad de código y resiliencia (revisión de arquitectura 2026-08-16)

Ver `docs/decisiones.md` para el detalle completo de cada hallazgo. Orden
pensado por impacto/riesgo: primero lo mecánico y de bajo riesgo, después
lo que requiere decisión o instalación nueva.

1. ✅ **Utilidades de fecha/hora/dinero compartidas** — `formatters.js`.
   Antes duplicadas de forma independiente en `FinanceScreen.js` y
   `ScheduleScreen.js` (confirmado con `pad2`, mismo cuerpo en ambos).
2. ✅ **Split de los archivos "dios" por pantalla** — `FinanceScreen.js`
   (904 líneas) y `ScheduleScreen.js` dividieron sus modales
   (`AddTransactionModal.js`, `CardPurchasesModal.js`,
   `ConfigCardModal.js`, `BudgetModal.js`, `AddClassModal.js`) a archivos
   propios, con estilos compartidos vía `financeStyles.js`/
   `scheduleStyles.js`.
3. ✅ **`ErrorBoundary.js`** en la raíz de `App.js` — sin dependencias
   nuevas, evita pantalla en blanco sin recuperación ante un error de
   render no capturado.
4. ✅ **ESLint + Prettier** como devDependencies — confirmado por el
   usuario. `npx expo lint` instaló `eslint@^9` + `eslint-config-expo`
   (config oficial de Expo, flat config en `eslint.config.js`) y agregó el
   script `npm run lint`. Se sumó `prettier` + `eslint-config-prettier`
   (desactiva las reglas de estilo de ESLint que compiten con Prettier —
   Prettier manda en formato, ESLint en correctitud/calidad), con
   `.prettierrc.json` (comillas simples, punto y coma, `printWidth` 120,
   coma final estilo ES5, ya el estilo que el código venía usando a mano)
   y los scripts `npm run format` / `npm run format:check`. Primera
   corrida de `eslint .` sobre todo el proyecto: **0 errores, 3 warnings**
   preexistentes y menores (imports duplicados de
   `react-native-gesture-handler` en `App.js`, una dependencia de
   `useEffect` en `schedulePicker.js`) — confirma que el código ya estaba
   razonablemente sano, el linter ahora solo evita que se degrade.
   `prettier --check` marcó 29 archivos con formato distinto al que
   Prettier hubiera elegido (normal: el código no se escribió con
   Prettier desde el principio) — **no se corrió `--write` todavía**, a
   propósito: el árbol tenía cambios sin commitear de una sesión anterior
   y reformatear todo ahora hubiera mezclado cambios de formato con esos
   cambios funcionales, complicando la revisión. Queda para después de
   que el usuario haga commit de su trabajo en curso.
5. ✅ **Tests unitarios con Jest** sobre la lógica de dinero de
   `financeDb.js` — confirmado por el usuario. `npx expo install jest-expo
jest --dev` instaló las versiones alineadas al SDK; `financeDb.test.js`
   cubre `getInstallmentProgress` (progreso de cuotas) y
   `lastCutoffDate`/`nextDueDate` (corte y próximo pago de tarjeta,
   incluyendo cruce de año), **13 tests, todos en verde**. `expo-sqlite` se
   mockea en el test porque estas funciones son puras — no tocan la base
   de datos real. `lastCutoffDate`/`nextDueDate`/`toIsoDate` pasaron de
   privadas del módulo a exportadas para poder probarlas directamente, sin
   cambiar su comportamiento.

   Escribiendo el test se encontró un bug real (no hipotético):
   `getInstallmentProgress` parseaba `transaction.date` ('YYYY-MM-DD') con
   `new Date(...)` a secas, que JS interpreta como **UTC** — en Colombia
   (UTC-5) eso corre la fecha de la compra un día hacia atrás y puede
   adelantar o atrasar en 1 el número de cuotas que la app muestra como ya
   "cobradas" cerca de un aniversario mensual. Es exactamente el mismo
   error que `formatters.js` ya documenta y evita (`parseIsoDate`) en el
   resto de la app — `getInstallmentProgress` simplemente nunca se
   actualizó para usarlo. **Corregido** en la misma sesión: ahora usa
   `parseIsoDate`. Ver `docs/decisiones.md`.

6. ✅ **Caché de la última respuesta buena de Canvas** para
   `TasksScreen.js`/`CoursesScreen.js` — `canvasCache.js`, sin dependencias
   nuevas (reusa `expo-file-system`, la misma API que `backup.js`, pero en
   `Paths.cache` en vez de `Paths.document`: es contenido desechable que
   el sistema puede borrar si falta espacio, a diferencia del respaldo).
   Cada fetch exitoso sobrescribe la única copia guardada de ese endpoint
   (`saveCache(key, data)`); si el fetch falla, se intenta `loadCache(key)`
   antes de mostrar el error — si hay caché, se muestran esos datos con un
   aviso ("Sin conexión — mostrando datos del ..."), y solo si tampoco hay
   caché se muestra el error como antes. No cachea el detalle de tareas
   por curso (`getAssignments`) — el caso de uso real es no llegar a clase
   con la pantalla principal vacía, no navegar sin conexión.
7. **(Pendiente, sin dependencias nuevas, bajo valor al tamaño actual)**
   Reorganizar los 21 archivos de la raíz en carpetas (`screens/`,
   `components/`, `db/`, `hooks/`). No aporta nada urgente a 21 archivos;
   se vuelve valioso solo si la app sigue creciendo en número de
   pantallas/módulos — no ejecutar hasta que eso pase.

## Decisiones de distribución (no técnicas, pero relevantes)

- App **solo para uso personal**, nunca se publicará en App Store
- Se descartó pagar la cuenta de Apple Developer ($99/año) solo para evitar la
  reinstalación cada 7 días — se usa Expo Go en modo desarrollo permanente
- Plan Free de Expo/EAS es más que suficiente (15 builds iOS/mes, 1000 MAU) para
  uso individual
