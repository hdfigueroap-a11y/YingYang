# Registro de decisiones

Formato: **Decisión** — Contexto / por qué.

---

**No publicar en App Store, uso 100% personal.**
Evita cuenta de Apple Developer ($99/año). Se usa Expo Go en modo desarrollo.

**No pagar Apple Developer solo para evitar reinstalar cada 7 días.**
Alternativas evaluadas: AltStore/SideStore (refirmado automático). Finalmente se
mantuvo Expo Go como flujo principal de uso, dado que el proyecto sigue en
desarrollo activo.

**Stack: React Native + Expo (con Expo Go, sin Mac).**
Reutiliza experiencia previa en React. Expo Go permite probar en iPhone físico sin
Mac ni cuenta de Apple Developer. EAS Build (cuando se necesite un build
standalone) compila en la nube sin requerir Xcode local.

**Node.js: usar la versión LTS (24.x a la fecha).**
Evitar la versión "Current" (26.x) por menor estabilidad con el ecosistema Expo.

**Expo SDK 54 (no 51).**
Ajustado tras un error de incompatibilidad: la versión instalada de Expo Go en el
iPhone era SDK 54; el proyecto se había generado originalmente en SDK 51.
Actualizado `package.json` a `expo ~54.0.0`, `react 19.1.0`, `react-native 0.81.4`.

**Token de Canvas: nunca compartir en chat.**
Ocurrió un incidente donde se pegó un token real en la conversación. Se indicó
revocarlo inmediatamente desde Canvas y generar uno nuevo. Regla permanente:
tokens y credenciales solo van en `.env` / `expo-secure-store`, nunca en texto
plano visible.

**Calendario: nativo del iPhone, no Google ni Microsoft.**
Ver detalle completo en `calendario.md`. Resumen: Google Cloud exigía prepago de
facturación; Microsoft Azure bloqueó el registro con cuenta institucional. La
alternativa de `expo-calendar` elimina la dependencia de cualquier proveedor
externo, es gratis, y no requiere login de ningún tipo (solo permiso de sistema).

**Gimnasio: solo bloque de horario en la app; logging en Liftoff (app externa).**
Liftoff no tiene API pública — no es integrable. Construir tracking de
series/pesos/progreso desde cero en la app propia se descartó por ser trabajo
redundante frente a una app que ya lo hace bien.

**Control de versiones: Git (local, GitHub opcional privado).**
Motivado por la fricción de recibir el proyecto completo re-empaquetado en cada
cambio (zips sucesivos con Google → Microsoft → Calendario nativo). Con Git, los
cambios futuros se aplican como ediciones puntuales sobre archivos existentes, con
posibilidad de revertir (`git checkout`) si algo falla.

**Desarrollo asistido por Claude Code, operando directo sobre el repo.**
Instalado nativamente en Windows (`irm https://claude.ai/install.ps1 | iex`), sin
depender de WSL (ya se contaba con Git for Windows, que cumple el requisito
alternativo de Claude Code en Windows). Se usa para implementar cambios puntuales
sobre archivos ya existentes; las decisiones de arquitectura y planeación se
siguen discutiendo en el chat.

**Navegación: menú lateral (Drawer) en vez de pestañas inferiores.**
Pedido explícito del usuario. Se ofreció como alternativa un menú a la
medida sin dependencias nuevas (recomendado, por la regla del proyecto de
minimizar instalaciones grandes), pero el usuario prefirió el Drawer oficial
de `@react-navigation` a sabiendas de que trae dependencias más grandes:
`react-native-gesture-handler` y `react-native-reanimated` (esta última
necesita su propio `babel.config.js` con el plugin de Reanimated al final).
Se instaló `@react-navigation/drawer` fijado en `^6` (no la v7, que exige
`@react-navigation/native` v7 y hubiera forzado a migrar todo el stack de
navegación existente) — v6 está deprecada pero sigue siendo compatible con
el resto del proyecto, que ya usa v6 en todos lados.

