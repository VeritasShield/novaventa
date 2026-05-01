# Novaventa Full Plus - Chrome Extension

![Version](https://img.shields.io/badge/version-3.1.3-blue.svg)
![Platform](https://img.shields.io/badge/platform-Chrome_|_Edge-green.svg)
![Build](https://img.shields.io/badge/build-Vite-646CFF.svg)

Extensión de Chrome diseñada para automatizar y optimizar la carga masiva de pedidos en la plataforma B2B de Novaventa. Inyecta una interfaz flotante avanzada para el ingreso de códigos en bloque, extracción inteligente de datos (Web Scraping) y generación de reportes listos para Google Docs, Sheets o WhatsApp.

> **⚠️ Nota de Responsabilidad:** Esta extensión no es un producto oficial de Novaventa. Utilízala bajo tu propio criterio y respetando los términos de servicio de la plataforma.

---

## ✨ Características Principales

- **Panel Flotante Interactivo**: UI responsiva inyectada sobre la SPA de Novaventa (arrastrable, redimensionable y minimizable).
- **Ingreso Masivo de Códigos**: Soporta el formato inteligente `codigo[-cantidad] persona` (ej. `36316-3 Ana`). Es tolerante a errores tipográficos y puntuación extra.
- **Automatización Anti-Bloqueos**: Algoritmos de navegación asíncrona con *Jitter* (retrasos aleatorios) para emular comportamiento humano y evitar bloqueos por WAF o Rate Limiting.
- **Extracción de Datos (Scraping)**:
  - Muestra tarjetas con imagen, código, nombre, persona, precio, categoría y oferta.
- **Exportación Profesional**:
  - **Google Docs (HTML)**: Tarjetas limpias listas para copiar.
  - **Google Docs (PNG)**: Imágenes procesadas en alta calidad mediante Canvas.
  - **Tabla de Subtotales**: Formato optimizado para Excel/Google Sheets.
  - **Reportes de Agotados**: Listados de fallidos diseñados para el cliente final (sin precios internos).
- **Persistencia Total**: Estado gestionado en `localStorage`. Sobrevive a recargas accidentales, manteniendo la cola, capturados, fallidos y posiciones de la UI.
- **Atajos de Teclado**:
  - `Alt + C`: Capturar productos visibles en la cuadrícula actual.
  - `Alt + R`: Reiniciar (Hard Reset) de posición de interfaz.

---

## 🚀 Requisitos

- Navegador basado en Chromium (Google Chrome, Microsoft Edge, Brave).
- Node.js (v18+) instalado en tu sistema local para compilar el código.
- Terminal compatible (Git Bash, PowerShell, ZSH).

---

## 🛠️ Instalación y Compilación

Para instalar la extensión desde el código fuente, sigue estos pasos:

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/VeritasShield/novaventa.git
   cd novaventa
   ```

2. **Instala las dependencias (Vite + Tampermonkey):**
   ```bash
   npm install
   ```

3. **Construye el UserScript:**
   ```bash
   npm run build
   ```
   *Esto generará el archivo optimizado `dist/novaventa.user.js`.*

4. **Carga el script en tu navegador:**
   - Instala la extensión **Tampermonkey** en tu navegador.
   - Arrastra el archivo `dist/novaventa.user.js` a una pestaña o ábrelo en el navegador para instalarlo.

---

## 📚 Guía de Uso Rápido

1. Navega a `https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/*`.
2. El panel flotante aparecerá automáticamente.
3. En la caja de texto, pega tu lista de pedidos.
4. Haz clic en **Agregar Productos**.
5. *(Opcional)* Si notas un error, pulsa **Detener Automatización**.
6. Usa los botones de exportación para generar los reportes finales al terminar.

---

## 🏗️ Arquitectura (SOLID)

La extensión utiliza Vanilla JS modularizado con un entorno de compilación moderno.
- `src/state.js`: Gestor de estado (SSoT) y persistencia segura.
- `src/ui.js`: Controladores visuales, MutatonObservers reactivos y lógica del DOM inyectado.
- `src/capture.js`: Lógica de Scraping, abstracción de selectores de Novaventa.
- `src/exporters.js`: Lógica de generación de Canvas (PNG) y reportes HTML.
- `automation_novaventa.js`: Controlador de orquestación y bucle lógico principal.

---

## 🛡️ Comandos de Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila el código fuente en `dist/novaventa.user.js`. |
| `npm run deploy` | Compila el código, crea un commit automático y lo sube a la rama `main` en GitHub. |
