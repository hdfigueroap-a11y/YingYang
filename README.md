# Canvas Dashboard

App personal para iPhone que centraliza tareas de Canvas y un calendario de
horario (sueño, lectura, gimnasio, trabajo en tareas). Uso 100% individual —
no está publicada ni se planea publicar en la App Store.

## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md) — stack, módulos, y qué queda
  fuera del alcance de esta app
- [`docs/canvas-api.md`](docs/canvas-api.md) — autenticación y endpoints de Canvas
  usados/planeados
- [`docs/calendario.md`](docs/calendario.md) — integración con el Calendario
  nativo del iPhone, y por qué se descartaron Google Calendar y Microsoft Graph
- [`docs/planner.md`](docs/planner.md) — roadmap por fases, qué está hecho y qué
  falta
- [`docs/decisiones.md`](docs/decisiones.md) — registro cronológico de decisiones
  técnicas con su justificación
- [`automation/README.md`](automation/README.md) — workflows de n8n (avisos
  por email de tareas nuevas y cambios de nota), fuera de la app Expo

## Cómo correrlo

```bash
npm install
npx expo start --tunnel
```

Escanea el QR con Expo Go (SDK 54) en tu iPhone.

## Primer uso

1. **Tareas**: pega la URL de tu institución (ej. `https://umb.instructure.com`) y
   tu Access Token de Canvas (Perfil > Configuración > New Access Token, con fecha
   de expiración).
2. **Calendario**: da permiso cuando lo pida — usa el Calendario nativo de iOS, sin
   login externo. Si programas un bloque de trabajo desde Tareas o Cursos antes de
   visitar esta pestaña, el permiso se pide en ese momento igual.

## Estado actual

Fases 1, 2 y 3 completadas — incluye entrega de tareas por texto, URL o
archivo, y Horario de clases manual (lunes a sábado, con opción de agendar
cada clase como evento semanal recurrente). Además, pantalla "Cursos" (no
estaba en el roadmap original) para explorar todas las tareas de un curso,
no solo las pendientes. Fase 4 (automatización, tres workflows de n8n)
completa — ver `automation/README.md`. Rediseño visual oscuro/"futurista" completado, y
navegación por menú lateral (☰) en vez de pestañas inferiores. Fase 5
(Finanzas personales) completa en su versión manual: registro de
movimientos, resumen del mes, presupuestos por categoría y tarjeta de
crédito (todo local, sin conectar a ningún banco). Ver `docs/planner.md`
para el detalle completo.