Al agregar `babel.config.js`, Metro dejó de poder bundlear: `babel-preset-expo`
solo estaba instalado anidado dentro de `node_modules/expo/`, no en la raíz,
así que no era resoluble desde un `babel.config.js` en la raíz del proyecto.
Se agregó `babel-preset-expo` como devDependency explícita (misma versión que
la anidada) para arreglarlo — verificado con un bundle completo de Metro
antes de darlo por bueno.

En el dispositivo apareció además `Exception in HostFunction` al abrir la
app — `npx expo install --check` reveló que `react-native-screens`,
`react-native-safe-area-context`, `expo-calendar`, `expo-secure-store`,
`expo-status-bar` y `react-native` mismo llevaban tiempo desalineados de lo
que Expo SDK 54 espera (nadie los había corrido desde que se fijó el SDK).
El Drawer depende de `react-native-screens`/`safe-area-context` para el
gesto de deslizar, así que una versión nativa vieja frente al JS instalado
bastaba para tumbar la app al iniciar. Se corrigió con
`npx expo install --fix`, que también agregó automáticamente el config
plugin de `expo-secure-store` a `app.json` (ya se usaba en el código, solo
faltaba declarado). Lección: correr `npx expo install --check` de vez en
cuando, no solo al instalar algo nuevo.

Ese arreglo no fue suficiente — la app seguía tumbándose con `Exception in
HostFunction` al iniciar. Causa real: Reanimated 4 delega su runtime nativo
de "worklets" en el paquete separado `react-native-worklets` (el plugin de
Babel `react-native-reanimated/plugin` es solo un re-export de
`react-native-worklets/plugin`, así que el babel.config.js ya estaba bien).
`npm install` lo había traído como dependencia transitiva en la versión más
nueva que satisface el rango de Reanimated (0.8.3), pero nunca pasó por
`npx expo install`, así que nadie validó que coincidiera con lo que el
binario de Expo Go para SDK 54 trae precompilado — que resultó ser 0.5.1.
Ese desfase JS/nativo es justo lo que produce un `HostFunction Exception` al
inicializar el módulo. Se corrigió con `npx expo install react-native-worklets`,
que lo declaró explícitamente en `package.json` y lo fijó en 0.5.1. No aplica
`pod install`/rebuild nativo aquí — este proyecto corre en Expo Go (sin
carpetas `ios`/`android` ni EAS Build), así que el binario nativo no es
compilable localmente: la única fuente de verdad de qué versión nativa
existe es el manifiesto de compatibilidad de `npx expo install`, nunca lo
que npm resuelva por su cuenta.

