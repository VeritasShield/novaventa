# Automatización de pedidos Novaventa — Full Plus (Chrome Extension)

Extensión de Chrome que automatiza la carga de pedidos en el sitio de Novaventa, agrega una interfaz flotante para ingresar códigos, captura productos visibles, muestra panel de productos capturados/fallidos y genera vistas listas para pegar en Google Docs (HTML o PNG recortado).

> Nota: Esta extensión no es oficial de Novaventa. Úsala bajo tu propio criterio y respeta los términos de uso del sitio.

---

## Características principales

- **Panel flotante** siempre visible (se puede mover, fijar y redimensionar).
- **Entrada de productos en bloque** con el formato:
  - `codigo[-cantidad] persona`
  - Ejemplos:
    - `36316` (cantidad 1, sin persona)
    - `36316-3 Ana` (3 unidades para Ana)
- **Automatización de alta de productos**:
  - Navega a la página de búsqueda del código.
  - Busca el botón de “Agregar al carrito” con varios selectores robustos.
  - Hace clic la cantidad de veces necesaria.
- **Panel de productos capturados**:
  - Muestra tarjetas con imagen, código, nombre, persona, precio, categoría y oferta.
  - Totales (unidades y valor) arriba de la lista.
  - Orden por nombre o precio (asc/desc).
  - Botones:
    - “Abrir vista para Docs (HTML)” — genera una página HTML lista para copiar en Google Docs.
    - “Copiar para Docs (PNG)” — genera PNG recortados por producto (pensado para Docs/Slides).
    - “Reintentar fallidos → cola” — reinyecta códigos fallidos a la cola.
    - “Capturar productos visibles” — captura productos del grid actual.
- **Panel de productos fallidos**:
  - Muestra tarjetas similares a las de capturados, con etiqueta “Fallido X” y motivo.
  - Orden por nombre o precio (asc/desc).
  - Botón “Limpiar productos fallidos”.
- **Atajos de teclado**:
  - `Alt + C` — Capturar productos visibles en el grid.
  - `Alt + R` — Reiniciar posición y tamaño del panel.
- **Persistencia de estado**:
  - Recuerda si el panel está minimizado o fijado.
  - Recuerda posición y tamaño de la ventana.
  - Guarda cola de productos, capturados y fallidos entre recargas.

---

## Requisitos

- Google Chrome (o navegador compatible con extensiones Chrome, como Edge).
- Sistema operativo con PowerShell (para generar el bundle desde código fuente). En Windows ya viene incluido.

---

## Instalación (usuario final, desde código)

1. **Clonar o descargar** este repositorio.
2. **Generar el bundle** de contenido:
   - Abre una consola en la carpeta del proyecto.
   - Ejecuta:
     - `powershell ./scripts/simple-bundle.ps1`
   - Esto generará el archivo `dist/content.js` que Chrome usará como content script.
3. **Cargar la extensión en Chrome**:
   - Abre `chrome://extensions` en la barra de direcciones.
   - Activa el **Modo desarrollador** (arriba a la derecha).
   - Haz clic en **“Cargar descomprimida”**.
   - Selecciona la carpeta raíz del proyecto (donde está `manifest.json`).
4. **Probar**:
   - Navega a la página de Novaventa compatible, por ejemplo:
     - `https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/*`
   - Deberías ver el panel flotante “Automatizacion de Pedidos”.

---

## Uso básico

### Abrir/cerrar panel

- El panel aparece en la parte superior izquierda la primera vez.
- Puedes moverlo arrastrando la barra de título.
- Botones en la barra:
  - `Fijar/Desfijar`: fija la posición respecto a la ventana o al documento.
  - `Minimizar`: oculta el panel y muestra una barra “Abrir panel de productos” abajo a la izquierda.
- Para volver a abrirlo, haz clic en “Abrir panel de productos”.

### Ingresar productos

- En “Lista de productos (codigo[-cantidad] persona):” escribe uno por línea.
- Ejemplos:
  - `36316`
  - `36316-3 Ana`
  - `44834-2 Juan`
- Pulsa **“Agregar productos”**.
- El script empezará a navegar y añadir productos al carrito uno por uno.

### Ver productos capturados

