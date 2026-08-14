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

## Fase 4 — Automatización (n8n) — Parcial
El usuario ya tiene n8n corriendo (self-hosted/cloud, fuera de este repo).
Workflows en `automation/` (ver `automation/README.md` para instalación):
1. ✅ **Cron diario que jale tareas de Canvas y notifique por email** —
   `automation/canvas-tareas-nuevas.json`
2. ✅ **Detección de tarea nueva comparando snapshots del `/todo`** — mismo
   workflow; usa el *workflow static data* de n8n para recordar qué
   assignment IDs ya se vieron, solo notifica los que no estaban antes
3. ✅ **Notas/promedio desde Canvas** — `automation/canvas-promedio-notas.json`.
   Es un promedio **simple**, no ponderado por créditos (Canvas no expone esa
   información de forma genérica); usa `GET /courses?include[]=total_scores`
   en vez de `/users/self/grades`
4. **Pendiente:** descarga automática de material nuevo de cursos
5. **Pendiente:** feed unificado de anuncios de todos los cursos

Se descartó Telegram como canal (el usuario no puede usarlo) — ambos
workflows envían por email vía el nodo SMTP de n8n.

## Rediseño de navegación — ✅ Completado
Pestañas inferiores → menú lateral (Drawer, ícono ☰ arriba a la izquierda),
pedido explícito del usuario. Terminó en `@react-navigation/native` +
`@react-navigation/drawer` **v7** (no v6: su Drawer resultó incompatible de
raíz con Reanimated 4, que Expo SDK 54 exige — 3 rondas de errores en
dispositivo antes de migrar, ver `docs/decisiones.md` para el detalle
completo). Trae `react-native-gesture-handler` + `react-native-reanimated`
+ `react-native-worklets`, con `babel.config.js` nuevo en la raíz. Se quitó
`@react-navigation/bottom-tabs`, sin uso desde el cambio a Drawer. El botón
"Cerrar sesión" se movió al pie del menú.

## Rediseño visual — ✅ Completado
La app pasó de un estilo claro tipo iOS nativo a un diseño oscuro
"futurista": fondo casi negro con tinte azul-violeta, tarjetas con borde
sutil y resplandor cian, acentos en degradado cian → violeta vía
`expo-linear-gradient` (instalado con confirmación del usuario). Todo sigue
centralizado en `theme.js`/`AppButton.js` — ver `docs/arquitectura.md` y
`docs/decisiones.md`.

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
   naranja al llegar al 80%, rojo al excederlo. Tocar un presupuesto lo
   edita o lo elimina (`setBudget`/`deleteBudget` en `financeDb.js`).
5. **(Futuro, sin decidir)** Automatizar con n8n: parsear notificaciones de
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

## Decisiones de distribución (no técnicas, pero relevantes)
- App **solo para uso personal**, nunca se publicará en App Store
- Se descartó pagar la cuenta de Apple Developer ($99/año) solo para evitar la
  reinstalación cada 7 días — se usa Expo Go en modo desarrollo permanente
- Plan Free de Expo/EAS es más que suficiente (15 builds iOS/mes, 1000 MAU) para
  uso individual