Con eso resuelto apareció un tercer error, ya en el propio código de
`@react-navigation/drawer` v6.7.2: `useLegacyImplementation not available
with Reanimated 3`. Causa: el paquete decide internamente si usar su
implementación vieja (Reanimated 1) con
`useLegacyImplementation = !Reanimated.isConfigured?.()` — esa detección no
reconoce bien a Reanimated 4 (el paquete está deprecado, "no longer
supported" según el propio warning de npm al instalarlo) y por defecto cae
en `true`, que Reanimated 3+ rechaza de plano. Se corrigió forzando
`useLegacyImplementation={false}` explícitamente en `<Drawer.Navigator>`
(en `App.js`) — evita la detección rota y usa la implementación moderna del
paquete, que sí es compatible.

Ese arreglo tampoco alcanzó: la implementación "moderna" de Drawer v6
también usa por dentro `useAnimatedGestureHandler` de Reanimated, una
función que Reanimated 3+ **eliminó por completo** de su API (no es un
prop mal configurado, la función ya no existe). No hay combinación de
versiones dentro de Drawer v6 que funcione con el Reanimated 4 que Expo
SDK 54 exige — el paquete simplemente nunca se actualizó para el Reanimated
moderno (de ahí el warning de "no longer supported" al instalarlo). Se le
presentó la disyuntiva al usuario (migrar todo el stack de navegación a v7,
o volver al menú a la medida sin Drawer) y **se eligió migrar a v7**:
`@react-navigation/native@^7` + `@react-navigation/drawer@^7`, construido
para el Gesture API/Reanimated moderno. De paso se quitó
`@react-navigation/bottom-tabs`, que había quedado instalado sin usarse
desde que se cambió a Drawer. `useLegacyImplementation` no existe en v7 (la
detección rota que causaba los dos errores anteriores desapareció junto
con el código legacy) — se quitó el prop y su comentario en `App.js`.

Ya con la app corriendo, el título del menú ("Canvas Dashboard") aparecía
pegado casi encima de la isla dinámica. Faltaba envolver la app en
`SafeAreaProvider` (`react-native-safe-area-context`) — sin ese provider en
el árbol, el header y el contenido del Drawer no tienen de dónde leer cuánto
ocupa el notch/isla dinámica. Se agregó en `App.js`, envolviendo los tres
estados (cargando, login, app principal).

Eso no bastó — el usuario mandó una captura mostrando "Canvas Dashboard"
solapado con la hora del sistema. Causa real: `DrawerContentScrollView` (de
`@react-navigation/drawer`) ya calcula su propio `paddingTop` sumando
`insets.top`, pero nuestro `contentContainerStyle` (`styles.drawerContent`,
con `paddingTop: spacing.sm`) se mezcla en un array de estilos *después* del
suyo — la clave repetida se queda con el último valor, así que nuestros 8px
pisaban por completo su cálculo del notch/isla dinámica. Se quitó el
`paddingTop` de `drawerContent` en `App.js` (queda solo `{ flex: 1 }`) para
dejar que el componente maneje su propio espacio arriba.

Mismo tipo de bug al fondo: "Cerrar sesión" necesitaba bajar la misma
distancia (el inset del indicador de inicio, en iPhones sin botón físico).
Ahí no había un `paddingBottom` propio pisando nada, pero por si el
`paddingBottom` automático del `ScrollView` no alcanza a empujar el pie
hasta abajo del todo dentro del contenido scrolleable, se sumó
`insets.bottom` a mano en `drawerFooter` (vía `useSafeAreaInsets()` en
`CustomDrawerContent`) — mismo mecanismo explícito que ya funcionó arriba,
en vez de depender del comportamiento implícito del `ScrollView`.

Ese cambio en realidad lo subió, no lo bajó: `DrawerContentScrollView` YA
suma `insets.bottom` a su `paddingBottom` automáticamente, y el
`insets.bottom` agregado a mano en `drawerFooter` se sumaba ENCIMA de ese —
el inset quedaba contado dos veces, dejando más espacio del necesario antes
del botón (que en un contenedor de altura fija, empuja el botón hacia
arriba, no hacia abajo). El usuario pidió bajarlo "2 veces la cantidad que
subiste". Arreglo: en vez de sumar sobre el automático, se toma control
completo — `drawerContent` (contentContainerStyle) pisa el `paddingBottom`
automático a `0`, y `drawerFooter` define un único `paddingBottom:
insets.bottom` (sin la capa extra de `spacing.lg` de antes), quedando más
abajo que la versión original (antes de cualquiera de los dos intentos).

Los formularios de "Agregar movimiento" (`FinanceScreen.js`) y "Agregar
clase" (`ScheduleScreen.js`) usaban `display="compact"` para fecha/hora y
se veían mal centrados — mismo problema de tamaño intrínseco ambiguo que ya
se había resuelto en `schedulePicker.js`. Se reemplazó `compact` por
`inline` (fecha) / `spinner` (hora) con el mismo ancho en píxeles calculado
con `Dimensions`, reusando el patrón ya probado en vez de perseguir el bug
de `compact` por separado en cada archivo.

Ese cambio no bastó — el usuario confirmó "No cambio". La causa real (esta
vez verificada leyendo el código, no adivinada) era otra: `FinanceScreen.js`
y `ScheduleScreen.js` reusaban un mismo estilo `actions` (con
`flexWrap:'wrap'`) tanto para filas de botones chicos (donde el wrap es
correcto) como para el pie de los modales (Cancelar/Guardar, botones
`size="large"`). `AppButton.js` le da a `size="large"` un `width:'100%'`
explícito, y ambas pantallas además le pasaban `flex:1` — con las dos cosas
a la vez dentro de una fila con `flexWrap`, cada botón pedía el 100% del
ancho de la fila para sí mismo, así que el segundo botón se caía a su propia
línea en vez de quedar al lado del primero. Se confirmó comparando contra
`schedulePicker.js` (mismo patrón `size="large"` + `flex:1`, pero sin
`flexWrap` en su `actions` — por eso nunca falló ahí). Se aplicó un estilo `modalActions` nuevo (igual a `actions` pero sin
`flexWrap`) solo para los pies de modal, más `justifyContent: 'center'` en
`pillWrap` — **pero el usuario confirmó que tampoco cambió nada visualmente**.
Las dos rondas de arreglo (picker `compact`→`inline`/`spinner`, y
`actions`/`flexWrap`) quedan como cambios de código legítimos pero no eran
la causa real, que solo se encontró al ver una captura de pantalla: el
usuario no se refería al modal de agregar movimiento en sí, sino a que el
botón "+ Agregar movimiento" (fuera del modal, fijo debajo del `ScrollView`
de la pantalla) aparecía cortado en el borde inferior de la pantalla.

Causa real: el `ScrollView` principal de `FinanceScreen.js`/`ScheduleScreen.js`
solo tenía `contentContainerStyle`, sin `style={{ flex: 1 }}` propio — sin
eso, el `ScrollView` no se dimensiona correctamente dentro de su contenedor
`flex:1` y termina empujando el botón que va justo después de él (fuera del
`ScrollView`, no dentro) más allá del área visible. Se agregó `style={styles.scroll}`
(`{ flex: 1 }`) al `ScrollView` de `FinanceScreen.js`, `ScheduleScreen.js` y,
preventivamente, `CalendarScreen.js` (mismo patrón, aunque ahí no hay un
botón fijo después que lo evidenciara). Lección para la próxima vez que algo
se vea "mal" sin poder reproducirlo por código: pedir la captura desde el
principio en vez de adivinar — dos rondas se gastaron resolviendo un
problema que no era.

**El bug original de "espacio a la derecha" en el calendario/hora seguía
vivo** — una captura de pantalla lo confirmó: el calendario "inline" y el
spinner de hora quedaban pegados a la izquierda con un hueco grande a la
derecha, a pesar de habérseles dado un ancho explícito en píxeles
(`PICKER_WIDTH`). La causa real: el dibujo del picker nativo de iOS tiene un
tamaño fijo/intrínseco que **no se estira** aunque el marco (`style.width`)
sea más ancho — solo deja el resto del marco vacío, sin centrar su
contenido dentro de él. Ni el porcentaje (`100%`) ni el píxel exacto podían
arreglar esto, porque el problema nunca fue el tamaño del marco. Arreglo:
quitar el `width` fijo (dejar que el picker use su tamaño natural) y
agregar `alignSelf: 'center'` para centrarlo dentro del modal — aplicado en
`schedulePicker.js` (calendario y hora), `FinanceScreen.js` (fecha) y
`ScheduleScreen.js` (hora de inicio/fin).

El botón "Cerrar sesión" se movió de `TasksScreen.js` al pie del propio menú
(`CustomDrawerContent` en `App.js`), un patrón típico de apps con Drawer.

**Horario de clases — manual, vista semanal, sin conexión a Canvas.**
Canvas no expone de forma confiable un horario semanal por API (solo
tareas/cursos/anuncios) — no vale la pena intentar inferirlo de otros
endpoints. Se guarda a mano en `scheduleDb.js` (nueva base SQLite,
separada de `financeDb.js` por ser un dominio distinto), con una vista
semanal de lunes a sábado. Cada clase se puede convertir en un evento
semanal recurrente del Calendario del iPhone (`createWeeklyRecurringEvent`
en `deviceCalendar.js`), reusando el permiso de Calendario que la app ya
pide para los bloques de trabajo.

**Fase 4 completa: feed de anuncios; material nuevo descartado.**
`automation/canvas-anuncios.json` usa `GET /users/self/activity_stream`
(feed unificado de actividad de Canvas) — cubre todos los cursos activos en
una sola llamada, filtrando el tipo `Announcement` del resto de eventos
(discusiones, calificaciones, etc.). Se validó simulando varias corridas
con datos de prueba (`node -e` sobre el código del nodo Code) antes de
darlo por bueno, mismo criterio que los workflows anteriores. Probado por
el usuario, funciona.

Se había construido también `canvas-material-nuevo.json` (recorre cada
curso activo con `GET /courses` y sus archivos con `GET
/courses/:id/files`, avisando por email de los nuevos con link directo,
sin descargar nada — la descarga automática real se había descartado antes
por requerir un destino de almacenamiento externo sin confirmar). El
usuario lo probó y **Canvas le devuelve error de permisos al listar
archivos por API** — su cuenta (de estudiante) no tiene ese permiso
habilitado, algo que cada profesor configura por curso y que no depende de
la app ni del workflow. No hay forma de arreglarlo desde este lado, así que
se descartó el workflow (se borró de `automation/`) en vez de dejarlo
instalable pero roto.

**Gráfico "Gastos por categoría" en Finanzas — reusa `colorFromString`, no
un esquema de color nuevo.** Al agregarlo se validó la paleta neón original
de `theme.js` (`palette`) con la herramienta de validación de paletas
categóricas (contraste/CVD) y no pasó — varios colores demasiado claros
para el fondo oscuro, cian de acento casi indistinguible de un teal de la
paleta. En su momento no se corrigió (cambiar la paleta afectaría toda la
app, más de lo que pedía "agrégale gráficos"), pero el usuario dio luz
verde después ("cambia los colores como quieras") — ver la entrada
siguiente para la reconstrucción completa.

**Notificaciones locales — `expo-notifications`, sin backend.**
Pedido explícito del usuario ("agrega aún más funcionalidades... te doy
todos los permisos que quieras"). Se evaluó y descartó cualquier forma de
push remoto (Expo push token, servidor) — no hace falta: todo lo que se
quiere avisar (clase de hoy, evento de hoy, tarea por vencer, pago de
tarjeta) ya se calcula en el dispositivo con datos que la app ya tiene, así
que notificaciones **locales** (`Notifications.scheduleNotificationAsync`
con trigger de fecha fija) alcanzan sin agregar ninguna pieza de
infraestructura nueva. Limitación aceptada: sin un proceso en segundo plano
que reprograme solo, los avisos se recalculan cada vez que se abre
`TodayScreen.js`/`FinanceScreen.js` — se optó por ids estables (incluyen la
fecha) para que reabrir la misma pantalla el mismo día reemplace el aviso
en vez de duplicarlo, en vez de intentar deduplicar de otra forma más
compleja.

**Comparación mes a mes en Finanzas — sin dependencias nuevas.** Badge de
`▲/▼ N% vs. mes pasado` junto a Ingresos/Gastos, reusando `getMonthSummary()`
que ya existía (se le pide el mes actual Y el anterior). El color no sigue
el signo del cambio, sigue si es favorable: más ingresos = verde, más
gastos = ámbar (`colors.warning`, no rojo — no es un error, solo una
observación), menos gastos = verde. Si no hay datos del mes anterior (recién
empezando a usar Finanzas), no se muestra el badge en vez de calcular un
"Infinity%" sin sentido.

**Respaldo/restauración de Finanzas y Horario — `expo-file-system` (API
nueva) + `expo-sharing`.** Riesgo real señalado desde temprano en la sesión
(recomendación no pedida entonces, construida ahora que el usuario dio
permiso amplio): Finanzas y Horario viven solo en SQLite local, sin ningún
respaldo — perder o resetear el teléfono los borra por completo. Se evaluó
subir esto a algún servicio en la nube (Drive, iCloud vía API) y se
descartó por lo mismo que se descartó antes para "material nuevo" de
Canvas: es una integración externa nueva, no confirmada, y no hace falta —
la hoja de compartir nativa de iOS ya deja guardar el archivo donde el
usuario quiera (Archivos, iCloud Drive, correo), sin que la app tenga que
saber nada de esos servicios. `expo-file-system` se instaló en su versión
más nueva (v19, SDK 54), que reemplazó la API async clásica
(`documentDirectory`/`writeAsStringAsync`) por clases síncronas
`File`/`Directory`/`Paths` — se usó la API nueva directamente en vez de
`expo-file-system/legacy`, para no empezar ya con código marcado como
legacy. Restaurar es explícitamente **destructivo** (reemplaza, no combina)
y se decidió así a propósito — combinar datos de dos fuentes (ids
duplicados, categorías con el mismo nombre pero distinto id, etc.) es un
problema bastante más difícil y propenso a errores silenciosos que una app
personal de este tamaño no necesita resolver; se avisa con un `Alert`
explícito antes de restaurar, mostrando la fecha del archivo.

**Pantalla "Hoy": tareas urgentes + clases + eventos, en un solo lugar.**
Pedido del usuario ("sigue agregando funcionalidades"). `TodayScreen.js`,
primera sección del menú, combina tres fuentes que ya existían por separado
(`getTodoItems()` filtrado por `isUrgent`, `getClasses()` filtradas por el
día de la semana de hoy, `listEventsForDay()` del Calendario) para no tener
que revisar tres pantallas distintas cada mañana. Reutiliza
`useWorkBlockScheduler.js` — no se escribió lógica de agendado nueva.

**Paleta categórica reconstruida — el usuario dio libertad de cambiar
colores.** Al agregar el gráfico de Finanzas se validó la paleta neón
original de 10 colores (`theme.js`) con la herramienta de validación de
paletas categóricas (contraste/CVD) del skill de dataviz y **no pasó**:
varios colores eran demasiado claros para el fondo oscuro de la app
(`#05060f`), y el cian de acento (`#00E5FF`) — que además era parte de la
paleta categórica Y el color de marca de los botones/gradientes — resultó
casi indistinguible de un teal de la misma paleta (ΔE 8.6, por debajo del
piso de 15 hasta para visión de color normal). Se reconstruyó desde cero,
probando variantes con el validador hasta encontrar una que pasara las seis
pruebas (banda de luminosidad, piso de croma, separación CVD adyacente,
piso de visión normal, contraste): **7 colores** en vez de 10 — se intentó
mantener un octavo tono amarillo/dorado, pero esa franja del círculo de
color choca con naranja y con verde en casi cualquier variante probada (el
propio skill documenta amarillo-naranja como un par estructuralmente
difícil); se prefirió menos colores bien distinguibles que más colores
parecidos. Colores hardcodeados en otros archivos que referenciaban hex de
la paleta vieja (`App.js` — color de sección del menú, `CalendarScreen.js`
— bloques rápidos) se actualizaron a la paleta nueva. De paso se separó el
color de "aviso" del presupuesto (antes un naranja suelto de la paleta
categórica) en un `colors.warning` propio — el skill marca mezclar colores
de estado con colores categóricos como error, ya que un color de estado
"impersonando" una categoría (o viceversa) confunde qué es identidad y qué
es una alerta. Los colores de marca (`colors.accent`, los gradientes) no se
tocaron — son un rol distinto (identidad de marca/UI), no identidad
categórica de datos del usuario.

**Herramientas de IA gratuitas complementarias (fuera de este repo).**
Evaluadas como apoyo general de desarrollo, no específicas de este proyecto:
GitHub Copilot Free (vía GitHub Student Developer Pack), Windsurf, Aider (agente
open source, puede correr con modelos locales).

**Finanzas: pasa de exploración a fase activa del roadmap.**
Se agrega como Fase 5 en `planner.md`, con diseño de datos y pantallas
definido. Notion, Obsidian y Readwise se mantienen como exploración pura,
sin fecha.

**Finanzas: no conectar directamente con Nu (ni ningún otro banco).**
Se evaluó por pedido del usuario. Nu no expone una API pública para que una
app personal lea movimientos — la vía oficial es Open Finance, que exige
certificarse como proveedor autorizado (fuera de alcance para una app de uso
individual). La alternativa realista serían agregadores comerciales como
Belvo o Pluggy, que sí tienen convenio con Nu, pero son un servicio de pago
de un tercero con su propia superficie de credenciales — una integración
mucho más grande que cualquier otra en este proyecto. El usuario decidió
mantenerlo manual; la tarjeta de crédito se registra a mano (cupo, día de
corte, día de pago, compras y cuotas) en `financeDb.js`, sin tocar ningún
banco. Sigue abierta la puerta a automatizar por n8n parseando notificaciones
de transacciones por correo, ya anotado en `planner.md`.

**Finanzas: motor de almacenamiento local — `expo-sqlite`.**
Se evaluó frente a un JSON simple vía `AsyncStorage`/`expo-file-system`. Se
eligió SQLite porque el historial de movimientos crece indefinidamente y la
app necesita agregación (suma por categoría, por mes, balance) que SQL
resuelve con una consulta en vez de recorrer y sumar en JS cada vez, además
de evitar reescribir un archivo completo en cada transacción nueva. Es una
dependencia nueva pero oficial de Expo y liviana — instalada con
confirmación del usuario. Esquema inicial (`accounts`, `categories`,
`transactions`, `budgets`) en `financeDb.js`; todo permanece 100% local en
el dispositivo, sin servicio externo ni credencial.

**Revisión de arquitectura (2026-08-16) — deuda estructural identificada y
parte de ella corregida en la misma sesión.** A pedido del usuario
("piensa como un arquitecto de software... critica objetivamente el
proyecto"), se revisó el código (no solo los docs) con ojo de
mantenibilidad a futuro, no de bugs puntuales. Hallazgos, de mayor a menor
impacto:

1. **Archivos "dios" por pantalla.** `FinanceScreen.js` tenía 904 líneas:
   la pantalla más sus 4 modales (`AddTransactionModal`,
   `CardPurchasesModal`, `ConfigCardModal`, `BudgetModal`) y utilidades de
   fecha/dinero locales, todo en un archivo. El costo no es hipotético: el
   bug de `flexWrap`/`width:'100%'` documentado más abajo tomó tres rondas
   de diagnóstico en parte porque estilos de secciones muy distintas de la
   pantalla vivían mezclados en un mismo `StyleSheet`. **Corregido**: los
   4 modales pasaron a archivos propios (`AddTransactionModal.js`,
   `CardPurchasesModal.js`, `ConfigCardModal.js`, `BudgetModal.js`),
   compartiendo estilos vía `financeStyles.js`. Mismo patrón aplicado a
   `ScheduleScreen.js` (322 líneas, un modal): `AddClassModal.js` +
   `scheduleStyles.js`.
2. **Utilidades duplicadas en vez de compartidas.** `pad2()` estaba
   definida de forma independiente y con el mismo cuerpo en
   `FinanceScreen.js` y `ScheduleScreen.js` — confirmado con `grep`, no una
   sospecha. Lo mismo con formateo de fecha/hora/dinero. Dos
   implementaciones del mismo cálculo divergiendo con el tiempo es
   exactamente el mecanismo que ya produjo bugs de UI en este proyecto.
   **Corregido**: se creó `formatters.js` con todas esas funciones
   (`pad2`, `isoDate`, `parseIsoDate`, `timeToHHMM`, `hhmmToDate`,
   `formatTimeLabel`, `nextDateForWeekday`, `combineDateAndTime`,
   `monthKey`, `previousMonthKey`, `monthLabel`, `percentChange`,
   `formatMoney`); `FinanceScreen.js` y `ScheduleScreen.js` ahora importan
   de ahí, sin definiciones locales.
3. **Cero red de seguridad automatizada.** No hay `eslint`, `prettier` ni
   tests en el proyecto — nada mecánico que hubiera atrapado antes el bug
   de `flexWrap` (dos props de tamaño friccionando en el mismo estilo) o
   el del `paddingTop` del Drawer pisado (clave de estilo repetida en un
   array). **No corregido en esta sesión** — instalar tooling de desarrollo
   es una decisión de dependencias que requiere confirmación explícita del
   usuario (regla del proyecto); queda como ítem de roadmap en
   `planner.md`, Fase 7.
4. **Sin `ErrorBoundary` en la raíz.** Un error de render no capturado en
   cualquier pantalla dejaba una pantalla en blanco sin recuperación.
   **Corregido**: `ErrorBoundary.js` (componente de clase de React, sin
   dependencias nuevas) envuelve los tres estados de `App.js`.
5. **Sin resiliencia de red en Tareas/Cursos, estructura de carpetas
   plana, notificaciones/respaldo frágiles por diseño.** Riesgos reales
   pero de menor impacto inmediato o ya aceptados a propósito (ver las
   entradas de notificaciones y respaldo más abajo) — **no corregidos en
   esta sesión**, quedan como roadmap en `planner.md`, Fase 7, para
   ejecutar por fases con confirmación del usuario en vez de un cambio
   masivo de una sola vez sin poder probarlo en el teléfono desde acá.

Se optó por corregir 1, 2 y 4 directamente (no requieren dependencias
nuevas, son mecánicos y de bajo riesgo — extraer código a otro archivo sin
cambiar su comportamiento) y dejar 3 y 5 como decisiones pendientes de
confirmar con el usuario, seguiendo la regla del proyecto de no instalar
dependencias grandes ni tocar la app entera sin avisar. También se
implementó, sin dependencias nuevas, la caché de la última respuesta
buena de Canvas (`canvasCache.js`, vía `expo-file-system`) para
`TasksScreen.js`/`CoursesScreen.js` — ver `docs/planner.md`, Fase 7,
punto 6.

**ESLint + Prettier instalados (confirmado por el usuario).**
`npx expo lint` instaló `eslint@^9` + `eslint-config-expo` (config oficial
de Expo, flat config) y agregó `npm run lint`; se sumó `prettier` +
`eslint-config-prettier` con `.prettierrc.json` y `npm run format`/
`format:check`. Primera corrida sobre todo el proyecto: 0 errores, solo 3
warnings preexistentes y menores. `prettier --check` marcó 29 archivos con
formato distinto — a propósito **no se corrió `--write`** todavía: el
árbol tenía cambios sin commitear de antes de esta sesión, y reformatear
todo ahora hubiera mezclado cambios de formato con esos cambios
funcionales. Queda para cuando el usuario haga commit de su trabajo en
curso.

**Jest instalado y primeros tests, sobre la lógica de dinero
(confirmado por el usuario).** `npx expo install jest-expo jest --dev`
(versiones alineadas al SDK, mismo criterio que cualquier otra dependencia
de este proyecto — nunca dejar que `npm install` resuelva por su cuenta).
`financeDb.test.js` prueba `getInstallmentProgress` (progreso de cuotas) y
`lastCutoffDate`/`nextDueDate` (corte y próximo pago de tarjeta) — 13
tests, todos en verde. `expo-sqlite` se mockea en el test: estas funciones
son puras, no tocan la base de datos real.

Escribir el test destapó un bug real: `getInstallmentProgress` construía
la fecha de la compra con `new Date(transaction.date)` sobre un string
'YYYY-MM-DD', que JS interpreta como **UTC** — en Colombia (UTC-5) eso
corre la fecha un día hacia atrás (medianoche UTC del 15 es las 7pm del 14
en Colombia) y puede adelantar o atrasar en 1 el número de cuotas que la
app muestra como ya "cobradas" cerca de un aniversario mensual. Es el
mismo problema que `formatters.js` ya documenta y resuelve con
`parseIsoDate` en el resto de la app (`schedulePicker.js`,
`FinanceScreen.js`, etc.) — `getInstallmentProgress`, al vivir en
`financeDb.js`, nunca se migró a usarlo. Corregido: ahora importa y usa
`parseIsoDate` de `formatters.js`. `lastCutoffDate`/`nextDueDate`/
`toIsoDate` pasaron de privadas del módulo a exportadas (sin cambiar su
comportamiento) para poder probarlas directamente sin depender de una
conexión real a SQLite.

**Rediseño visual: oscuro y "futurista", con `expo-linear-gradient`.**
Reemplaza el estilo claro tipo iOS nativo. Fondo casi negro con tinte
azul-violeta, tarjetas con borde sutil y resplandor cian en vez de sombra
negra clásica (no se nota sobre fondo casi negro), acentos en degradado
cian → violeta. Se instaló `expo-linear-gradient` (librería oficial de Expo,
chica) confirmando antes con el usuario, siguiendo la regla del proyecto de
no instalar dependencias grandes sin avisar. Todos los colores siguen
centralizados en `theme.js` — ninguna pantalla nueva introduce hex sueltos.
