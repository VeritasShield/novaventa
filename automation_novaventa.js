// ==UserScript==
// @name         Automatización de Pedidos Novaventa — Full Plus (TM) [HOTFIX UI + Docs PNG Trim]
// @namespace    http://tampermonkey.net/
// @version      3.1.0
// @description  Vista para Docs (HTML/PNG recortado), UI flotante, captura ampliada, totales es-CO y atajos.
// @match        https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  const LOGP = '[NV TM]';

  // ========= Aliases de Módulos Core =========
  const { waitForBody, parseEntryLine, reportError, delay, randomDelay } = window.NV.utils;
  const { get, setUI, setFlags, setQueue, setCaptured, setFailed, setCurrentEntry, init: initState } = window.NV.state;
  const { injectUI, setCooldown, hideCooldown, showCapturedProducts, showFailedProductsDetails } = window.NV.ui;
  const { captureProductData, captureFailedProductData, captureVisibleFromGrid } = window.NV.capture;

  // ========= Lógica de Navegación =========
    function processNextProduct() {
        if (!get().flags.isAddingProducts) return;
        const products = get().queue.products;
        if (products.length === 0) { 
            setFlags({ isAddingProducts: false });
            if (window.NV.ui && window.NV.ui.injectUI) window.NV.ui.injectUI(appCallbacks);
            alert('¡Todos los productos de la cola han sido procesados!');
            return; 
        }

        const { code, quantity, person } = parseEntryLine(products[0]);
        if (!code) { handleError('Código de producto inválido.'); return; }

        setCurrentEntry({ person: person || '', qtyFromLine: String(quantity || '1'), codeFromLine: String(code || '') });

        console.log(LOGP, `Procesando producto código ${code} cantidad ${quantity} persona "${person}"`);
        window.location.href =
            `https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/search/?text=${encodeURIComponent(code)}`;
    }

  // ========= Agregar al carrito =========
  async function checkForProductButton(attempts = 0) {
    if (!get().flags.isAddingProducts) return;

    if (window.location.href.includes('/homepage')) {
      handleError('Navegación incorrecta, redirigido a la página de inicio.');
      return;
    }

    function __nvFindAddToCartButton(){
      const selectors = [
        '[data-action="ADD_TO_CART"]',
        'button[name="addToCart"]',
        'button.js-nautilus-addToCart',
        'button.add-to-cart',
        'form.add_to_cart_form button[type="submit"]',
        'form.add_to_cart_form button',
        '.js-nautilus-AddtoCart button',
        '.product-details form button[type="submit"]',
        '.product-main form button[type="submit"]'
      ];
      for (const sel of selectors) {
        const btn = document.querySelector(sel);
        if (btn && !btn.disabled) return btn;
      }
      return null;
    }
    const buttonToClick = __nvFindAddToCartButton();
    if (buttonToClick) {
      console.log(LOGP, 'Botón encontrado, intentando agregar al carrito.');

        const products = get().queue.products.slice();
        const { code, quantity: quantitySpecified } = parseEntryLine(products[0] || '');
        const quantity = (quantitySpecified || '1').trim();

      if (quantity === '1') {
        captureProductData(1);
        buttonToClick.click();
        await randomDelay(2500, 3500); // Rate limiting dinámico (Jitter)
        console.log(LOGP, 'Producto agregado correctamente al carrito.');
        products.shift();
        setQueue(products);
        processNextProduct();
      } else {
        const quantityInt = Math.max(1, parseInt(quantity, 10) || 1);
        captureProductData(quantityInt);
        for (let i = 0; i < quantityInt; i++) {
          buttonToClick.click();
          await randomDelay(2000, 3200); // Jitter individual anti-baneos
        }
        await randomDelay(800, 1500);
        console.log(LOGP, 'Producto agregado correctamente al carrito.');
        products.shift();
        setQueue(products);
        processNextProduct();
      }
    } else {
      if (attempts < 10) {
        console.warn(LOGP, `Intento ${attempts}: Botón AddToCart no encontrado. Reintentando...`);
        // Mostrar cooldown y permitir saltar
        try {
          setCooldown(`Buscando Botón (intento ${attempts+1}/10)`, 1500, () => {
            try {
              const products = get().queue.products.slice();
              const skipped = products.shift();
              setQueue(products);
              const st = get();
              setFailed((st.failed.text || '') + (skipped || '') + '\n', st.failed.data);
              try { captureFailedProductData(); } catch(_) {}
              reportError(`Producto saltado: ${skipped||''}`, { ui: true, level: 'warn', timeoutMs: 3000 });
            } catch(_) {}
            hideCooldown();
            processNextProduct();
          });
        } catch(_) {}
        setTimeout(() => { hideCooldown(); checkForProductButton(attempts + 1); }, 1500);
      } else {
        try {
          const hints = {
            url: location.href,
            onGrid: !!document.querySelector('.cardproduct, [class*="cardproduct"]'),
            onDetail: !!document.querySelector('.product-main, .product-details, .js-nautilus-AddtoCart'),
            hasForm: !!document.querySelector('form.add_to_cart_form'),
          };
          reportError('No se encontró el botón de Agregar al carrito. ¿Estás en la página de detalle?', { ctx: hints, ui: true, level: 'warn', timeoutMs: 7000 });
        } catch(_) {}

        const products = get().queue.products.slice();
        const failedProduct = products.shift();
        setQueue(products);

        const st = get();
        const failedText = (st.failed.text || '') + (failedProduct || '') + '\n';
        setFailed(failedText, st.failed.data);

        if (window.NV.ui && typeof window.NV.ui.showFailedProductsDetails === 'function') {
            window.NV.ui.showFailedProductsDetails();
        }
        try { captureFailedProductData(); } catch(_) {}

        console.error(LOGP, 'Botón AddToCart no encontrado tras múltiples intentos.');
        processNextProduct();
      }
    }
  }

  // ========= Errores =========
  function handleError(errorMessage) {
    reportError(errorMessage, { ui: true, level: 'error' });
    console.error(LOGP, errorMessage);
    setFlags({ isAddingProducts: false });
    if (window.NV.ui && window.NV.ui.injectUI) window.NV.ui.injectUI(appCallbacks);
    alert(errorMessage);
  }

  // App callbacks for UI modularity
  const appCallbacks = {
    onStartAdding: (text) => {
      setFlags({ isAddingProducts: true });
      setQueue(text.split('\n').map(s => s.trim()).filter(Boolean));
      injectUI(appCallbacks);
      processNextProduct();
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
      window.NV.LOGP = LOGP;
      initState();
      await waitForBody();
      console.log(LOGP, 'Arrancando en', location.href);
      injectUI(appCallbacks);

      // segundo intento por si la SPA hace swaps de DOM al inicio
      setTimeout(() => injectUI(appCallbacks), 1200);

      setTimeout(() => { if (get().flags.isAddingProducts) checkForProductButton(); }, 1500);

      // Reinsertar UI si la SPA la elimina (incluye la barra minimizada) con debounce
      try { window.__nvUiObserverPaused = false; } catch(_) {}
      try { if (window.__nvUiObserver && window.__nvUiObserver.disconnect) window.__nvUiObserver.disconnect(); } catch(_) {}
      const mo = new MutationObserver(() => {
        if (window.__nvUiObserverPaused) return;
        if (window.__nvUiObserverTimer) return;
        window.__nvUiObserverTimer = setTimeout(() => {
          try { window.__nvUiObserverTimer = null; } catch(_) {}
          if (!document.getElementById('productsInputContainer') ||
              !document.getElementById('minimizedBar')) {
            console.log(LOGP, 'UI/Barra no encontrada, reinsertando...');
            try { window.__nvUiObserverPaused = true; injectUI(appCallbacks); } finally { setTimeout(() => { try { window.__nvUiObserverPaused = false; } catch(_) {} }, 0); }
          }
        }, 250);
      });
      try { window.__nvUiObserver = mo; window.__nvUiObserverTarget = document.documentElement; window.__nvUiObserverOpts = { childList: true, subtree: true }; } catch(_) {}
      mo.observe(document.documentElement, { childList: true, subtree: true });

      // Atajos (Alt+C y Alt+R)
      document.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyC') { e.preventDefault(); captureVisibleFromGrid(); }
        if (e.altKey && e.code === 'KeyR') {
          e.preventDefault();
          setUI({ isMinimized: false, windowPosition: null });
          injectUI(appCallbacks);
          alert('UI reiniciada (Alt+R).');
        }
      });

    } catch (e) {
      console.error(LOGP, 'Fallo de arranque:', e);
      try { injectUI(appCallbacks); } catch(_) {}
    }
  })();

})();
