# Contexto del proyecto para Claude Code

Este archivo se lee automáticamente. Antes de proponer cambios, ten en cuenta:

## Qué es este proyecto
App personal (Hector) para iPhone en React Native + Expo. Uso 100% individual,
nunca se va a publicar en App Store. Corre en modo desarrollo vía Expo Go —
no asumas que hay un development build ni EAS Build configurado a menos que se
indique lo contrario.

## Stack fijo — no cambiar sin confirmar con el usuario
- Expo SDK **54** (React Native 0.81.4, React 19.1.0) — ya hubo un incidente de
  incompatibilidad con SDK 51, corregido. No degradar la versión.
- Node.js LTS (24.x)
- `expo-secure-store` para cualquier credencial (nunca AsyncStorage, nunca texto
  plano)
- `expo-calendar` para el calendario — **no** agregar Google Calendar API ni
  Microsoft Graph, fue una decisión explícita descartar ambos (ver
  `docs/calendario.md`)
- `expo-file-system` (v19+, SDK 54) usa la API nueva basada en clases
  `File`/`Directory`/`Paths` (`backup.js`) — **no** usar la API legacy
  (`FileSystem.documentDirectory`, `writeAsStringAsync`, etc., disponible
  solo vía `expo-file-system/legacy`) en código nuevo.
- Navegación: `@react-navigation/drawer` **v7** (menú lateral ☰, no pestañas
  inferiores) — pedido explícito del usuario, elegido sobre un menú a la
  medida sin dependencias nuevas. **No degradar a v6**: su Drawer usa
  `useAnimatedGestureHandler`, una función que Reanimated 3+ eliminó de su
  API — v6 nunca se actualizó y no hay forma de hacerlo funcionar con el
  Reanimated que Expo SDK 54 exige (ver `docs/decisiones.md` para las 3
  rondas de errores que llevaron a esta conclusión). Requiere
  `react-native-gesture-handler` + `react-native-reanimated` y un
  `babel.config.js` en la raíz con el plugin de Reanimated al final — **no
  lo borres ni cambies el orden de los plugins**. `babel-preset-expo` está
  como devDependency explícita porque no es resoluble desde la raíz si solo
  queda anidada dentro de `expo/`. `react-native-worklets` (peer de
  Reanimated) debe quedar declarado explícitamente en `package.json` — si
  npm lo instala solo como dependencia transitiva puede resolver una
  versión más nueva que la que Expo Go trae precompilada para el SDK, y
  la app truena con `Exception in HostFunction` al iniciar. Ante cualquier
  duda sobre versiones de módulos nativos, correr `npx expo install --check`
  antes de asumir que el código está mal.

## Reglas de seguridad de este proyecto
- Nunca hardcodear tokens, API keys, ni client IDs en el código — siempre vía
  `expo-secure-store` o variables de entorno.
- El usuario ya tuvo un incidente donde compartió un token de Canvas en texto
  plano — sé explícito si detectas algo similar en el código o en un commit.

## Alcance — qué NO construir aquí
- **No** construir tracking de gimnasio (series, pesos, progreso) — eso vive en la
  app externa Liftoff. Esta app solo crea el bloque de horario.
- **No** agregar integraciones de Notion/Obsidian todavía — están en
  `docs/planner.md` (Fase 6) como exploración futura, no como trabajo pendiente
  activo. n8n es la excepción: ya hay workflows en `automation/` (ver más abajo).
- **Finanzas ya no está descartada** — Fase 5 del roadmap, completa en su
  versión manual (ver `docs/planner.md`): `expo-sqlite` (con confirmación
  del usuario), esquema en `financeDb.js` (`accounts`, `categories`,
  `transactions`, `budgets`) y pantalla `FinanceScreen.js` con registro
  manual, resumen del mes, presupuestos con barra de progreso, y tarjeta de
  crédito — todo manual, sin conexión a ningún banco (se evaluó y descartó
  enlazar con Nu, ver `docs/decisiones.md`).
- **`automation/` no es código de la app.** Son workflows de n8n (JSON) que
  corren en la instancia de n8n del usuario, fuera de este proyecto Expo —
  no tienen `package.json`, no se instalan, no corren con `expo start`. Solo
  se versionan acá para tenerlos en git. Nunca poner un token o contraseña
  real dentro de esos `.json` — las credenciales viven únicamente en el
  almacén cifrado de n8n (ver `automation/README.md`).

## Convenciones del proyecto
- Comentarios de cabecera en cada archivo explicando su propósito (ver archivos
  existentes como referencia de estilo)
- Español para nombres de UI visibles al usuario (textos, labels); inglés para
  nombres de variables/funciones
- Cambios pequeños y acotados — el usuario prefiere ediciones puntuales sobre
  archivos existentes, no regeneración completa de la carpeta
