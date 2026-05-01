# Mapa del Proyecto (Project Map) 🗺️ - Novaventa Full Plus

Este documento describe la estructura de directorios y la responsabilidad técnica de cada módulo dentro de la arquitectura de la extensión, garantizando la mantenibilidad y escalabilidad.

##  Archivos Raíz

- **`content.css`**: Hoja de estilos principal para la UI inyectada (panel flotante, botones, grillas).
- **`automation_novaventa.js`**: Entry Point y Controlador de Orquestación. Coordina el bucle asíncrono de navegación, maneja el MutationObserver principal e invoca las acciones de los módulos subyacentes (`UI`, `Capture`, `State`).
- **`README.md`**: Documentación central, funcional y técnica de la extensión (Instrucciones, Setup, Arquitectura).
- **`package.json` / `package-lock.json`**: Ecosistema Node.js. Define scripts base y dependencias de desarrollo (`vite`, `vitest`, `vite-plugin-monkey`).
- **`vite.config.js`**: Configuración de empaquetado de Vite y declaración de metadatos/permisos del UserScript para Tampermonkey.
- **`tsconfig.json`**: Configuración de TypeScript. Proporciona soporte de tipado estático e Intellisense en editores compatibles sin compilar los archivos JS directamente.
- **`.gitignore`**: Reglas de exclusión de Git para evitar subir módulos pesados (`node_modules`) o binarios al repositorio.

## 📂 `src/` (Módulos Core)
Lógica fragmentada y fuertemente encapsulada mediante **ESM Nativo** (import/export). Esto garantiza dependencias explícitas y habilita el *Tree-Shaking*.

- **`utils.js`**: Funciones puras compartidas. Parseo seguro de precios es-CO, wrappers asíncronos (`waitForBody`, `randomDelay` / Jitter anti-baneos) y trazabilidad estandarizada (logs con niveles).
- **`state.js`**: Gestor del estado (SSoT). Implementa persistencia híbrida hacia Tampermonkey (`GM_setValue`) con *graceful degradation* a `localStorage`, garantizando prevención de pérdida de datos.
- **`ui.js`**: Controlador del DOM Inyectado. Gestiona el panel flotante, eventos de arrastre/minimizado (evitando re-renders innecesarios) y renderiza las vistas.
- **`capture.js`**: Módulo de Scraping y manipulación del DOM nativo. Implementa selectores resilientes para ubicar botones, inputs de cantidad y metadatos, controlando excepciones de nodos faltantes.
- **`renderers.js`**: Fábrica de componentes del DOM visuales (Arquitectura separada de la lógica de negocio).
- **`exporters.js`**: Lógica de conversión y renderización de reportes. Implementa evasión de CORS (`GM_xmlhttpRequest`), manejo avanzado de Canvas y manipulación asíncrona concurrente de Blobs.

## 🛠️ Herramientas y Artefactos

### `scripts/` (Empaquetado)

- **`deploy.sh`**: Script Bash para pipeline CI/CD local ("Fail-Fast"). Ejecuta tests (`npm run test`), bump de versión, build, y sincroniza commits hacia la rama actual en GitHub.

### `dist/` (Archivos Compilados)

- **`novaventa.user.js`**: Artifact final generado por `vite`. Script ESM minificado, consolidado e inyectado con metadatos de Tampermonkey.

### `types/` (Tipado TypeScript)

- **`nv.d.ts`**: Declaraciones de Tipos Globales. Mejora el autocompletado (IntelliSense) y aplica validaciones estáticas estrictas de TypeScript a archivos JS.

### `tests/` (Pruebas Locales)

- **`utils.test.js`**: Suite de pruebas unitarias automatizadas (Vitest) para validación de lógica pura (ej. parseo de inputs).
- **`parsePrice.spec.html`**: Test visual para validar que el algoritmo de parseo en `utils.js` procesa correctamente todos los formatos de moneda es-CO.

### Artefactos Locales (No versionables)
- **`node_modules/`**: Dependencias instaladas por NPM.
- **`.history/` / `tmp_snip.txt`**: Archivos residuales de los plugins del editor de código (historial local y recortes).

---

**Nota Arquitectónica:** 
El proyecto ha concluido su transición de un script monolítico hacia una arquitectura 100% modular basada en el Principio de Responsabilidad Única (SOLID).