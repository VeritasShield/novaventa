# 🗺️ Plan de Migración y Modernización: Vite + Tampermonkey

Este documento define la hoja de ruta técnica para consolidar la transición de una extensión de Chrome clásica a un UserScript moderno empaquetado con Vite.

## ✅ Fase 0: Setup Base (Completado)
- [x] Instalar `vite` y `vite-plugin-monkey`.
- [x] Configurar `vite.config.js` con los metadatos correctos (Headers).
- [x] Modificar `deploy.sh` para usar el nuevo build de Vite.
- [x] Punto de entrada (`automation_novaventa.js`) importando los submódulos.
- [x] Auto-inyección de CSS delegada a Vite (`GM_addStyle`).

---

## 🚀 Fase 1: Adopción de ECMAScript Modules (ESM) nativos
**Problema actual:** Los archivos en `src/` usan funciones autoejecutables (IIFE) y contaminan el objeto global (`window.NV`) para comunicarse entre sí. Vite envuelve todo de todos modos, pero usar el objeto global rompe el *Tree-Shaking* (eliminación de código muerto) y dificulta el análisis estático.

- [x] ✅ **Eliminar `nv_namespace.js`**: Ya no es necesario. Vite aislará el scope de cada módulo automáticamente.
- [x] ✅ **Refactorizar `src/utils.js`**: 
  - Quitar el contenedor `(function(){ ... })()`.
  - Cambiar `U.metodo = ...` por `export const metodo = ...` o `export function metodo() { ... }`.
- [x] ✅ **Refactorizar `src/state.js`**:
  - Importar explícitamente lo necesario: `import { reportError } from './utils.js';`.
  - Exportar la API de estado: `export const state = { get, setUI, ... }`.
- [x] ✅ **Refactorizar `renderers`, `exporters`, `capture`, `ui`**:
  - Cambiar a sintaxis `import / export` explícita.
  - Eliminar referencias a `window.NV`.
- [x] ✅ **Actualizar `automation_novaventa.js`**:
  - Importar las funciones directamente desde los archivos, no desde el global: 
    `import { waitForBody, delay } from './src/utils.js';`
- [x] ✅ **Resolución de Dependencias Circulares**:
  - Al aislar los scopes, módulos interdependientes (`ui.js` y `capture.js`) fallarán si se importan mutuamente.
  - **Solución:** Consolidar la orquestación en `automation_novaventa.js` inyectando dependencias mediante callbacks (como el actual `appCallbacks`).

---

## 💾 Fase 2: Persistencia Resiliente (Tampermonkey APIs)
**Problema actual:** El script guarda todo en `localStorage`. Si el usuario borra las cookies o datos del sitio de Novaventa, se pierde la cola de productos, el historial de fallidos y las configuraciones.

- [x] ✅ **Solicitar permisos en `vite.config.js`**:
  - Agregar `GM_getValue`, `GM_setValue`, `GM_deleteValue` al array de `grant`.
- [x] ✅ **Refactorizar `src/state.js` (SSoT)**:
  - Reemplazar las llamadas asíncronas o síncronas de `localStorage` por `GM_getValue` y `GM_setValue`.
  - *Graceful Degradation*: Mantener un fallback a `localStorage` por si el script se ejecuta fuera de Tampermonkey en entorno de desarrollo.
  - **CRÍTICO - Prevención de Pérdida de Datos:** Crear un puente de migración inicial (`migrateLocalStorageToGM()`) que transfiera el `localStorage` activo hacia `GM_setValue` en el primer arranque para evitar purgar las colas de los usuarios.

---

## 🛡️ Fase 3: Evasión CORS y Seguridad (Completado)
**Problema actual:** En `exporters.js`, la descarga de imágenes para dibujarlas en el Canvas de Google Docs a veces falla por reglas CORS restrictivas del servidor `cdn.novaventa.com`.

- [x] ✅ **Solicitar permiso `GM_xmlhttpRequest`** en la configuración de Vite.
- [x] ✅ **Actualizar `exporters.js` (`toJPEGDataURL`)**:
  - Si falla el `fetch` nativo por CORS, usar un wrapper con `GM_xmlhttpRequest` (que opera en un contexto privilegiado del navegador) para descargar el blob de la imagen sin restricciones del sitio base.
  - *Manejo de asincronía:* Envolver `GM_xmlhttpRequest` en una `Promise`, ya que su API nativa está basada estrictamente en callbacks, para mantener la compatibilidad arquitectónica actual.

---

## 🧹 Fase 4: Limpieza Final de Archivos Legacy
- [x] ✅ Eliminar scripts de empaquetado viejos (`scripts/build.js`, `scripts/simple-bundle.ps1`).
- [x] ✅ Eliminar referencias residuales a Manifest V3 y código muerto (`manifest.json`, `src/nv_namespace.js`).
- [x] ✅ Validar que `npm run build` lance 0 advertencias de Vite en consola.

---

## 💡 ¿Por dónde empezar el código?
**¡Migración Completada! 🎉** 
El proyecto ahora corre nativamente sobre Vite y Tampermonkey con soporte ESM puro, alta resiliencia y evasión de bloqueos CORS.