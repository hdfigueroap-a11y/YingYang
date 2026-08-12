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

## Fase 4 — Automatización (n8n) — No iniciada
Ideas evaluadas conceptualmente, no implementadas:
- Cron diario que jale tareas de Canvas y notifique por Telegram/WhatsApp/email
- Detección de tarea nueva comparando snapshots del `/todo`
- Notas/promedio ponderado desde `/users/self/grades`
- Descarga automática de material nuevo de cursos
- Feed unificado de anuncios de todos los cursos

## Fase 5 — Otras fuentes (exploración, no decidida)
- **Notion**: como base de datos visible de tareas/estado (tiene API REST pública,
  a diferencia de Obsidian)
- **Obsidian + Readwise**: notas locales + sincronización de highlights de lectura
  — sistema independiente, no bloquea nada del proyecto principal
- **Hermes Agent**: framework de agente open source (Nous Research) que combina
  Notion (datos estructurados) + Obsidian (memoria narrativa) — evaluado, no
  adoptado todavía
- **Finanzas**: Open Finance Colombia (Decreto 0368/2026, obligatorio para bancos)
  todavía en despliegue; alternativa evaluada: parsear notificaciones de
  transacciones desde Gmail vía n8n
- **Claude API** (no Claude Code) para el "cerebro" que analiza carga de tareas y
  sugiere horario — distinto de Claude Code, que se usa para desarrollar la app

## Decisiones de distribución (no técnicas, pero relevantes)
- App **solo para uso personal**, nunca se publicará en App Store
- Se descartó pagar la cuenta de Apple Developer ($99/año) solo para evitar la
  reinstalación cada 7 días — se usa Expo Go en modo desarrollo permanente
- Plan Free de Expo/EAS es más que suficiente (15 builds iOS/mes, 1000 MAU) para
  uso individual
