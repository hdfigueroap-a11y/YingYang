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

**Herramientas de IA gratuitas complementarias (fuera de este repo).**
Evaluadas como apoyo general de desarrollo, no específicas de este proyecto:
GitHub Copilot Free (vía GitHub Student Developer Pack), Windsurf, Aider (agente
open source, puede correr con modelos locales).
