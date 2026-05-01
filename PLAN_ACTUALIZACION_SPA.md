# 🗺️ Plan de Actualización: Migración a SPA Novaventa (Next.js)

Este documento rastrea las refactorizaciones necesarias para adaptar la extensión al nuevo frontend basado en React/Next.js de la plataforma de Novaventa.

## ✅ Fase 1: Selectores de Captura y Estructuras (Completado)
- [x] **Nuevos Contenedores:** Migrar la búsqueda de botones de `.js-nautilus-AddtoCart` a los nuevos nodos anidados `[data-testid="numeric-up-down__up"]` y botones `.button_button--primary__70Vcr`.
- [x] **Precisión de Búsqueda (Falsos Positivos):** En búsquedas de códigos cortos (ej. `4345`), la plataforma retorna sugerencias difusas (`43450`, `43456`). Se implementó un motor de coincidencia exacta en `capture.ts` que valida explícitamente el texto `CL: 4345` o la URL de la tarjeta `href*="-4345/p"`.
- [x] **Lectura Dinámica de Cantidad:** Adaptar la extracción de cantidades para leer del nuevo input React `[data-testid="numeric-up-down-input"]`.

## ✅ Fase 2: Lógica de Búsqueda Dinámica (Navegación)
- [x] **Evitar Recargas Completas:** La navegación antigua (`window.location.href = '.../search/?text='`) destruye el estado de la SPA. Se migró a la manipulación directa del nuevo DOM.
- [x] **Inyección de Estado React:** Se emuló el prototipo nativo del `HTMLInputElement` en el selector `[data-testid="buscador-input"]` para engañar al DOM Virtual de React, permitiendo disparar búsquedas asíncronas sin recargar la página.

## ⏳ Fase 3: Validaciones de Casos Límite y Deshabilitaciones
- [x] **Puntos Insuficientes / Límite de Ciclo:** Los botones de "Agregar al Carrito" ahora pueden estar en estado `disabled=""` nativo y contener sub-mensajes como *Te faltan 53.806 puntos* o *No puedes agregar más de 0 unidad*.
- [x] **Orquestación de Fallidos:** Si el botón maestro exacto está desactivado, el bucle asíncrono (`automation_novaventa.ts`) decaerá por *timeout* seguro y lo registrará en el panel de fallidos.
- [ ] **Observabilidad Avanzada (Pendiente):** Refinar `capture.ts` para extraer exactamente el motivo del bloqueo (ej. "Puntos insuficientes") y mostrarlo en la tabla del HTML de fallidos.

## ✅ Fase 4: Observadores de Mutación SPA
**Problema inminente:** En aplicaciones React/Next.js, el DOM cambia asíncronamente. Cuando hacemos clic en "Buscar", los resultados no aparecen inmediatamente.
- [x] Ajustar el retraso de reintentos (`checkForProductButton`): Se implementó un delay de orquestación (`setTimeout`) en `processNextProduct` tras disparar el evento `submit` nativo de React, garantizando que el DOM se hidrate antes de buscar el botón "Agregar".

---

**Nota de Progreso:** 
Las Fases 1 y 2 ya están implementadas en el código (`capture.ts` y `automation_novaventa.ts`).