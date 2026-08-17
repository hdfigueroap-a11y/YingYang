# Calendario

## Decisión final: Calendario nativo del iPhone (`expo-calendar`)

No se usa ninguna cuenta externa (ni Google, ni Microsoft). La app pide permiso de
sistema una sola vez (`NSCalendarsUsageDescription` en `app.json`) y desde ahí crea
eventos directo en el calendario "por defecto" configurado en el iPhone
(Ajustes > Calendario).

- Si el usuario tiene su cuenta de Google Calendar sincronizada como cuenta del
  sistema en el iPhone, y la marca como predeterminada, los eventos también
  aparecen ahí — sin que la app tenga que hablar con la API de Google.
- Compatible con Expo Go SDK 54, no requiere development build.

## Archivo relevante

`deviceCalendar.js` — wrapper de `expo-calendar`:

- `requestPermission()` / `hasPermission()`
- `createEvent({ title, notes, startDate, endDate })`
- `listUpcomingEvents(days)`
- `listEventsForDay(date)` — eventos de un día específico, usado por el
  selector de fecha/hora en iOS para mostrar los compromisos existentes

`schedulePicker.js` — selector de fecha/hora reutilizable:

- **Android:** diálogo nativo encadenado fecha→hora vía `openAndroidPicker()`
  (el propio diálogo de fecha de Android ya se ve como calendario mensual).
- **iOS:** `<SchedulePickerModal>`. Muestra un calendario mensual real
  (`display="inline"` de `@react-native-community/datetimepicker`, sin
  necesidad de ninguna librería nueva) para la fecha, un spinner para la hora,
  y debajo la lista de eventos que ya existen ese día en el Calendario del
  iPhone (vía `deviceCalendar.listEventsForDay()`), para evitar choques de
  horario al programar un bloque. El calendario inline de iOS permite tocar el
  encabezado mes/año para escribir la fecha con teclado numérico; el modal
  está envuelto en `KeyboardAvoidingView` para que ese teclado no tape el
  spinner de hora ni los botones de confirmar/cancelar.
  - **Día y hora son estado local del modal**, no un valor controlado desde
    el padre (`date`+`onChange`) que se reconstruye en cada cambio. La
    primera versión combinaba ambos en un solo `Date` y lo mandaba de vuelta
    al padre en cada cambio de cualquiera de los dos pickers — como ambos
    `DateTimePicker` (fecha y hora) quedaban controlados por ese mismo valor
    combinado, cambiar uno terminaba pisando el cambio del otro en el
    siguiente render, y la fecha parecía "atascada" en el valor inicial. Se
    corrigió con dos estados independientes (`day`, `time`) dentro del
    propio modal; `initialDate` solo siembra el valor la primera vez que se
    abre, y `onConfirm(fecha)` recién arma el `Date` final al confirmar.
  - **`themeVariant="light"`** en ambos `DateTimePicker` (fecha y hora).
    Sin esto, el picker sigue el modo claro/oscuro del sistema del iPhone —
    con el teléfono en modo oscuro, pintaba los números en blanco sobre el
    fondo claro del modal (esta app no tiene modo oscuro implementado),
    haciéndolos invisibles. Forzarlo a claro los mantiene legibles siempre.
  - **`style={{ width: '100%' }}`** en ambos `DateTimePicker`. El calendario
    en modo `inline` no ocupa todo el ancho disponible por sí solo y dejaba
    un espacio vacío a la derecha del modal.

Usado directamente por `CalendarScreen.js`, y también por el hook
`useWorkBlockScheduler.js` (que a su vez comparten `TasksScreen.js` y
`CoursesScreen.js`).

`CalendarScreen.js` — pantalla con:

- Botón de pedir permiso (si no se ha otorgado)
- Bloques rápidos: Sueño (8h), Lectura (1h), Gimnasio (1h), Trabajo — tarea difícil
  (2h), Trabajo — tarea fácil (1h) — cada uno abre el selector real de fecha/hora
  (sugiere "ahora + 5 min", ajustable) antes de crear el evento
- Lista de próximos eventos (7 días)

**Selector real de fecha/hora: implementado.** Ya no se usa el placeholder de
"+5 minutos" fijo — ese valor ahora es solo la sugerencia inicial que el usuario
puede cambiar en el picker antes de confirmar.

**Bloque de trabajo por tarea: implementado** (ver `canvas-api.md` y
`planner.md` para el detalle — vive en el hook `useWorkBlockScheduler.js`,
compartido por `TasksScreen.js` y `CoursesScreen.js`, no en `CalendarScreen.js`).
La dificultad la elige el usuario, no se infiere automáticamente.

**Permiso de Calendario pedido también desde Tareas/Cursos.** A diferencia de
`CalendarScreen.js` (que solo muestra su UI después de tener el permiso),
Tareas o Cursos pueden ser la primera pantalla que abre el usuario — si
todavía no otorgó el permiso, `useWorkBlockScheduler.js` lo pide en el momento
de programar un bloque, en vez de fallar en silencio.

## Bloque de gimnasio — alcance limitado a propósito

Solo se crea el **bloque de horario** (cuándo entrenar). El logging de series,
pesos, repeticiones y progreso NO se construye en esta app — se sigue usando la
app **Liftoff** en paralelo para eso, porque no tiene API pública y no es
integrable.

---

## Historial de decisiones descartadas (por qué no se usó Google/Microsoft)

### Google Calendar API (descartado)

- Requería habilitar Google Calendar API en Google Cloud Console.
- Al crear las credenciales OAuth, Google Cloud exigió vincular una **cuenta de
  Facturación de Cloud** con un **prepago único de COP 30.000**.
- El prepago es reembolsable si se cierra la cuenta de Facturación, y no genera
  cargos recurrentes mientras el uso esté dentro del límite gratuito — pero
  representaba fricción y una dependencia de una cuenta de pago para algo que
  debía ser gratis.
- Cambiar a una cuenta académica no resuelve el problema: el requisito de
  facturación aplica al **proyecto de Cloud**, no a qué tan personal/académica sea
  la cuenta. Además, cuentas de Google Workspace for Education administradas por
  la universidad suelen tener bloqueada la creación de cuentas de Facturación para
  estudiantes.

### Microsoft Graph / Azure App Registration (descartado)

- Alternativa evaluada tras el bloqueo de Google: Microsoft Graph no exige cuenta
  de facturación para uso gratuito de la Calendar API.
- Sin embargo, al intentar registrar la app en Azure con la cuenta institucional,
  el registro no se permitió (restricción de permisos de administrador a nivel de
  la organización — común en cuentas de Microsoft 365 for Education).
- Solución intentada: usar una cuenta Microsoft **personal** (no institucional,
  sin licencia de Microsoft 365) para el registro de la App en Azure — las cuentas
  personales no requieren licencia ni aprobación de administrador.
- Finalmente se abandonó esta ruta también, a favor del Calendario nativo del
  iPhone, que elimina el problema de raíz (no depende de ningún proveedor externo).
