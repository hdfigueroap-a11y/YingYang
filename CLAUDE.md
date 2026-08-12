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

## Reglas de seguridad de este proyecto
- Nunca hardcodear tokens, API keys, ni client IDs en el código — siempre vía
  `expo-secure-store` o variables de entorno.
- El usuario ya tuvo un incidente donde compartió un token de Canvas en texto
  plano — sé explícito si detectas algo similar en el código o en un commit.

## Alcance — qué NO construir aquí
- **No** construir tracking de gimnasio (series, pesos, progreso) — eso vive en la
  app externa Liftoff. Esta app solo crea el bloque de horario.
- **No** agregar integraciones de Notion/Obsidian/finanzas todavía — están en
  `docs/planner.md` como exploración futura, no como trabajo pendiente activo.
  n8n es la excepción: ya hay workflows en `automation/` (ver más abajo).
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
  estilo de la app (colores, radios, espaciados, tipografía) ya está aplicado
  a todas las pantallas — ver `docs/arquitectura.md`. Nunca usar `<Button>` de
  `react-native` directamente ni colores hex sueltos en pantallas nuevas; usar
  `AppButton` (variantes `primary`/`secondary`/`neutral`/`plain`) y los
  tokens de `theme.js`. El usuario pidió explícitamente que la app se vea
  colorida — para colorear cursos/eventos usar `colorFromString(texto)` de
  `theme.js` (asigna un color consistente de `palette` al mismo texto), no
  colores fijos, salvo que el color tenga un significado semántico (rojo =
  urgente/conflicto, verde = éxito).
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

Fase 4 (automatización n8n) parcial: dos workflows en `automation/` — avisar
por email tareas nuevas del `/todo`, y avisar por email cuando cambian las
notas (promedio simple). Ideas de Fase 4 sin construir: descarga automática
de material nuevo, feed de anuncios. Fase 5 (Notion/Obsidian/finanzas) sigue
siendo exploración, no trabajo pendiente activo — ver "Alcance" arriba.
