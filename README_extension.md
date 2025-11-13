# Extensión de Chrome: Novaventa Full Plus

Esta carpeta/raíz contiene lo necesario para usar el script como una extensión de Chrome. Ahora el código está empezando a modularizarse:

- `src/nv_namespace.js`: inicializa el namespace global `NV`.
- `src/utils.js`: utilidades (parseo numérico, moneda, helpers DOM, waits, texto).
- `src/exporters.js`: exportadores a HTML/PNG (Docs), conversión de imágenes.
- `src/state.js`: store centralizado con versión + migración desde `localStorage` legacy.
- `automation_novaventa`: script principal (IIFE) que enlaza a los módulos y mantiene la UI y flujo actual.
- `types/nv.d.ts`: tipos TS para `Product`, `CapturedProduct`, `FailedProduct` y módulos `NV`.
- `tsconfig.json`: configuración de TypeScript (para tooling/editores; no emite archivos).
- `scripts/simple-bundle.ps1`: script para generar un bundle único `dist/content.js` sin dependencias externas.
- `content.css`: estilos del panel y listas, con variables CSS.

## Cómo cargarla en Chrome (modo desarrollador)

- Abre `chrome://extensions` en Chrome.
- Activa "Modo desarrollador" (arriba a la derecha).
- Clic en "Cargar descomprimida".
- Selecciona la carpeta del proyecto que contiene este `manifest.json`.
- Navega a la página objetivo: `https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/*`.

El panel flotante y toda la funcionalidad se inyectan automáticamente al cargar la página (run_at: `document_idle`).

## Bundle único para MV3

- Ejecuta `scripts/simple-bundle.ps1` (PowerShell) para generar `dist/content.js`.
- El `manifest.json` ya referencia este bundle único.

Opcional: si prefieres un bundler (esbuild/TypeScript real), puedo añadir `package.json` con scripts de build.

## Estado y migraciones

- En el arranque, `NV.state.init()` carga `nv_state` (agregado) o migra desde claves legacy de `localStorage`.
- Se instalan hooks sobre `localStorage.setItem/removeItem` para mantener sincronizados ambos formatos (agregado y legacy), evitando modificar la lógica existente.

## Errores y diagnósticos

- `NV.utils.reportError(msg, { ctx, ui, level, timeoutMs })` centraliza logs y muestra toasts en la página.
- Los intentos de localizar el botón “Agregar al carrito” ahora prueban varios selectores y, si fallan, generan un diagnóstico con pistas (grid/detalle/form presente).

## Tests

- Agregué `tests/parsePrice.spec.html` con casos de ejemplo para `parsePrice`. Ábrelo en el navegador para ver resultados.

## Estilos (CSS)

- Los estilos se movieron a `content.css` y el `manifest.json` lo inyecta como `content_scripts.css`.
- Se definieron variables CSS en `:root` (por ejemplo `--nv-primary`) para facilitar personalización futura.
- Aún existen algunas asignaciones inline para propiedades dinámicas (mostrar/ocultar, posición); se pueden ir reduciendo gradualmente.

Siguientes pasos de modularización sugeridos: extraer `UI` y `captura` a `src/ui.js` y `src/capture.js`, y centralizar estado en `src/state.js`.

## Notas

- No se modificó ninguna lógica del archivo original `automation_novaventa` (se mantiene íntegro). Solo se añadió `manifest.json` para empaquetarlo como extensión.
- No se requieren permisos adicionales: el script usa `localStorage`, DOM y `fetch` con CORS estándar.
- Si deseas publicar la extensión en Chrome Web Store, considera añadir íconos (`icons`) y una descripción más extensa en el `manifest.json`.
