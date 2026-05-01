import { waitForBody, parseEntryLine, reportError, randomDelay, log } from './src/utils.js';
import { get, setUI, setFlags, setQueue, setCaptured, setFailed, setCurrentEntry, init as initState } from './src/state.js';
import { captureProductData, captureFailedProductData, captureVisibleFromGrid, getExactAddToCartButton } from './src/capture.js';
import { injectUI, setCooldown, hideCooldown, showCapturedProducts, showFailedProductsDetails } from './src/ui.js';
// @ts-ignore
import './content.css';

const LOGP = '[NV TM]';

  // ========= Lógica de Navegación =========
    async function processNextProduct() {
        if (!get()?.flags.isAddingProducts) return;
        const products = get()!.queue.products;
        if (products.length === 0) { 
            setFlags({ isAddingProducts: false });
            injectUI(appCallbacks);
            alert('¡Todos los productos de la cola han sido procesados!');
            return; 
        }

        const { code, quantity, person } = parseEntryLine(products[0]);
        if (!code) { handleError('Código de producto inválido.'); return; }

        setCurrentEntry({ person: person || '', qtyFromLine: String(quantity || '1'), codeFromLine: String(code || '') });

        console.log(LOGP, `Procesando producto código ${code} cantidad ${quantity} persona "${person}"`);
        
        const searchToggleBtn = document.querySelector<HTMLButtonElement>('button.site-header-content-ecommerce_option--search__lBgAH, button[aria-label*="buscador"]');
        let searchInput = document.querySelector<HTMLInputElement>('[data-testid="buscador-input"]');

        if (!searchInput && searchToggleBtn) {
            console.log(LOGP, 'Buscador oculto, expandiendo...');
            searchToggleBtn.click();
            await randomDelay(300, 600); // Esperar render del DOM virtual
            searchInput = document.querySelector<HTMLInputElement>('[data-testid="buscador-input"]');
        }

        if (searchInput) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            nativeInputValueSetter?.call(searchInput, code);
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            const searchBtn = searchInput.form?.querySelector<HTMLButtonElement>('button[type="submit"]') 
                           || document.querySelector<HTMLButtonElement>('button.buscador-input_form__btn__Ha2rK');
            if (searchBtn) searchBtn.click();
            else if (searchInput.form) searchInput.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            
            // Al usar SPA no hay recarga de página. Iniciamos la búsqueda del botón asíncronamente
            setTimeout(() => checkForProductButton(0).catch(e => log('error', 'Error en búsqueda de botón asíncrona', e)), 2000);
        } else {
            const baseUrl = window.location.origin.includes('oficinavirtual.novaventa.com')
                ? 'https://oficinavirtual.novaventa.com/search'
                : 'https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/search';
            window.location.href = `${baseUrl}/?text=${encodeURIComponent(code)}`;
        }
    }

  // ========= Agregar al carrito =========
  async function checkForProductButton(attempts = 0) {
    if (!get()?.flags.isAddingProducts) return;

    if (window.location.href.includes('/homepage')) {
      handleError('Navegación incorrecta, redirigido a la página de inicio.');
      return;
    }

    const products = get()!.queue.products.slice();
    if (!products.length) {
      setFlags({ isAddingProducts: false });
      return;
    }

    const { code, quantity: quantitySpecified } = parseEntryLine(products[0] || '');
    const quantity = (quantitySpecified || '1').trim();

    const buttonToClick = getExactAddToCartButton(code);
    if (buttonToClick) {
      console.log(LOGP, 'Botón encontrado, intentando agregar al carrito.');

      const quantityInt = Math.max(1, parseInt(quantity, 10) || 1);
      captureProductData(quantityInt);

      if (quantityInt > 1) {
        const card = buttonToClick.closest<HTMLElement>('[class*="product-item-card"], .cardproduct, .product-main, .product-details');
        const qtyInput = card?.querySelector<HTMLInputElement>('input[data-testid="numeric-up-down-input"], input.qtyList, input[name="qty"]');
        const plusBtn = card ? Array.from(card.querySelectorAll<HTMLButtonElement>('button')).find(b => b.querySelector('.fa-plus') || b.getAttribute('data-testid') === 'numeric-up-down__down') : null;
        
        if (plusBtn && !plusBtn.disabled) {
          console.log(LOGP, 'Ajustando cantidad mediante botón (+).');
          for (let i = 1; i < quantityInt; i++) {
            if (plusBtn.disabled) break;
            plusBtn.click();
            await randomDelay(150, 250);
          }
          await randomDelay(300, 500); // Esperar que React estabilice la validación interna
        } else if (qtyInput && !qtyInput.disabled) {
          qtyInput.focus();
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          setter?.call(qtyInput, quantityInt.toString());
          const tracker = (qtyInput as any)._valueTracker;
          if (tracker) tracker.setValue('');
          qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
          qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
          qtyInput.blur();
          await randomDelay(400, 700);
        } else if (!qtyInput) {
          console.warn(LOGP, 'Controles no encontrados, usando clics múltiples en Agregar (fallback).');
          for (let i = 1; i < quantityInt; i++) {
            if (buttonToClick.disabled) break;
            buttonToClick.click();
            await randomDelay(1200, 2200);
          }
        }
      }

      if (!buttonToClick.disabled) {
        buttonToClick.click();
      } else {
        console.warn(LOGP, 'El botón de Agregar se deshabilitó, omitiendo clic final.');
      }
      await randomDelay(2500, 3500); // Rate limiting dinámico final
      console.log(LOGP, 'Producto agregado correctamente al carrito.');
      products.shift();
      setQueue(products);
      processNextProduct().catch(e => log('error', 'Error al procesar siguiente producto', e));
    } else {
      if (attempts < 10) {
        console.warn(LOGP, `Intento ${attempts}: Botón AddToCart no encontrado. Reintentando...`);
        // Mostrar cooldown y permitir saltar
        let isSkipped = false;
        try {
          setCooldown(`Buscando Botón (intento ${attempts+1}/10)`, 1500, () => {
            isSkipped = true;
            try {
              const products = get()!.queue.products.slice();
              const skipped = products.shift();
              setQueue(products);
              const st = get()!;
              setFailed((st.failed.text || '') + (skipped || '') + '\n', st.failed.data);
              try { captureFailedProductData(); } catch(e) { log('warn', 'Failed to capture skipped product data', e); }
              reportError(`Producto saltado: ${skipped||''}`, { ui: true, level: 'warn', timeoutMs: 3000 });
            } catch(e) { log('warn', 'Failed to process skipped product', e); }
            hideCooldown();
            processNextProduct().catch(e => log('error', 'Error al avanzar tras salto manual', e));
          });
        } catch(e) { log('debug', 'Error during cooldown setup', e); }
        setTimeout(() => { 
          if (isSkipped) return;
          hideCooldown(); 
          if (get()?.flags.isAddingProducts) {
            checkForProductButton(attempts + 1).catch(e => log('error', 'Error en reintento de botón', e));
          }
        }, 1500);
      } else {
        try {
          const hints = {
            url: location.href,
            onGrid: !!document.querySelector('.cardproduct, [class*="cardproduct"]'),
            onDetail: !!document.querySelector('.product-main, .product-details, .js-nautilus-AddtoCart'),
            hasForm: !!document.querySelector('form.add_to_cart_form'),
          };
          reportError('No se encontró el botón de Agregar al carrito. ¿Estás en la página de detalle?', { ctx: hints, ui: true, level: 'warn', timeoutMs: 7000 });
        } catch(e) { log('debug', 'Failed to generate hints for error report', e); }

        const products = get()!.queue.products.slice();
        const failedProduct = products.shift();
        setQueue(products);

        const st = get()!;
        const failedText = (st.failed.text || '') + (failedProduct || '') + '\n';
        setFailed(failedText, st.failed.data);

        showFailedProductsDetails();
        try { captureFailedProductData(); } catch(e) { log('warn', 'Failed to capture failed product data', e); }

        console.error(LOGP, 'Botón AddToCart no encontrado tras múltiples intentos.');
        processNextProduct().catch(e => log('error', 'Error al avanzar tras fallo de botón', e));
      }
    }
  }

  // ========= Errores =========
  function handleError(errorMessage: string) {
    reportError(errorMessage, { ui: true, level: 'error' });
    console.error(LOGP, errorMessage);
    setFlags({ isAddingProducts: false });
    injectUI(appCallbacks);
    alert(errorMessage);
  }

  // App callbacks for UI modularity
  const appCallbacks: AppCallbacks = {
    onStartAdding: (text: string) => {
      setFlags({ isAddingProducts: true });
      setQueue(text.split('\n').map((s: string) => s.trim()).filter(Boolean));
      injectUI(appCallbacks);
      processNextProduct().catch(e => log('error', 'Error iniciando proceso maestro', e));
    },
    onStopAdding: () => {
      setFlags({ isAddingProducts: false });
      injectUI(appCallbacks);
      alert('Automatización detenida por el usuario.');
    },
    onClearFailed: () => {
      setFailed('', []);
      showFailedProductsDetails();
    },
    onClearCaptured: () => {
      setCaptured([]);
      showCapturedProducts();
    },
    onInit: () => {
      showCapturedProducts();
      showFailedProductsDetails();
    },
    onCaptureVisible: captureVisibleFromGrid
  };

  // ========= Arranque =========
  (async () => {
    try {
      initState();
      await waitForBody();
      console.log(LOGP, 'Arrancando en', location.href);
      injectUI(appCallbacks);

      // segundo intento por si la SPA hace swaps de DOM al inicio
      setTimeout(() => injectUI(appCallbacks), 1200);

      setTimeout(() => { if (get()?.flags.isAddingProducts) checkForProductButton().catch(e => log('error', 'Error en reanudación asíncrona', e)); }, 1500);

      // Reinsertar UI si la SPA la elimina (incluye la barra minimizada) con debounce
      try { window.__nvUiObserverPaused = false; } catch(e) { log('debug', 'Error resetting observer pause flag', e); }
      try { window.__nvUiObserver?.disconnect(); } catch(e) { log('debug', 'Error disconnecting observer', e); }
      const mo = new MutationObserver(() => {
        if (window.__nvUiObserverPaused) return;
        if (window.__nvUiObserverTimer) return;
        window.__nvUiObserverTimer = window.setTimeout(() => {
          try { window.__nvUiObserverTimer = null; } catch(e) { log('debug', 'Error clearing timer flag', e); }
          if (!document.getElementById('productsInputContainer') ||
              !document.getElementById('minimizedBar')) {
            console.log(LOGP, 'UI/Barra no encontrada, reinsertando...');
            try { window.__nvUiObserverPaused = true; injectUI(appCallbacks); } finally { setTimeout(() => { try { window.__nvUiObserverPaused = false; } catch(e) { log('debug', 'Error resetting observer pause flag', e); } }, 0); }
          }
        }, 250);
      });
      try { window.__nvUiObserver = mo; window.__nvUiObserverTarget = document.documentElement; window.__nvUiObserverOpts = { childList: true, subtree: true }; } catch(e) { log('debug', 'Error exposing observer to global', e); }
      mo.observe(document.documentElement, { childList: true, subtree: true });

      // Atajos (Alt+C y Alt+R)
      document.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyC') { e.preventDefault(); captureVisibleFromGrid(); }
        if (e.altKey && e.code === 'KeyR') {
          e.preventDefault();
          document.getElementById('productsInputContainer')?.remove();
          document.getElementById('minimizedBar')?.remove();
          setUI({ isMinimized: false, windowPosition: null, isPinned: false });
          injectUI(appCallbacks);
          alert('UI reiniciada (Alt+R).');
        }
      });

    } catch (e) {
      console.error(LOGP, 'Fallo de arranque:', e);
      try { injectUI(appCallbacks); } catch(err) { log('error', 'Fallo crítico al inyectar UI en fallback', err); }
    }
  })();
