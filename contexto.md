# Mapa del Proyecto (Project Map) - Novaventa Full Plus

Este documento describe la estructura de directorios y la responsabilidad de cada archivo dentro de la arquitectura de la extensión.

## 📂 Archivos Raíz

- **`manifest.json`**: Archivo de configuración principal de la extensión para Chrome (Manifest V3). Define permisos, inyección de scripts y CSS.
- **`content.css`**: Hoja de estilos principal para la UI inyectada (panel flotante, botones, grillas).
- **`automation_novaventa.js`**: Controlador de orquestación (Script principal heredado). Coordina el bucle de navegación, maneja el observer principal e invoca las acciones de los módulos `UI`, `Capture` y `State`.
- **`README.md`**: Documentación central, funcional y técnica de la extensión (Instrucciones, Setup, Arquitectura).
- **`package.json` / `package-lock.json`**: Ecosistema Node.js (NPM). Define scripts base y dependencias de desarrollo (ej. `esbuild`).
- **`tsconfig.json`**: Configuración de TypeScript. Proporciona soporte de tipado estático e Intellisense en editores compatibles sin compilar los archivos JS directamente.
- **`.gitignore`**: Reglas de exclusión de Git para evitar subir módulos pesados (`node_modules`) o binarios al repositorio.

## 📂 `src/` (Módulos Core)
Lógica fragmentada y encapsulada. Se exponen bajo el namespace global `window.NV` para evitar colisiones.

- **`nv_namespace.js`**: Declaración de los espacios de nombres para evitar colisiones en el contexto global de la ventana.
- **`utils.js`**: Funciones puras compartidas. Parseo de precios colombianos, logs personalizados y wrappers para pausas en el DOM (`waitForBody`).
- **`state.js`**: Gestor del estado de la extensión. Implementa persistencia hacia `localStorage` y define un sistema de migraciones para mantener sincronización legacy vs unificado.
- **`ui.js`**: Controlador de la Interfaz de Usuario. Inyecta el panel flotante, gestiona eventos de arrastre/minimizado y renderiza las vistas de productos mediante los renderers.
- **`capture.js`**: Módulo de Scraping y manipulación del DOM nativo de Novaventa. Busca botones, lee inputs de cantidad y extrae metadatos de los productos.
- **`renderers.js`**: Fábrica de componentes del DOM puramente visuales. Construye tarjetas de productos y resúmenes de unidades/precio.
- **`exporters.js`**: Lógica de conversión de datos. Genera los templates HTML para copiar a Google Docs, convierte imágenes a Base64 JPEG de alta calidad y recorta assets en canvas.

## 📂 Herramientas y Artefactos

### `scripts/` (Empaquetado)

- **`build.js`**: Script en Node.js que unifica los módulos, purga codificaciones basura (BOM) y utiliza `esbuild` para generar el binario minificado final.
- **`deploy.sh`**: Script en Bash (Git Bash) que automatiza el proceso de "fail-fast": compila el proyecto y sincroniza los cambios a GitHub en un solo paso seguro.
- **`simple-bundle.ps1`**: *(Obsoleto)* Antiguo concatenador de PowerShell.

### `dist/` (Archivos Compilados)

- **`content.js`**: Archivo resultante generado por `build.js` y `esbuild`. Es el script minificado, consolidado y optimizado que inyecta Chrome mediante el `manifest.json`.

### `types/` (Tipado TypeScript)

- **`nv.d.ts`**: Definiciones de tipos (`interfaces`) para mejorar el autocompletado en los editores de código y validaciones TypeScript (puramente declarativo).

### `tests/` (Pruebas Locales)

- **`parsePrice.spec.html`**: Test visual para validar que el algoritmo de parseo en `utils.js` procesa correctamente todos los formatos de moneda es-CO.

### Artefactos Locales (No versionables)
- **`node_modules/`**: Dependencias instaladas por NPM.
- **`.history/` / `tmp_snip.txt`**: Archivos residuales de los plugins del editor de código (historial local y recortes).

---

**Nota Arquitectónica:** 
El proyecto ha concluido su transición de un script monolítico hacia una arquitectura 100% modular basada en el Principio de Responsabilidad Única (SOLID).