- **Diseño visual: usar `theme.js` y `AppButton.js`, no valores sueltos.** El
  estilo de la app es oscuro y "futurista" (fondo casi negro con tinte
  azul-violeta, tarjetas con borde sutil y resplandor cian, acentos en
  degradado cian → violeta vía `expo-linear-gradient`) y ya está aplicado a
  todas las pantallas — ver `docs/arquitectura.md`. Nunca usar `<Button>` de
  `react-native` directamente ni colores hex sueltos en pantallas nuevas; usar
  `AppButton` (variantes `primary`/`secondary`/`neutral`/`plain`, `gradients`
  de `theme.js`) y los tokens de `theme.js`. Para colorear cursos/eventos usar
  `colorFromString(texto)` de `theme.js` (asigna un color consistente de
  `palette` al mismo texto), no colores fijos, salvo que el color tenga un
  significado semántico (rojo = urgente/conflicto, verde = éxito, ámbar =
  aviso/`colors.warning`) — un color de estado nunca sale de `palette`, y
  viceversa (ver `docs/decisiones.md`, la paleta se reconstruyó completa una
  vez ya por mezclar ambos roles). `palette` tiene 7 colores, validados con
  la herramienta de paletas categóricas del skill de dataviz contra el fondo
  oscuro de la app — si se vuelve a tocar, revalidar con esa misma
  herramienta antes de asumir que un color nuevo "se ve bien".
- **El selector de fecha/hora al programar un bloque de trabajo NUNCA debe
  sugerir una hora cercana a la fecha límite de la tarea.** Ya se intentó
  (`due_at - duración`) y el usuario pidió quitarlo explícitamente — el
  selector debe partir siempre de "ahora + 5 min" y dejar que el usuario
  elija libremente. No reintroducir ese cálculo.

## Antes de instalar una librería nueva
Confirma con el usuario primero si es una dependencia grande (cambia
`package.json` de forma significativa) — prefiere minimizar los `npm install`
grandes tras la fricción de reinstalaciones repetidas en versiones anteriores del
proyecto.

## Estado del roadmap (ver docs/planner.md para detalle completo)
Fases 1, 2 y 3 completas. Fase 2: cualquier tarea (con o sin fecha límite) se
puede programar como bloque de trabajo en el día/hora que el usuario elija
(dificultad manual: fácil/difícil), vía el hook `useWorkBlockScheduler.js`
(compartido por `TasksScreen.js` y `CoursesScreen.js`). Fase 3: entrega de
tareas por texto, URL o archivo (`expo-document-picker`, instalado con
confirmación del usuario), vía el hook `useAssignmentSubmission.js`.

Extra no planeado originalmente, ya completado: pantalla `CoursesScreen.js`
que lista cursos activos y todas las tareas de cada uno (no solo las
pendientes), conectando `getCourses()`/`getAssignments()` que existían sin
usarse.

Fase 4 (automatización n8n) completa: tres workflows en `automation/` —
avisar por email tareas nuevas del `/todo`, notas (promedio simple), y feed
de anuncios (`activity_stream`, cubre todos los cursos en una llamada). Se
descartó un cuarto workflow de "material nuevo" (`GET /courses/:id/files`
por curso): la cuenta del usuario no tiene permiso de Canvas para listar
archivos por API — no reintentar este enfoque a menos que el usuario
confirme que el permiso cambió. Ver `docs/decisiones.md`.

Rediseño visual (oscuro, "futurista", `expo-linear-gradient`) completado —
ver `docs/decisiones.md`. Rediseño de navegación completado: menú lateral
(Drawer) en vez de pestañas inferiores, con Tareas/Cursos/Horario/
Calendario/Finanzas y "Cerrar sesión" al pie del menú. Horario de clases
nuevo (`scheduleDb.js` + `ScheduleScreen.js`): registro manual lunes-sábado,
cada clase se puede agendar como evento semanal recurrente en el Calendario.
Fase 5 (Finanzas personales) completa en su versión manual: esquema SQLite
(`financeDb.js`) y pantalla `FinanceScreen.js` — registro manual, resumen
del mes, gráfico de "Gastos por categoría", presupuestos con barra de
progreso, tarjeta de crédito. Extra no planeado: pantalla `TodayScreen.js`
("Hoy", primera sección del menú) con tareas urgentes + clases de hoy +
eventos de hoy en un solo lugar; notificaciones locales
(`notifications.js`, `expo-notifications`, sin backend) 10 min antes de una
clase/evento, 1h antes del vencimiento de una tarea urgente, 1 día antes
del pago de una tarjeta; pantalla `SettingsScreen.js` ("Ajustes", última
sección del menú) con exportar/restaurar respaldo de Finanzas y Horario
(`backup.js`, `expo-file-system` API nueva + `expo-sharing` +
`expo-document-picker`) — restaurar reemplaza todos los datos actuales, es
destructivo a propósito, con confirmación explícita antes. Paleta de
colores reconstruida (7 tonos validados, ver `docs/decisiones.md`). Fase 6
(Notion/Obsidian) sigue siendo exploración, no trabajo pendiente activo —
ver "Alcance" arriba.

**Lección de esta sesión, para no repetir:** ante un bug visual reportado
sin poder reproducirlo leyendo el código, pedir una captura de pantalla
antes de proponer un fix. Ver `docs/decisiones.md` para el detalle completo.

**`DateTimePicker` nativo de iOS (`display="inline"`/`"spinner"`) no se
estira con `style.width`** — su dibujo tiene tamaño fijo/intrínseco y deja
el resto del marco vacío en vez de crecer o centrarse. La forma correcta de
evitar espacio muerto a un lado es NO ponerle `width` y usar
`alignSelf: 'center'` en su lugar (ver `schedulePicker.js`, `FinanceScreen.js`,
`ScheduleScreen.js`). No reintroducir un `width` fijo/calculado en estos
pickers.
