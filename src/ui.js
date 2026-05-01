import { getLogLevel, setLogLevel, parsePrice, dedupeProducts, log } from './utils.js';
import { get, getUI, setUI, setCaptured, setQueue, setFailed, hardReset } from './state.js';
import { renderSummary, renderProductItem } from './renderers.js';
import { exportBackup, openPrintableDoc, openDocsPNG, openSubtotalsTable, openFailedReport } from './exporters.js';

  let isDragging = false;
  let offsetX, offsetY;
  let isResizing = false;
  let appCallbacks = {};

  function onMouseDown(e) {
    if (e.target.id === 'resizeHandle') return;
    isDragging = true;
    const div = document.getElementById('productsInputContainer');
    if (!div) return;
    offsetX = e.clientX - div.getBoundingClientRect().left;
    offsetY = e.clientY - div.getBoundingClientRect().top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  function onMouseMove(e) {
    const div = document.getElementById('productsInputContainer');
    if (!div) return;
    if (isDragging) {
      const isPinned = getUI().isPinned;
      const scrollX = isPinned ? window.scrollX : 0;
      const scrollY = isPinned ? window.scrollY : 0;
      div.style.left = (e.clientX - offsetX + scrollX) + 'px';
      div.style.top = (e.clientY - offsetY + scrollY) + 'px';
    } else if (isResizing) {
      div.style.width = (e.clientX - div.getBoundingClientRect().left) + 'px';
      div.style.height = (e.clientY - div.getBoundingClientRect().top) + 'px';
    }
  }
  function onMouseUp() {
    isDragging = false;
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    const div = document.getElementById('productsInputContainer');
    if (!div) return;
    setUI({ windowPosition: { left: div.style.left, top: div.style.top, width: div.style.width, height: div.style.height } });
  }
  function onResizeMouseDown(e) {
    isResizing = true; e.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  export function minimizeWindow() {
    const div = document.getElementById('productsInputContainer');
    const minimizedBar = document.getElementById('minimizedBar');
    if (!div || !minimizedBar) return;
    div.style.display = 'none';
    minimizedBar.style.display = 'block';
    setUI({ isMinimized: true });
  };

  export function restoreWindow(callbacks) {
    const div = document.getElementById('productsInputContainer');
    const minimizedBar = document.getElementById('minimizedBar');
    if (!div || !minimizedBar) {
      setUI({ isMinimized: false });
      injectUI(callbacks);
      return;
    }
    div.style.display = 'flex';
    minimizedBar.style.display = 'none';
    setUI({ isMinimized: false });
  };

  export function togglePin() {
    const div = document.getElementById('productsInputContainer');
    const pinButton = document.getElementById('pinButton');
    if (!div || !pinButton) return;
    const isPinned = !(getUI().isPinned);
    
    const rect = div.getBoundingClientRect();
    if (isPinned) {
      div.style.position = 'absolute';
      div.style.top = (rect.top + window.scrollY) + 'px';
      div.style.left = (rect.left + window.scrollX) + 'px';
    } else {
      div.style.position = 'fixed';
      div.style.top = rect.top + 'px';
      div.style.left = rect.left + 'px';
    }
    
    pinButton.textContent = isPinned ? 'Desfijar' : 'Fijar';
    setUI({ isPinned, windowPosition: { left: div.style.left, top: div.style.top, width: div.style.width, height: div.style.height } });
  };

  export function ensureMinimizedBar(callbacks) {
    let minimizedBar = document.getElementById('minimizedBar');
    const isMin = getUI().isMinimized;
    if (!minimizedBar) {
      minimizedBar = document.createElement('div');
      minimizedBar.id = 'minimizedBar';
      minimizedBar.textContent = 'Abrir panel de productos';
      minimizedBar.addEventListener('click', () => restoreWindow(callbacks));
      Object.assign(minimizedBar.style, {
        position: 'fixed', bottom: '10px', left: '10px', backgroundColor: '#4CAF50', color: '#fff',
        padding: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.2)', zIndex: '2147483647', cursor: 'pointer',
        borderRadius: '5px', fontFamily: 'Arial, sans-serif', display: isMin ? 'block' : 'none'
      });
      (document.body || document.documentElement).prepend(minimizedBar);
    } else {
      minimizedBar.style.display = isMin ? 'block' : 'none';
    }
  };

  export function setCooldown(message, ms = 1500, onSkip = null) {
    const bar = document.getElementById('nvCooldown');
    if (!bar) return;
    bar.replaceChildren();
    const span = document.createElement('span'); span.textContent = String(message || ''); bar.appendChild(span);
    if (onSkip) {
      const sp = document.createElement('span'); sp.textContent = '  '; bar.appendChild(sp);
      const btn = document.createElement('button'); btn.textContent = 'Saltar y continuar'; btn.style.marginLeft = '6px';
      btn.addEventListener('click', onSkip); bar.appendChild(btn);
    }
    const timerSpan = document.createElement('span'); timerSpan.style.marginLeft = '6px'; bar.appendChild(timerSpan);
    bar.style.display = 'block';
    const t0 = Date.now();
    if (window.__nvCooldownTimer) clearInterval(window.__nvCooldownTimer);
    window.__nvCooldownTimer = setInterval(() => {
      const left = Math.max(0, ms - (Date.now() - t0));
      timerSpan.textContent = ` (reintento en ${Math.ceil(left/1000)}s)`;
      if (left <= 0) clearInterval(window.__nvCooldownTimer);
    }, 200);
  };

  export function hideCooldown() {
    const bar = document.getElementById('nvCooldown');
    if (bar) { bar.style.display = 'none'; bar.replaceChildren(); }
    if (window.__nvCooldownTimer) {
      clearInterval(window.__nvCooldownTimer);
      window.__nvCooldownTimer = null;
    }
  };

  export function injectUI(callbacks) {
    appCallbacks = callbacks || {};
    try { window.__nvUiObserverPaused = true; } catch(e) { log('debug', 'Failed to pause observer', e); }
    if (document.getElementById('productsInputContainer')) { ensureMinimizedBar(callbacks); setTimeout(() => { try { window.__nvUiObserverPaused = false; } catch(e) { log('debug', 'Failed to unpause observer', e); } }, 0); return; }

    ensureMinimizedBar(callbacks);
    const st = get();
    const uiSt = st.ui || {};

    const div = document.createElement('div');
    div.id = 'productsInputContainer';
    div.style.display = uiSt.isMinimized ? 'none' : 'flex';
    div.style.position = uiSt.isPinned ? 'absolute' : 'fixed';
    div.style.top = '100px'; div.style.left = '100px'; div.style.width = '380px'; div.style.minWidth = '300px'; div.style.minHeight = '220px';
    div.style.backgroundColor = '#f1f1f1'; div.style.boxShadow = '0 0 15px rgba(0,0,0,.3)'; div.style.zIndex = '2147483647';
    div.style.borderRadius = '10px'; div.style.overflow = 'hidden'; div.style.flexDirection = 'column';

    if (uiSt.windowPosition) {
      if (uiSt.windowPosition.left) div.style.left = uiSt.windowPosition.left;
      if (uiSt.windowPosition.top) div.style.top = uiSt.windowPosition.top;
      if (uiSt.windowPosition.width) div.style.width = uiSt.windowPosition.width;
      if (uiSt.windowPosition.height) div.style.height = uiSt.windowPosition.height;
    }

    const titleBar = document.createElement('div'); titleBar.className = 'titleBar';
    const title = document.createElement('span'); title.className = 'title'; title.textContent = 'Automatizacion de Pedidos'; titleBar.appendChild(title);
    const titleButtons = document.createElement('div'); titleButtons.className = 'buttons';
    const pinButton = document.createElement('button'); pinButton.id = 'pinButton'; pinButton.textContent = uiSt.isPinned ? 'Desfijar' : 'Fijar';
    pinButton.addEventListener('click', togglePin); titleButtons.appendChild(pinButton);
    const minimizeButton = document.createElement('button'); minimizeButton.textContent = 'Minimizar'; minimizeButton.addEventListener('click', minimizeWindow); titleButtons.appendChild(minimizeButton);
    
    try {
      const logButton = document.createElement('button'); logButton.id = 'nvLogButton';
      const refresh = () => { logButton.textContent = (String(getLogLevel()).toLowerCase()==='debug') ? 'Depurar' : 'Registro'; };
      refresh();
      logButton.addEventListener('click', () => { setLogLevel((String(getLogLevel()).toLowerCase()==='debug') ? 'info' : 'debug'); refresh(); });
      titleButtons.appendChild(logButton);
    } catch(e) { log('warn', 'Failed to render log button', e); }

    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Exportar';
    exportBtn.title = 'Exportar historial y configuracion a JSON';
    exportBtn.addEventListener('click', () => {
      exportBackup(get());
    });
    titleButtons.appendChild(exportBtn);

    const hardResetBtn = document.createElement('button');
    hardResetBtn.textContent = 'Reset';
    hardResetBtn.title = 'Borrar todo el historial y configuracion';
    hardResetBtn.addEventListener('click', () => {
      if (confirm('¿Estas seguro de borrar TODO el historial de productos y la configuracion? Esta accion no se puede deshacer.')) {
        hardReset();
        window.location.reload();
      }
    });
    titleButtons.appendChild(hardResetBtn);

    titleBar.appendChild(titleButtons); titleBar.addEventListener('mousedown', onMouseDown); div.appendChild(titleBar);
    const contentContainer = document.createElement('div'); contentContainer.className = 'content';
    const innerContainer = document.createElement('div'); innerContainer.className = 'innerContainer';
    const textareaLabel = document.createElement('label'); textareaLabel.textContent = 'Lista de productos (codigo[-cantidad] persona):'; innerContainer.appendChild(textareaLabel);
    const textarea = document.createElement('textarea'); textarea.id = 'productsInput'; textarea.rows = 6;
    textarea.value = (st.queue.products || []).join('\n');
    textarea.disabled = !!st.flags.isAddingProducts;
    innerContainer.appendChild(textarea);

    const actionButtonsRow = document.createElement('div');
    actionButtonsRow.style.display = 'flex'; actionButtonsRow.style.gap = '8px'; actionButtonsRow.style.marginTop = '10px';

    const btn = document.createElement('button'); btn.id = 'startAdding'; btn.className = 'actionButton';
    btn.textContent = 'Agregar productos'; btn.style.marginTop = '0';
    btn.style.display = st.flags.isAddingProducts ? 'none' : 'block';

    const stopBtn = document.createElement('button'); stopBtn.id = 'stopAdding'; stopBtn.className = 'actionButton';
    stopBtn.textContent = 'Detener automatización'; stopBtn.style.marginTop = '0'; stopBtn.style.backgroundColor = '#d32f2f';
    stopBtn.style.display = st.flags.isAddingProducts ? 'block' : 'none';

    actionButtonsRow.appendChild(btn); actionButtonsRow.appendChild(stopBtn);
    innerContainer.appendChild(actionButtonsRow);

    const clearFailedBtn = document.createElement('button'); clearFailedBtn.id = 'clearFailedProducts'; clearFailedBtn.className = 'actionButton'; clearFailedBtn.textContent = 'Limpiar productos fallidos'; innerContainer.appendChild(clearFailedBtn);
    const cooldownBar = document.createElement('div'); cooldownBar.id = 'nvCooldown'; cooldownBar.style.display = 'none'; innerContainer.appendChild(cooldownBar);
    const failedProductsDiv = document.createElement('div'); failedProductsDiv.id = 'failedProductsContainer'; failedProductsDiv.className = 'productsContainer';
    const h3 = document.createElement('h3'); h3.textContent = 'Productos fallidos:'; failedProductsDiv.appendChild(h3);
    const details = document.createElement('div'); details.id = 'failedProductsDetails'; failedProductsDiv.appendChild(details);
    innerContainer.appendChild(failedProductsDiv); contentContainer.appendChild(innerContainer);
    const capturedProductsPanel = document.createElement('div'); capturedProductsPanel.id = 'capturedProductsPanel';
    const clearCapturedBtn = document.createElement('button'); clearCapturedBtn.id = 'clearCapturedProducts'; clearCapturedBtn.className = 'actionButton'; clearCapturedBtn.textContent = 'Limpiar productos capturados'; capturedProductsPanel.appendChild(clearCapturedBtn);
    const capturedProductsDiv = document.createElement('div'); capturedProductsDiv.id = 'capturedProductsContainer'; capturedProductsDiv.className = 'productsContainer'; capturedProductsPanel.appendChild(capturedProductsDiv);
    contentContainer.appendChild(capturedProductsPanel); div.appendChild(contentContainer);
    const resizeHandle = document.createElement('div'); resizeHandle.id = 'resizeHandle'; resizeHandle.addEventListener('mousedown', onResizeMouseDown); div.appendChild(resizeHandle);
    (document.body || document.documentElement).prepend(div);

    btn.addEventListener('click', () => callbacks.onStartAdding(textarea.value));
    stopBtn.addEventListener('click', () => { if (callbacks.onStopAdding) callbacks.onStopAdding(); });
    clearFailedBtn.addEventListener('click', callbacks.onClearFailed);
    clearCapturedBtn.addEventListener('click', callbacks.onClearCaptured);

    if (callbacks.onInit) callbacks.onInit();
    setTimeout(() => { try { window.__nvUiObserverPaused = false; } catch(e) { log('debug', 'Failed to unpause observer', e); } }, 0);
  };

  export function showCapturedProducts() {
    const capturedProductsDiv = document.getElementById('capturedProductsContainer');
    if (!capturedProductsDiv) return;
    let capturedProducts = get().capturedProducts.slice();

    if (capturedProducts.length === 0) {
      capturedProductsDiv.textContent = '';
      const p = document.createElement('p');
      p.textContent = 'No hay productos capturados.';
      capturedProductsDiv.appendChild(p);
      return;
    }

    const controls = document.createElement('div');
    controls.style.display = 'flex'; controls.style.flexWrap = 'wrap';
    controls.style.gap = '8px'; controls.style.margin = '0 0 10px 0';

    const sortSelect = document.createElement('select');
    [
      { value: '', text: 'Ordenar...' },
      { value: 'name', text: 'Nombre (A-Z)' },
      { value: 'price', text: 'Precio (asc)' },
      { value: 'price_desc', text: 'Precio (desc)' }
    ].forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.text; sortSelect.appendChild(op); });
    
    sortSelect.onchange = () => {
      const val = sortSelect.value;
      if (val === 'name') capturedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      if (val === 'price') capturedProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      if (val === 'price_desc') capturedProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      setCaptured(capturedProducts);
      showCapturedProducts();
    };
    controls.appendChild(sortSelect);

    const btnDocs = document.createElement('button');
    btnDocs.className = 'actionButton'; btnDocs.textContent = 'Abrir vista para Docs (HTML)';
    btnDocs.onclick = () => { openPrintableDoc(dedupeProducts(capturedProducts)); };
    controls.appendChild(btnDocs);

    const btnDocsPNG = document.createElement('button');
    btnDocsPNG.className = 'actionButton'; btnDocsPNG.textContent = 'Copiar para Docs (PNG)';
    btnDocsPNG.onclick = async () => { await openDocsPNG(dedupeProducts(capturedProducts)); };
    controls.appendChild(btnDocsPNG);

    const btnSubtotals = document.createElement('button');
    btnSubtotals.className = 'actionButton'; btnSubtotals.textContent = 'Tabla de Subtotales';
    btnSubtotals.onclick = () => { openSubtotalsTable(dedupeProducts(capturedProducts, { perPerson: true })); };
    controls.appendChild(btnSubtotals);

    const btnRetry = document.createElement('button');
    btnRetry.className = 'actionButton'; btnRetry.textContent = 'Reintentar fallidos → cola';
    btnRetry.onclick = () => {
      const st = get();
      const failed = (st.failed.text || '').trim();
      if (!failed) return alert('No hay fallidos');
      const arr = failed.split('\n').filter(Boolean);
      setQueue([...arr, ...st.queue.products]);
      setFailed('', []);
      alert(`Reinyectados ${arr.length} productos a la cola`);
      showFailedProductsDetails();
    };
    controls.appendChild(btnRetry);

    const btnCapture = document.createElement('button');
    btnCapture.className = 'actionButton'; btnCapture.textContent = 'Capturar productos visibles';
    if (appCallbacks && appCallbacks.onCaptureVisible) btnCapture.onclick = appCallbacks.onCaptureVisible;
    controls.appendChild(btnCapture);

    capturedProductsDiv.replaceChildren();
    capturedProductsDiv.appendChild(controls);

    const productMap = dedupeProducts(capturedProducts, { perPerson: true });
    let totalQty = 0; let totalValue = 0;
    productMap.forEach(p => { totalQty += p.quantity; totalValue += parsePrice(p.price) * p.quantity; });

    const frag = document.createDocumentFragment();
    frag.appendChild(renderSummary(totalQty, totalValue));
    let index = 1;
    productMap.forEach(product => { frag.appendChild(renderProductItem(product, index++, 'Producto')); });
    capturedProductsDiv.appendChild(frag);
  };

  export function showFailedProductsDetails() {
    const container = document.getElementById('failedProductsContainer');
    if (!container) return;
    
    let details = get().failed.data.slice();
    container.replaceChildren();
    const h3 = document.createElement('h3'); h3.textContent = 'Productos fallidos:'; container.appendChild(h3);
    
    const controls = document.createElement('div');
    controls.style.display = 'flex'; controls.style.flexWrap = 'wrap';
    controls.style.gap = '8px'; controls.style.margin = '0 0 10px 0';
    const sortSelect = document.createElement('select');
    [
      { value: '', text: 'Ordenar...' },
      { value: 'name', text: 'Nombre (A-Z)' },
      { value: 'price', text: 'Precio (asc)' },
      { value: 'price_desc', text: 'Precio (desc)' }
    ].forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.text; sortSelect.appendChild(op); });
    controls.appendChild(sortSelect); container.appendChild(controls);

    const btnReport = document.createElement('button');
    btnReport.className = 'actionButton'; btnReport.textContent = 'Generar Reporte de Agotados';
    btnReport.onclick = async () => {
      if (openFailedReport) {
        btnReport.textContent = 'Generando...';
        await openFailedReport(dedupeProducts(details, { perPerson: true }));
        btnReport.textContent = 'Generar Reporte de Agotados';
      }
    };
    controls.appendChild(btnReport);
    
    const detailsDiv = document.createElement('div'); 
    detailsDiv.id = 'failedProductsDetails'; 
    container.appendChild(detailsDiv);
    
    try {
      sortSelect.onchange = () => {
        const val = sortSelect.value;
        let data = get().failed.data.slice();
        if (val === 'name') data.sort((a,b) => (a.name||'').localeCompare(b.name||''));
        if (val === 'price') data.sort((a,b) => (parsePrice(a.price)||0) - (parsePrice(b.price)||0));
        if (val === 'price_desc') data.sort((a,b) => (parsePrice(b.price)||0) - (parsePrice(a.price)||0));
        setFailed(get().failed.text, data);
        showFailedProductsDetails();
      };
    } catch(e) { log('warn', 'Failed to bind failed products sort logic', e); }

    if (!details || details.length === 0) {
      detailsDiv.innerHTML = '<p style="margin:6px 0;color:#666;font-size:13px">No hay productos fallidos.</p>';
      return;
    }

    const productMap = dedupeProducts(details, { perPerson: true });
    let totalQty = 0; let totalValue = 0;
    productMap.forEach(p => {
      const q = p.quantity || 1;
      totalQty += q; totalValue += (parsePrice(p.price) || 0) * q;
    });

    const frag = document.createDocumentFragment();
    frag.appendChild(renderSummary(totalQty, totalValue));
    let index = 1;
    productMap.forEach(p => { frag.appendChild(renderProductItem(p, index++, { type: 'failed', label: 'Fallido' })); });
    detailsDiv.appendChild(frag);
  };