- En el panel derecho verás “Productos capturados” con tarjetas por producto (deduplicadas por código/persona).
- Puedes ordenar por nombre o precio.
- Botones disponibles:
  - **“Abrir vista para Docs (HTML)”**: abre una página con tarjetas listas para copiar/pegar en Docs.
  - **“Copiar para Docs (PNG)”**: abre una página con PNG recortados por producto.
  - **“Reintentar fallidos → cola”**: toma los códigos fallidos y los vuelve a poner en la cola.
  - **“Capturar productos visibles”**: captura productos de la cuadrícula actual (útil cuando ya tienes productos en pantalla).
- **“Limpiar productos capturados”**: vacía la lista de capturados (no toca los fallidos).

### Ver productos fallidos

- En la parte izquierda, sección “Productos fallidos”.
- Muestra las tarjetas de los productos que no se pudieron agregar al carrito, con la información que se haya podido capturar (imagen, nombre, precio, etc.).
- Controles de orden: nombre, precio asc/desc (igual que capturados).
- Botón **“Limpiar productos fallidos”**: elimina tanto el texto de códigos fallidos como los datos detallados.

### Atajos útiles

- `Alt + C`: captura productos visibles en el grid.
- `Alt + R`: restablece posición y tamaño del panel.

---

## Estructura del proyecto

- `manifest.json`
  - Manifiesto MV3 de la extensión, apunta a `dist/content.js` como content script y a `content.css` como estilos.
- `content.css`
  - Estilos del panel flotante, barra minimizada y listas.
- `automation_novaventa`
  - Script original (Tampermonkey) con la lógica principal de la automatización.
- `src/`
  - `nv_namespace.js`: inicializa el namespace global `NV`.
  - `utils.js`: utilidades (parseo de precios, helpers DOM, logging y errores).
  - `state.js`: store centralizado en `localStorage` con migración desde claves legacy.
  - `renderers.js`: funciones de render UI (`renderSummary`, `renderProductItem`).
  - `exporters.js`: generación de vistas HTML/PNG para Google Docs.
- `scripts/simple-bundle.ps1`
  - Script que concatena los archivos fuente en orden y genera `dist/content.js`.
- `dist/content.js`
  - Bundle final que Chrome inyecta como content script.
- `types/nv.d.ts`
  - Declaraciones de tipos para tooling/TypeScript (Product, FailedProduct, NV.utils, etc.).

---

## Desarrollo

### Dev vs bundle

- Para desarrollo rápido, puedes apuntar el `manifest.json` directamente a los archivos de `src/` + `automation_novaventa` creando un `manifest.dev.json`.
- Para “producción” o uso diario, es más simple usar el bundle `dist/content.js`.

### Regenerar el bundle

- Cada vez que cambies archivos en `src/` o `automation_novaventa`, ejecuta:
  - `powershell ./scripts/simple-bundle.ps1`
- Luego recarga la extensión en `chrome://extensions`.

### Tipos y pruebas simples

- Tipos TS: ver `types/nv.d.ts`.
- Hay una página de pruebas simple para `parsePrice` en `tests/parsePrice.spec.html` (se abre en el navegador y muestra resultados en pantalla/console).

---

## Seguridad, límites y advertencias

- La extensión automatiza clics y navegación sobre la página de Novaventa.
- No evita cambios en el frontend de Novaventa; si cambian clases o estructura, puede dejar de funcionar.
- No envía datos a ningún servidor externo; todo el estado se guarda en `localStorage` del navegador.
- Úsala solo en tu cuenta, revisa siempre el carrito final antes de confirmar el pedido.

---

## FAQ rápida

**¿Por qué a veces hay fallidos aunque el producto exista?**  
Puede que el botón de “Agregar al carrito” no esté presente (por ejemplo, si estás en una vista de grid o si el producto está agotado). En ese caso, el producto se marca como fallido y aparece en el panel de fallidos.

**¿Por qué no veo imágenes en algunos fallidos?**  
Los datos de fallidos se capturan “a la mejor esfuerzo” según lo que haya en el DOM en ese momento. Si la página no tiene la imagen disponible o está protegida, el script deja ese campo vacío.

**¿Cómo actualizo a una nueva versión del código?**  
Haz `git pull` (o vuelve a descargar), ejecuta `powershell ./scripts/simple-bundle.ps1` y recarga la extensión.

---

## Contribuir

- Si quieres mejorar el script (nuevas vistas, mejor manejo de errores, más selectores para botones, etc.), abre un issue o PR.
- Antes de enviar cambios, ejecuta el bundler y prueba en la página real para asegurarte de que el panel se abre, los productos se agregan y las vistas de Docs funcionan.

