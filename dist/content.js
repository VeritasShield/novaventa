// Bundled for MV3 (simple concat)
// Generated: 2025-11-13T15:16:44.8081036-05:00
(function(){ /* bundle-scope */

// ===== src/nv_namespace.js =====

(function(){
  try {
    window.NV = window.NV || {};
    NV.utils = NV.utils || {};
    NV.exporters = NV.exporters || {};
    NV.ui = NV.ui || {};
    NV.capture = NV.capture || {};
    NV.state = NV.state || {};
    NV.LOGP = NV.LOGP || '[NV TM]';
  } catch (_) {}
})();



// ===== src/state.js =====

(function(){
  const NVNS = (window.NV = window.NV || {});
  NVNS.state = NVNS.state || {};
  const S = NVNS.state;

  const VERSION = 1;
  const KEY = 'nv_state';
  let suspendHook = false;

  // Keep references to original Storage methods to avoid recursion
  const _Storage = typeof Storage !== 'undefined' ? Storage : null;
  const orig = {
    setItem: _Storage && _Storage.prototype && _Storage.prototype.setItem ? _Storage.prototype.setItem : null,
    getItem: _Storage && _Storage.prototype && _Storage.prototype.getItem ? _Storage.prototype.getItem : null,
    removeItem: _Storage && _Storage.prototype && _Storage.prototype.removeItem ? _Storage.prototype.removeItem : null
  };

  function readLegacyJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; }
  }

  function readLegacyString(key, fallback) {
    const v = localStorage.getItem(key);
    return v == null ? fallback : String(v);
  }

  function readLegacyBool(key, fallback) {
    const v = localStorage.getItem(key);
    return v == null ? fallback : (String(v) === 'true');
  }

  function legacyToState() {
    const productsStr = readLegacyString('products', '');
    const products = productsStr.split('\n').map(s => s.trim()).filter(Boolean);
    const capturedProducts = readLegacyJSON('capturedProducts', []) || [];
    const failedText = readLegacyString('failedProducts', '');
    const failedData = readLegacyJSON('failedProductsData', []) || [];
    const isMinimized = readLegacyBool('isMinimized', false);
    const isPinned = readLegacyBool('isPinned', false);
    const windowPosition = readLegacyJSON('windowPosition', null);
    const isAddingProducts = readLegacyBool('isAddingProducts', false);
    const currentPerson = readLegacyString('currentPerson', '');
    const currentQtyFromLine = readLegacyString('currentQtyFromLine', '1');
    const currentCodeFromLine = readLegacyString('currentCodeFromLine', '');

    return {
      version: VERSION,
      ui: { isMinimized, isPinned, windowPosition },
      flags: { isAddingProducts },
      queue: { products },
      capturedProducts,
      failed: { text: failedText, data: failedData },
      currentEntry: { person: currentPerson, qtyFromLine: currentQtyFromLine, codeFromLine: currentCodeFromLine }
    };
  }

  function migrate(data) {
    if (!data || typeof data !== 'object') return legacyToState();
    if (!('version' in data)) data.version = 0;
    // future migrations go here
    if (data.version < 1) {
      data.version = 1;
      data.ui = data.ui || { isMinimized: false, isPinned: false, windowPosition: null };
      data.flags = data.flags || { isAddingProducts: false };
      data.queue = data.queue || { products: [] };
      data.capturedProducts = data.capturedProducts || [];
      data.failed = data.failed || { text: '', data: [] };
      data.currentEntry = data.currentEntry || { person: '', qtyFromLine: '1', codeFromLine: '' };
    }
    return data;
  }

  function stateToLegacy(data) {
    if (!data) return;
    try {
      suspendHook = true;
      const st = data;
      const join = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');
      localStorage.setItem('isMinimized', st.ui && st.ui.isMinimized ? 'true' : 'false');
      localStorage.setItem('isPinned', st.ui && st.ui.isPinned ? 'true' : 'false');
      if (st.ui && st.ui.windowPosition != null) {
        localStorage.setItem('windowPosition', JSON.stringify(st.ui.windowPosition));
      }
      localStorage.setItem('isAddingProducts', st.flags && st.flags.isAddingProducts ? 'true' : 'false');
      localStorage.setItem('products', join(st.queue && st.queue.products));
      localStorage.setItem('capturedProducts', JSON.stringify(st.capturedProducts || []));
      localStorage.setItem('failedProducts', st.failed && typeof st.failed.text === 'string' ? st.failed.text : '');
      localStorage.setItem('failedProductsData', JSON.stringify((st.failed && st.failed.data) || []));
      localStorage.setItem('currentPerson', (st.currentEntry && st.currentEntry.person) || '');
      localStorage.setItem('currentQtyFromLine', (st.currentEntry && st.currentEntry.qtyFromLine) || '1');
      localStorage.setItem('currentCodeFromLine', (st.currentEntry && st.currentEntry.codeFromLine) || '');
    } catch (_) {
      // ignore
    } finally {
      suspendHook = false;
    }
  }

  function saveAggregate(data) {
    try {
      suspendHook = true;
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (_) {
      // ignore
    } finally {
      suspendHook = false;
    }
  }

  function handleLegacyWrite(key, value, removed) {
    if (suspendHook) return;
    if (!S.data) return;
    if (key === KEY) return; // ignore self
    try {
      const st = S.data;
      switch (key) {
        case 'isMinimized': st.ui.isMinimized = String(value) === 'true'; break;
        case 'isPinned': st.ui.isPinned = String(value) === 'true'; break;
        case 'windowPosition': st.ui.windowPosition = removed ? null : JSON.parse(String(value) || 'null'); break;
        case 'isAddingProducts': st.flags.isAddingProducts = String(value) === 'true'; break;
        case 'products': st.queue.products = removed ? [] : String(value || '').split('\n').map(s => s.trim()).filter(Boolean); break;
        case 'capturedProducts': st.capturedProducts = removed ? [] : (JSON.parse(String(value || '[]')) || []); break;
        case 'failedProducts': st.failed.text = removed ? '' : String(value || ''); break;
        case 'failedProductsData': st.failed.data = removed ? [] : (JSON.parse(String(value || '[]')) || []); break;
        case 'currentPerson': if (!st.currentEntry) st.currentEntry = {}; st.currentEntry.person = String(value || ''); break;
        case 'currentQtyFromLine': if (!st.currentEntry) st.currentEntry = {}; st.currentEntry.qtyFromLine = String(value || '1'); break;
        case 'currentCodeFromLine': if (!st.currentEntry) st.currentEntry = {}; st.currentEntry.codeFromLine = String(value || ''); break;
        default: return; // unhandled key
      }
      saveAggregate(st);
    } catch (_) {}
  }

  function installHooks() {
    if (!_Storage || !orig.setItem || !orig.removeItem) return;
    try {
      if (!_Storage.prototype.__nvHooked) {
        Object.defineProperty(_Storage.prototype, '__nvHooked', { value: true, writable: false });
        const newSet = function(key, val){
          const r = orig.setItem.call(this, key, val);
          try { handleLegacyWrite(key, val, false); } catch (_) {}
          return r;
        };
        const newRemove = function(key){
          const r = orig.removeItem.call(this, key);
          try { handleLegacyWrite(key, '', true); } catch (_) {}
          return r;
        };
        _Storage.prototype.setItem = newSet;
        _Storage.prototype.removeItem = newRemove;
      }
    } catch (_) {}
  }

  S.init = function init() {
    // Load aggregate if exists, else build from legacy
    let st = null;
    try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { st = null; }
    if (!st) st = legacyToState();
    st = migrate(st);
    S.data = st;
    // Persist aggregate and ensure legacy keys reflect it
    saveAggregate(st);
    stateToLegacy(st);
    // Install hooks to keep in sync going forward
    installHooks();
    return st;
  };

  S.get = function get(){ return S.data || null; };
  S.getUI = function getUI(){ return (S.data && S.data.ui) || { isMinimized:false, isPinned:false, windowPosition:null }; };
  S.setUI = function setUI(part){
    const st = S.data || legacyToState();
    st.ui = Object.assign({}, st.ui || {}, part || {});
    S.data = st; saveAggregate(st); stateToLegacy(st);
  };
  S.setFlags = function setFlags(part){
    const st = S.data || legacyToState();
    st.flags = Object.assign({}, st.flags || {}, part || {});
    S.data = st; saveAggregate(st); stateToLegacy(st);
  };
  S.setQueue = function setQueue(products){
    const st = S.data || legacyToState();
    st.queue = { products: Array.isArray(products) ? products.slice() : [] };
    S.data = st; saveAggregate(st); stateToLegacy(st);
  };
  S.setCaptured = function setCaptured(list){
    const st = S.data || legacyToState();
    st.capturedProducts = Array.isArray(list) ? list.slice() : [];
    S.data = st; saveAggregate(st); stateToLegacy(st);
  };
  S.setFailed = function setFailed(text, data){
    const st = S.data || legacyToState();
    st.failed = { text: String(text || ''), data: Array.isArray(data) ? data.slice() : [] };
    S.data = st; saveAggregate(st); stateToLegacy(st);
  };
})();



// ===== src/utils.js =====

(function(){
  const NVNS = (window.NV = window.NV || {});
  NVNS.utils = NVNS.utils || {};
  const U = NVNS.utils;
  const LOGP = NVNS.LOGP || '[NV TM]';

  /**
   * Espera a que exista document.body
   * @param {number} [maxMs]
   * @returns {Promise<void>}
   */
  U.waitForBody = function waitForBody(maxMs = 10000) {
    return new Promise((resolve, reject) => {
      if (document.body) return resolve();
      const t0 = performance.now();
      const iv = setInterval(() => {
        if (document.body) { clearInterval(iv); resolve(); }
        else if (performance.now() - t0 > maxMs) { clearInterval(iv); reject(new Error('body timeout')); }
      }, 50);
    });
  };

  /**
   * Heurística es-CO para strings numéricos/precios
   * @param {unknown} val
   * @returns {number}
   */
  U.parsePrice = function parsePrice(val) {
    if (val == null) return 0;
    let s = String(val).trim();
    if (!s) return 0;
    try { s = s.replace(/\u00A0/g, ' '); } catch(_) {}
    // Detect negative by parentheses or dash
    let negative = false;
    if (/^\(.*\)$/.test(s)) { negative = true; s = s.replace(/^[\(]|[\)]$/g, ''); }
    if (/^-/.test(s)) { negative = true; }

    // Strip currency and words, keep digits, separators and sign
    s = s.replace(/[^0-9.,'\-\s]/g, '');
    // Remove thousand-like spaces and apostrophes
    s = s.replace(/[\s']/g, '');

    if (!s) return 0;

    const hasDot = s.includes('.');
    const hasComma = s.includes(',');
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');

    function toNum(str){
      const n = parseFloat(str);
      return isNaN(n) ? 0 : (negative ? -n : n);
    }

    // Both separators: assume es-CO (dot thousands, comma decimal)
    if (hasDot && hasComma) {
      s = s.replace(/\./g, '').replace(',', '.');
      return toNum(s);
    }

    // Only comma
    if (!hasDot && hasComma) {
      const decLen = s.length - lastComma - 1;
      if (decLen === 3) { // thousands pattern like 12,345
        s = s.replace(/,/g, '');
        return toNum(s);
      } else {
        s = s.replace(',', '.');
        return toNum(s);
      }
    }

    // Only dot
    if (hasDot && !hasComma) {
      const decLen = s.length - lastDot - 1;
      if (decLen === 3) { // thousands pattern like 12.345
        s = s.replace(/\./g, '');
        return toNum(s);
      } else {
        return toNum(s);
      }
    }

    // No separators
    return toNum(s);
  };

  /**
   * Formatea a COP sin decimales
   * @param {number|string} n
   * @returns {string}
   */
  U.toMoney = function toMoney(n) {
    const v = Math.round(Number(n) || 0);
    try {
      return v.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } catch (_) {
      return '$' + v.toLocaleString('es-CO');
    }
  };

  /**
   * Parseo de línea "codigo-cantidad persona"
   * @param {string} line
   * @returns {{ code: string, quantity: string, person: string }}
   */
  U.parseEntryLine = function parseEntryLine(line){
    const s = String(line||'').trim();
    if (!s) return { code:'', quantity:'1', person:'' };

    let m = s.match(/^(\S+?)\s*-\s*(\d+)(?:\s+(.*))?$/);
    if (m) return { code:m[1].trim(), quantity:(m[2]||'1').trim(), person:(m[3]||'').trim() };

    m = s.match(/^(\S+)(?:\s+(.*))?$/);
    return { code:(m?.[1]||'').trim(), quantity:'1', person:(m?.[2]||'').trim() };
  };

  /**
   * Busca tarjeta padre (grid) para un nodo
   * @param {Element|null} el
   * @returns {Element|null}
   */
  U.findProductCard = function findProductCard(el) {
    if (!el) return null;
    return el.closest('.cardproduct, [class*="cardproduct"]') || el.closest('.col-xs-12');
  };

  /**
   * Encuentra URL de imagen (grid o detalle)
   * @param {Element|Document} ctx
   * @returns {string}
   */
  U.findProductImageUrl = function findProductImageUrl(ctx) {
    let card = U.findProductCard(ctx);
    if (card) {
      let img = card.querySelector('img[data-image]') ||
                card.querySelector('.cardproduct__img img') ||
                card.querySelector('img');
      if (img) return img.getAttribute('data-image') || img.getAttribute('src') || '';
    }
    let detailImg = document.querySelector('.product-main img[data-image], .product-main img, .js-image-tdp-notFound, .product-details img');
    if (detailImg) return detailImg.getAttribute('data-image') || detailImg.getAttribute('src') || '';
    let anyImg = document.querySelector('img[src*="/images/"], img[src*="cdn"], img[src*=".webp"], img[src*=".jpg"], img[src*=".png"]');
    return anyImg ? (anyImg.getAttribute('data-image') || anyImg.src || '') : '';
  };

  /**
   * Dibuja texto y retorna ancho
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} txt
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  U.drawLine = function drawLine(ctx, txt, x, y){ ctx.fillText(txt, x, y); return ctx.measureText(txt).width; };
  /**
   * Pinta texto con salto de línea automático
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {number} maxWidth
   * @param {number} lineHeight
   * @returns {{ endY: number, maxWidthUsed: number }}
   */
  U.drawWrap = function drawWrap(ctx, text, x, y, maxWidth, lineHeight){
    const words = String(text).split(/\s+/); let line = '', yy = y, maxUsed = 0;
    for (let n=0; n<words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxWidth && n>0) {
        ctx.fillText(line, x, yy);
        maxUsed = Math.max(maxUsed, ctx.measureText(line).width);
        line = words[n] + ' ';
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, yy);
    maxUsed = Math.max(maxUsed, ctx.measureText(line).width);
    return { endY: yy, maxWidthUsed: maxUsed };
  };

  // Reporte de errores unificado
  U.reportError = function reportError(message, { ctx = null, ui = true, level = 'error', timeoutMs = 5000 } = {}){
    try {
      const prefix = (LOGP || '[NV]') + ' ';
      const payload = { message: String(message || ''), ctx };
      if (level === 'warn') console.warn(prefix, payload);
      else console.error(prefix, payload);
    } catch(_) {}
    if (!ui) return;
    try {
      let host = document.getElementById('nv_toast_container');
      if (!host) {
        host = document.createElement('div');
        host.id = 'nv_toast_container';
        host.style.position = 'fixed';
        host.style.top = '10px';
        host.style.right = '10px';
        host.style.zIndex = '2147483647';
        (document.body || document.documentElement).appendChild(host);
      }
      const toast = document.createElement('div');
      toast.className = 'nv-toast';
      toast.textContent = String(message || 'Error');
      host.appendChild(toast);
      setTimeout(() => { try { toast.remove(); } catch(_) {} }, Math.max(1000, timeoutMs|0));
    } catch(_) {}
  };

  // Logging con niveles
  const LVL = { error: 0, warn: 1, info: 2, debug: 3 };
  function getLevel(){
    const v = (localStorage.getItem('nv_log_level') || 'info').toLowerCase();
    return LVL[v] != null ? v : 'info';
  }
  function setLevel(l){ try { localStorage.setItem('nv_log_level', String(l||'info')); } catch(_) {} }
  U.getLogLevel = getLevel;
  U.setLogLevel = setLevel;
  U.log = function log(level, ...args){
    const cur = LVL[getLevel()];
    const want = LVL[(level||'info').toLowerCase()] ?? LVL.info;
    if (want > cur) return;
    const prefix = (LOGP || '[NV]');
    try {
      if (want <= LVL.error) console.error(prefix, ...args);
      else if (want <= LVL.warn) console.warn(prefix, ...args);
      else if (want <= LVL.info) console.info(prefix, ...args);
      else console.debug(prefix, ...args);
    } catch(_) {}
  };
})();


// ===== src/renderers.js =====

(function(){
  const NVNS = (window.NV = window.NV || {});
  NVNS.ui = NVNS.ui || {};
  const UI = NVNS.ui;
  const U = NVNS.utils || {};

  UI.renderSummary = function renderSummary(totalQty, totalValueNumber){
    const summary = document.createElement('div');
    summary.className = 'summary';
    const money = U && U.toMoney ? U.toMoney(totalValueNumber || 0) : String(totalValueNumber || 0);

    const spanQty = document.createElement('span');
    const strongQty = document.createElement('strong');
    strongQty.textContent = 'Total unidades:';
    spanQty.appendChild(strongQty);
    spanQty.appendChild(document.createTextNode(' ' + String(totalQty)));

    const spacer = document.createTextNode('   ');

    const spanVal = document.createElement('span');
    const strongVal = document.createElement('strong');
    strongVal.textContent = 'Total estimado:';
    spanVal.appendChild(strongVal);
    spanVal.appendChild(document.createTextNode(' ' + money));

    summary.appendChild(spanQty);
    summary.appendChild(spacer);
    summary.appendChild(spanVal);
    return summary;
  };

  UI.renderProductItem = function renderProductItem(p, index, labelOrOpts){
    const o = (typeof labelOrOpts === 'string') ? { label: labelOrOpts } : (labelOrOpts || {});
    const label = o.label || (o.type === 'failed' ? 'Fallido' : 'Producto');
    const item = document.createElement('div');
    item.className = 'productItem';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = p.image || '';
    img.alt = String(p.name || '');
    img.onerror = function(){ this.style.visibility = 'hidden'; };
    item.appendChild(img);

    const right = document.createElement('div');
    item.appendChild(right);

    const pTitle = document.createElement('p');
    const strongTitle = document.createElement('strong');
    strongTitle.textContent = String(label) + ' ' + String(index) + ':';
    pTitle.appendChild(strongTitle);
    if ((o.type === 'failed') || (/fallido/i.test(String(label)))) {
      const small = document.createElement('small');
      small.style.color = '#c00';
      small.textContent = ' no agregado al carrito';
      pTitle.appendChild(document.createTextNode(' '));
      pTitle.appendChild(small);
    }
    right.appendChild(pTitle);

    const pCode = document.createElement('p');
    const sCode = document.createElement('strong');
    sCode.textContent = 'Codigo:';
    pCode.appendChild(sCode);
    pCode.appendChild(document.createTextNode(' ' + String(p.code || '')));
    if (p.quantity && p.quantity > 1) {
      const sx = document.createElement('strong');
      sx.textContent = ' X' + String(p.quantity);
      pCode.appendChild(document.createTextNode(' '));
      pCode.appendChild(sx);
    }
    right.appendChild(pCode);

    const pName = document.createElement('p');
    const sName = document.createElement('strong');
    sName.textContent = 'Nombre:';
    pName.appendChild(sName);
    pName.appendChild(document.createTextNode(' ' + String(p.name ?? '')));
    right.appendChild(pName);

    const pPerson = document.createElement('p');
    const sPerson = document.createElement('strong');
    sPerson.textContent = 'Persona:';
    pPerson.appendChild(sPerson);
    pPerson.appendChild(document.createTextNode(' ' + String(p.person ?? '')));
    right.appendChild(pPerson);

    const pPrice = document.createElement('p');
    const sPrice = document.createElement('strong');
    sPrice.textContent = 'Precio:';
    pPrice.appendChild(sPrice);
    const priceFmt = (U && U.toMoney && U.parsePrice) ? (p.price ? U.toMoney(U.parsePrice(p.price)) : '') : String(p.price || '');
    const catFmt = (U && U.toMoney && U.parsePrice) ? (p.catalogPrice ? U.toMoney(U.parsePrice(p.catalogPrice)) : '') : String(p.catalogPrice || '');
    pPrice.appendChild(document.createTextNode(' ' + priceFmt));
    if (catFmt) {
      const smallCat = document.createElement('small');
      smallCat.textContent = `(Cat: ${catFmt})`;
      pPrice.appendChild(document.createTextNode(' '));
      pPrice.appendChild(smallCat);
    }
    right.appendChild(pPrice);

    const pCat = document.createElement('p');
    const sCat = document.createElement('strong');
    sCat.textContent = 'Categoria:';
    pCat.appendChild(sCat);
    pCat.appendChild(document.createTextNode(' ' + String(p.category ?? '')));
    pCat.appendChild(document.createTextNode('  '));
    const sOff = document.createElement('strong');
    sOff.textContent = 'Oferta:';
    pCat.appendChild(sOff);
    pCat.appendChild(document.createTextNode(' ' + String(p.offerType ?? '')));
    right.appendChild(pCat);

    return item;
  };
})();




// ===== src/exporters.js =====

(function(){
  const NVNS = (window.NV = window.NV || {});
  NVNS.exporters = NVNS.exporters || {};
  const X = NVNS.exporters;
  const U = NVNS.utils || {};
  const LOGP = NVNS.LOGP || '[NV TM]';

  /**
   * Convierte imagen a JPG HD manteniendo proporción (contain)
   * @param {string} src
   * @param {number} [cssW]
   * @param {number} [cssH]
   * @param {{scale?: number, quality?: number, bg?: string}} [opts]
   * @returns {Promise<string>} dataURL
   */
  X.toJPEGDataURL = async function toJPEGDataURL(src, cssW = 88, cssH = 88, { scale = 3, quality = 0.95, bg = '#ffffff' } = {}) {
    function load(url) {
      return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
      });
    }
    let img;
    try {
      img = await load(src);
    } catch {
      try {
        const r = await fetch(src, { mode: 'cors' });
        const b = await r.blob();
        const u = URL.createObjectURL(b);
        img = await load(u);
        URL.revokeObjectURL(u);
      } catch {
        return src;
      }
    }
    const outW = Math.max(1, Math.round(cssW * scale));
    const outH = Math.max(1, Math.round(cssH * scale));
    const c = document.createElement('canvas');
    c.width = outW; c.height = outH;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, outW, outH);
    const r = Math.min(outW / img.naturalWidth, outH / img.naturalHeight);
    const dw = Math.round(img.naturalWidth * r);
    const dh = Math.round(img.naturalHeight * r);
    const dx = Math.round((outW - dw) / 2);
    const dy = Math.round((outH - dh) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
    return c.toDataURL('image/jpeg', quality);
  };

  // Texto helpers (alias a utils)
  const drawLine = (...args) => U.drawLine(...args);
  const drawWrap = (...args) => U.drawWrap(...args);

  /**
   * Render de tarjeta a PNG con recorte automático
   * @param {Product} p
   * @param {number} [i]
   * @returns {Promise<string>} dataURL PNG
   */
  X.renderCardToPNG = async function renderCardToPNG(p, i = 1) {
    const PAD = 18, IMG = 120;
    const W = 1100, H = 520;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,W,H);

    const imgX = PAD, imgY = PAD;
    let imgRight = imgX + IMG, imgBottom = imgY + IMG;

    let drewImage = false;
    if (p.image) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.src = p.image;
        await new Promise((res,rej)=>{ img.onload=res; img.onerror=rej; });
        ctx.drawImage(img, imgX, imgY, IMG, IMG);
        drewImage = true;
      } catch (_) {
        try {
          const r = await fetch(p.image, { mode: 'cors' });
          const b = await r.blob();
          const obj = URL.createObjectURL(b);
          const img2 = new Image(); img2.src = obj;
          await new Promise((res,rej)=>{ img2.onload=res; img2.onerror=rej; });
          ctx.drawImage(img2, imgX, imgY, IMG, IMG);
          URL.revokeObjectURL(obj);
          drewImage = true;
        } catch (e) { drewImage = false; }
      }
    }
    if (!drewImage) {
      ctx.fillStyle = '#f3f3f3'; ctx.fillRect(imgX, imgY, IMG, IMG);
      ctx.strokeStyle = '#d0d0d0'; ctx.strokeRect(imgX+0.5, imgY+0.5, IMG-1, IMG-1);
      ctx.fillStyle = '#999'; ctx.font = '14px Arial'; ctx.fillText('sin imagen', imgX+40, imgY + IMG/2+5);
    }

    const X0 = imgX + IMG + 20;
    let tRight = X0;
    let y = PAD + 10;

    ctx.fillStyle = '#111'; ctx.font = 'bold 16px Arial';
    tRight = Math.max(tRight, X0 + drawLine(ctx, `Producto ${i}`, X0, y));

    y += 28;
    ctx.font = 'bold 18px Arial';
    const qtyTxt = p.quantity>1?`  X${p.quantity}`:'';
    tRight = Math.max(tRight, X0 + drawLine(ctx, `Código: ${p.code||''}${qtyTxt}`, X0, y));

    y += 28;
    ctx.font = '16px Arial';
    const wrap1 = drawWrap(ctx, `Nombre: ${p.name||''}`, X0, y, W - X0 - PAD, 20);
    y = wrap1.endY; tRight = Math.max(tRight, X0 + wrap1.maxWidthUsed);

    y += 28;
    ctx.font = '16px Arial';
    const wrapP = drawWrap(ctx, `Persona: ${p.person||''}`, X0, y, W - X0 - PAD, 20);
    y = wrapP.endY; tRight = Math.max(tRight, X0 + wrapP.maxWidthUsed);

    y += 28;
    const priceN = U.parsePrice(p.price), catN = U.parsePrice(p.catalogPrice);
    ctx.font = '16px Arial';
    const priceLine = `Precio: ${priceN?U.toMoney(priceN):''}${catN?`  (Cat: ${U.toMoney(catN)})`:''}`;
    tRight = Math.max(tRight, X0 + drawLine(ctx, priceLine, X0, y));

    const textBottom = y + 1;
    const contentLeft   = Math.min(imgX, X0);
    const contentTop    = PAD;
    const contentRight  = Math.max(imgRight, tRight);
    const contentBottom = Math.max(imgBottom, textBottom);

    const OUTPAD = 14;
    const sx = Math.max(0, contentLeft - OUTPAD);
    const sy = Math.max(0, contentTop - OUTPAD);
    const sw = Math.min(W - sx, (contentRight - contentLeft) + OUTPAD*2);
    const sh = Math.min(H - sy, (contentBottom - contentTop) + OUTPAD*2);

    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(sw));
    out.height = Math.max(1, Math.round(sh));
    const octx = out.getContext('2d');
    octx.fillStyle = '#ffffff'; octx.fillRect(0,0,out.width,out.height);
    octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height);
    octx.strokeStyle = '#e6e6e6'; octx.strokeRect(0.5, 0.5, out.width-1, out.height-1);
    return out.toDataURL('image/png');
  };

  /**
   * Vista para Google Docs (HTML con tarjetas compactas)
   * @param {Map<string, Product>} productMap
   * @returns {Promise<void>}
   */
  X.openPrintableDoc = async function openPrintableDoc(productMap) {
    let totalQty = 0; let totalValue = 0;
    productMap.forEach(p => {
      const q = p.quantity || 1;
      const priceN = U.parsePrice(p.price);
      totalQty += q; totalValue += (priceN || 0) * q;
    });

    const norm = s => String(s||'').trim().replace(/\s+/g,' ');
    let allCaptured = [];
    try { allCaptured = JSON.parse(localStorage.getItem('capturedProducts')) || []; } catch (_) {}

    const groups = new Map();
    allCaptured.forEach(p => {
      const pname = norm(p.person);
      const key = pname || '(Sin nombre)';
      if (!groups.has(key)) groups.set(key, { name: pname || '(Sin nombre)', items: new Map(), units: 0, value: 0 });
      const g = groups.get(key);
      const code = p.code || 'N/A';
      const q = Number(p.quantity || 1);
      const v = (U.parsePrice(p.price) || 0) * q;
      const prev = g.items.get(code) || { ...p, quantity: 0, person: pname };
      prev.quantity += q;
      if (!prev.name) prev.name = p.name;
      if (!prev.price) prev.price = p.price;
      if (!prev.catalogPrice) prev.catalogPrice = p.catalogPrice;
      if (!prev.image) prev.image = p.image;
      prev.person = pname;
      g.items.set(code, prev);
      g.units += q; g.value += v;
    });

    const perPersonList = Array.from(groups.values())
      .filter(g => g.name && g.name !== '(Sin nombre)')
      .sort((a,b) => (a.name||'').localeCompare(b.name||''))
      .map(g => ({ name: g.name, units: g.units, value: g.value }));

    const buildCardHTML = async (p, idx) => {
      const price = p.price ? U.toMoney(U.parsePrice(p.price)) : '';
      const cat   = p.catalogPrice ? U.toMoney(U.parsePrice(p.catalogPrice)) : '';
      const jpgSrc = p.image ? await X.toJPEGDataURL(p.image, 88, 88, { scale: 1.8, quality: 0.92 }) : '';
      return `
<div class="card" style="display:grid;grid-template-columns:88px 1fr;gap:8px;padding:8px;border:1px solid #e5e5e5;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.06);background:#fff;">
  <img src="${jpgSrc}" width="88" height="88" onerror="this.style.visibility='hidden'"
       style="width:88px;height:88px;object-fit:cover;border-radius:8px;border:1px solid #ddd;background:#fff;">
  <div>
    <p style="margin:0;line-height:1.15;font-size:13px;">
      <strong>Producto ${idx}</strong> – <strong>Código:</strong> ${p.code || ''} ${p.quantity>1?`<strong>X${p.quantity}</strong>`:''}
      <br><strong>Nombre:</strong> ${(p.name||'')}
      <br><strong>Precio:</strong> ${price} ${cat?`<small>(Cat: ${cat})</small>`:''}
    </p>
  </div>
</div>`;
    };

    let bodyGridHTML = '';
    if (groups.size > 0) {
      const sections = [];
      const orderedGroups = Array.from(groups.values()).sort((a,b) => (a.name||'').localeCompare(b.name||''));
      for (const g of orderedGroups) {
        let idx = 1; const cards = [];
        for (const [, p] of g.items) cards.push(await buildCardHTML(p, idx++));
        sections.push(`
<section class="person-section" style="margin:12px 0 8px 0;">
  <p class="person-h" style="margin:0 0 6px 0;line-height:1.15;font-size:14px;font-weight:700;">
    ${g.name} – ${g.units} und – ${U.toMoney(g.value)}
  </p>
  <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">
    ${cards.join('\n')}
  </div>
</section>`);
      }
      bodyGridHTML = sections.join('\n');
    } else {
      let idx = 1; const cards = [];
      for (const [, p] of productMap) cards.push(await buildCardHTML({ ...p, person: '' }, idx++));
      bodyGridHTML = `<div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">${cards.join('\n')}</div>`;
    }

    const perPersonHTML = perPersonList.length ? `
    <div class="perperson" style="margin:6px 0 8px 0;font-size:13px;">
      <p style="margin:0;line-height:1.15;"><strong>Totales por persona:</strong></p>
      ${perPersonList.map(x => `
        <p style="margin:0;line-height:1.15;">• <span class="pp-name">${x.name}</span> – ${x.units} und – ${U.toMoney(x.value)}</p>
      `).join('')}
    </div>` : '';

    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Productos capturados</title>
<style>
html,body,div,section,p,ul,li{margin:0;padding:0}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;margin:16px;background:#fafafa;color:#222;line-height:1.15}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;flex-wrap:wrap}
.header .btn{padding:6px 10px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer}
.summary{margin:4px 0 8px 0;font-size:13px}
@media print {.header{display:none}}
</style></head>
<body>
  <div class="header">
    <div><strong>Productos capturados</strong></div>
    <div>
      <button class="btn" id="copy">Copiar todo</button>
      <button class="btn" onclick="window.print()">Imprimir / PDF</button>
    </div>
  </div>
  <div id="content">
    <div class="summary">
      <p style="margin:0;line-height:1.15;">
        <strong>Total unidades:</strong> ${totalQty}
        &nbsp;&nbsp;
        <strong>Total estimado:</strong> ${U.toMoney(totalValue)}
      </p>
    </div>
    ${perPersonHTML}
    ${bodyGridHTML}
  </div>
  <script>
    (function(){
      const btn = document.getElementById('copy');
      btn.addEventListener('click', () => {
        try{
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(document.getElementById('content'));
          sel.removeAllRanges(); sel.addRange(range);
          const ok = document.execCommand('copy');
          if (!ok) throw new Error('copy falló');
          alert('Copiado. Ahora pégalo en Google Docs (Ctrl+V).');
        } catch(e) {
          alert('No se pudo copiar automáticamente. Selecciona el contenido y copia (Ctrl+C).');
        }
      });
    })();
  </script>
</body></html>`;

    const blob = new Blob([html], {type:'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /**
   * Vista para Google Docs (PNG incrustados)
   * @param {Map<string, Product>} productMap
   * @returns {Promise<void>}
   */
  X.openDocsPNG = async function openDocsPNG(productMap) {
    const imgs = [];
    let idx = 1;
    for (const [, p] of productMap) {
      try {
        const dataURL = await X.renderCardToPNG(p, idx++);
        imgs.push(`<img src="${dataURL}" style="max-width:100%;display:block;margin:10px 0;border:1px solid #eee;border-radius:8px">`);
      } catch (e) {
        console.error(LOGP, 'PNG embed fail', p.code, e);
        imgs.push(`<div style="padding:12px;border:1px solid #eee;border-radius:8px;background:#fafafa">Sin imagen (no compatible)</div>`);
      }
    }

    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Docs – PNG incrustado (recortado)</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:24px;background:#fff;color:#222}
  .header{display:flex;gap:8px;align-items:center;margin-bottom:12px}
  .btn{padding:8px 12px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer}
  @media print {.header{display:none}}
</style></head>
<body>
  <div class="header">
    <button class="btn" id="copy">Copiar todo</button>
    <button class="btn" onclick="window.print()">Imprimir / PDF</button>
  </div>
  <div id="content">
    ${imgs.join('\n')}
  </div>
  <script>
    (function(){
      const btn = document.getElementById('copy');
      btn.addEventListener('click', async () => {
        try{
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(document.getElementById('content'));
          sel.removeAllRanges(); sel.addRange(range);
          const ok = document.execCommand('copy');
          if (!ok) throw new Error('execCommand(copy) falló');
          alert('Copiado. Ahora pégalo en Google Docs (Ctrl+V).');
        } catch(e) {
          alert('No se pudo copiar automáticamente. Selecciona todo (Ctrl+A) y luego copia (Ctrl+C).');
        }
      });
    })();
  </script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // Cache en memoria para conversiones JPEG repetidas
  try {
    const __orig = X.toJPEGDataURL;
    const __cache = (X._jpegCache = X._jpegCache || new Map());
    X.toJPEGDataURL = async function(src, cssW = 88, cssH = 88, opts = {}){
      const scale = opts && typeof opts.scale === 'number' ? opts.scale : 3;
      const quality = opts && typeof opts.quality === 'number' ? opts.quality : 0.95;
      const bg = (opts && typeof opts.bg === 'string') ? opts.bg : '#ffffff';
      const key = `${src}|${cssW}|${cssH}|${scale}|${quality}|${bg}`;
      if (__cache.has(key)) return await __cache.get(key);
      const p = __orig.call(X, src, cssW, cssH, { scale, quality, bg });
      __cache.set(key, p);
      return await p;
    };
  } catch (_) {}
})();


// ===== automation_novaventa =====

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

  // ========= Utilidades =========
  function waitForBody(maxMs = 10000) {
    return new Promise((resolve, reject) => {
      if (document.body) return resolve();
      const t0 = performance.now();
      const iv = setInterval(() => {
        if (document.body) { clearInterval(iv); resolve(); }
        else if (performance.now() - t0 > maxMs) { clearInterval(iv); reject(new Error('body timeout')); }
      }, 50);
    });
  }

  // Heurística robusta es-CO para strings numéricos/precios
  function parsePrice(val) {
    if (val == null) return 0;
    let s = String(val).trim();
    s = s.replace(/[^\d.,-]/g, '');

    if (s.includes('.') && s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }
    if (s.includes('.') && !s.includes(',')) {
      const parts = s.split('.');
      if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
        if (parts[1].length === 3) {
          s = parts.join('');
          const n = parseFloat(s);
          return isNaN(n) ? 0 : n;
        }
      }
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }
    if (!s.includes('.') && s.includes(',')) {
      const parts = s.split(',');
      if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
        if (parts[1].length === 3) {
          s = parts.join('');
          const n = parseFloat(s);
          return isNaN(n) ? 0 : n;
        }
      }
      s = s.replace(',', '.');
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function toMoney(n) {
    const v = Math.round(Number(n) || 0);
    try {
      return v.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } catch (_) {
      return '$' + v.toLocaleString('es-CO');
    }
  }
    // Parseo de línea "codigo-cantidad persona"
    function parseEntryLine(line){
        const s = String(line||'').trim();
        if (!s) return { code:'', quantity:'1', person:'' };

        let m = s.match(/^(\S+?)\s*-\s*(\d+)(?:\s+(.*))?$/);
        if (m) return { code:m[1].trim(), quantity:(m[2]||'1').trim(), person:(m[3]||'').trim() };

        m = s.match(/^(\S+)(?:\s+(.*))?$/);
        return { code:(m?.[1]||'').trim(), quantity:'1', person:(m?.[2]||'').trim() };
    }

  // Busca tarjeta padre (grid) para un nodo
  function findProductCard(el) {
    if (!el) return null;
    return el.closest('.cardproduct, [class*="cardproduct"]') || el.closest('.col-xs-12');
  }

  // Encuentra URL de imagen (grid o detalle)
  function findProductImageUrl(ctx) {
    let card = findProductCard(ctx);
    if (card) {
      let img = card.querySelector('img[data-image]') ||
                card.querySelector('.cardproduct__img img') ||
                card.querySelector('img');
      if (img) return img.getAttribute('data-image') || img.getAttribute('src') || '';
    }
    let detailImg = document.querySelector('.product-main img[data-image], .product-main img, .js-image-tdp-notFound, .product-details img');
    if (detailImg) return detailImg.getAttribute('data-image') || detailImg.getAttribute('src') || '';
    let anyImg = document.querySelector('img[src*="/images/"], img[src*="cdn"], img[src*=".webp"], img[src*=".jpg"], img[src*=".png"]');
    return anyImg ? (anyImg.getAttribute('data-image') || anyImg.src || '') : '';
  }

  // ========= Estado global =========
  let isDragging = false;
  let offsetX, offsetY;
  let isAddingProducts = false;
  let isMinimized = localStorage.getItem('isMinimized') === 'true';
  let isPinned = localStorage.getItem('isPinned') === 'true';
  let isResizing = false;

  // ========= Estilos =========
  function addStyles() {
    const css = `
    #productsInputContainer {
      position: fixed; top: 100px; left: 100px;
      width: 380px; min-width: 300px; min-height: 220px;
      background-color: #f1f1f1; padding: 0;
      box-shadow: 0 0 15px rgba(0,0,0,.3);
      z-index: 2147483647; border-radius: 10px;
      font-family: Arial, sans-serif; overflow: hidden;
      display: flex; flex-direction: column;
    }
    #productsInputContainer .titleBar {
      background-color: #4CAF50; color: #fff; cursor: move; padding: 10px;
      display: flex; justify-content: space-between; align-items: center;
    }
    #productsInputContainer .titleBar .title { font-size: 16px; font-weight: bold; }
    #productsInputContainer .titleBar .buttons { display: flex; gap: 5px; }
    #productsInputContainer .titleBar button { background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; }

    #productsInputContainer .content { display: flex; flex: 1; overflow: hidden; }
    #productsInputContainer .innerContainer { padding: 15px; flex: 1; overflow: auto; }
    #productsInputContainer textarea {
      width: 100%; border: 1px solid #ccc; border-radius: 5px; padding: 8px;
      resize: vertical; font-size: 14px; box-sizing: border-box;
    }
    #productsInputContainer button.actionButton {
      background-color: #4CAF50; color: white; border: none; padding: 10px; margin-top: 10px;
      width: 100%; border-radius: 5px; cursor: pointer; font-size: 14px;
    }
    #productsInputContainer button.actionButton:hover { background-color: #45a049; }

    #productsInputContainer .productsContainer { margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px; }
    #productsInputContainer .productsContainer h3 { margin: 0 0 10px 0; font-size: 16px; color: #333; }
    #productsInputContainer .productsContainer .productItem {
      margin-bottom: 10px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;
      display: grid; grid-template-columns: 56px 1fr; gap: 8px; align-items: start;
    }
    #productsInputContainer .thumb { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; background: #fff; border: 1px solid #ddd; }
    #productsInputContainer .productsContainer .productItem p { margin: 2px 0; font-size: 13px; color: #555; }
    #productsInputContainer .summary { margin: 8px 0; font-size: 13px; }

    #minimizedBar {
      position: fixed; bottom: 10px; left: 10px; background-color: #4CAF50; color: #fff; padding: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.2); z-index: 2147483647; cursor: pointer; border-radius: 5px; font-family: Arial, sans-serif;
    }

    #capturedProductsPanel { width: 320px; min-width: 220px; background-color: #fff; border-left: 1px solid #ccc; padding: 15px; display: flex; flex-direction: column; }
    #capturedProductsContainer { flex: 1; overflow-y: auto; }

    #resizeHandle { width: 15px; height: 15px; background: transparent; position: absolute; bottom: 0; right: 0; cursor: se-resize; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // ========= Drag/Resize =========
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
      div.style.left = (e.clientX - offsetX) + 'px';
      div.style.top = (e.clientY - offsetY) + 'px';
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
    const pos = {
      left: div.style.left,
      top: div.style.top,
      width: div.style.width,
      height: div.style.height
    };
    localStorage.setItem('windowPosition', JSON.stringify(pos));
  }
  function onResizeMouseDown(e) {
    isResizing = true; e.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // ========= UI principal =========
  function minimizeWindow() {
    const div = document.getElementById('productsInputContainer');
    const minimizedBar = document.getElementById('minimizedBar');
    if (!div || !minimizedBar) return;
    div.style.display = 'none';
    minimizedBar.style.display = 'block';
    localStorage.setItem('isMinimized', 'true');
  }
  function restoreWindow() {
    const div = document.getElementById('productsInputContainer');
    const minimizedBar = document.getElementById('minimizedBar');
    if (!div || !minimizedBar) {
      // Si el contenedor fue removido por la SPA, re-crear UI en modo no minimizado
      isMinimized = false;
      try { localStorage.setItem('isMinimized', 'false'); } catch(_) {}
      try { addUI(); } catch(_) {}
      return;
    }
    isMinimized = false;
    div.style.display = 'flex';
    minimizedBar.style.display = 'none';
    try { localStorage.setItem('isMinimized', 'false'); } catch(_) {}
    try {
      if (window.NV && NV.state && typeof NV.state.setUI === 'function') {
        NV.state.setUI({ isMinimized: false });
      }
    } catch(_) {}
  }
  function togglePin() {
    const div = document.getElementById('productsInputContainer');
    const pinButton = document.getElementById('pinButton');
    if (!div || !pinButton) return;
    if (isPinned) {
      div.style.position = 'fixed';
      pinButton.textContent = 'Fijar';
      localStorage.setItem('isPinned', 'false');
    } else {
      div.style.position = 'absolute';
      pinButton.textContent = 'Desfijar';
      localStorage.setItem('isPinned', 'true');
    }
    isPinned = !isPinned;
  }

  // Cooldown helpers
  function setCooldown(message, ms = 1500, onSkip = null) {
    const bar = document.getElementById('nvCooldown');
    if (!bar) return;
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    const span = document.createElement('span');
    span.textContent = String(message || '');
    bar.appendChild(span);
    if (onSkip) {
      const sp = document.createElement('span'); sp.textContent = '  ';
      bar.appendChild(sp);
      const btn = document.createElement('button');
      btn.textContent = 'Saltar y continuar';
      btn.style.marginLeft = '6px';
      btn.addEventListener('click', onSkip);
      bar.appendChild(btn);
    }
    const timerSpan = document.createElement('span');
    timerSpan.style.marginLeft = '6px';
    bar.appendChild(timerSpan);
    bar.style.display = 'block';
    const t0 = Date.now();
    if (window.__nvCooldownTimer) { clearInterval(window.__nvCooldownTimer); }
    window.__nvCooldownTimer = setInterval(() => {
      const left = Math.max(0, ms - (Date.now() - t0));
      timerSpan.textContent = ` (reintento en ${Math.ceil(left/1000)}s)`;
      if (left <= 0) { clearInterval(window.__nvCooldownTimer); }
    }, 200);
  }
  function hideCooldown(){ const bar = document.getElementById('nvCooldown'); if (bar) { bar.style.display = 'none'; while (bar.firstChild) bar.removeChild(bar.firstChild); } }

  function ensureMinimizedBar() {
    let minimizedBar = document.getElementById('minimizedBar');
    if (!minimizedBar) {
      minimizedBar = document.createElement('div');
      minimizedBar.id = 'minimizedBar';
      minimizedBar.textContent = 'Abrir panel de productos';
      minimizedBar.addEventListener('click', restoreWindow);
      Object.assign(minimizedBar.style, {
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: '#4CAF50',
        color: '#fff',
        padding: '10px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        zIndex: '2147483647',
        cursor: 'pointer',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        display: isMinimized ? 'block' : 'none'
      });
      (document.body || document.documentElement).prepend(minimizedBar);
    } else {
      minimizedBar.style.display = isMinimized ? 'block' : 'none';
    }
  }

  function addUI() {
    try { window.__nvUiObserverPaused = true; } catch(_) {}
    if (document.getElementById('productsInputContainer')) { ensureMinimizedBar(); setTimeout(() => { try { window.__nvUiObserverPaused = false; } catch(_) {} }, 0); return; }

    addStyles();
    ensureMinimizedBar();

    // Ventana principal
    const div = document.createElement('div');
    div.id = 'productsInputContainer';
    div.style.display = isMinimized ? 'none' : 'flex';
    div.style.position = isPinned ? 'absolute' : 'fixed';
    div.style.top = '100px';
    div.style.left = '100px';
    div.style.width = '380px';
    div.style.minWidth = '300px';
    div.style.minHeight = '220px';
    div.style.backgroundColor = '#f1f1f1';
    div.style.boxShadow = '0 0 15px rgba(0,0,0,.3)';
    div.style.zIndex = '2147483647';
    div.style.borderRadius = '10px';
    div.style.overflow = 'hidden';
    div.style.flexDirection = 'column';

    let savedPosition = null;
    try { savedPosition = JSON.parse(localStorage.getItem('windowPosition')); } catch (e) { }
    if (savedPosition) {
      if (savedPosition.left) div.style.left = savedPosition.left;
      if (savedPosition.top) div.style.top = savedPosition.top;
      if (savedPosition.width) div.style.width = savedPosition.width;
      if (savedPosition.height) div.style.height = savedPosition.height;
    }

    const productList = localStorage.getItem('products') || '';
    const failedProductsList = localStorage.getItem('failedProducts') || '';

    const titleBar = document.createElement('div');
    titleBar.className = 'titleBar';

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = 'Automatizacion de Pedidos';
    titleBar.appendChild(title);

    const titleButtons = document.createElement('div');
    titleButtons.className = 'buttons';

    const pinButton = document.createElement('button');
    pinButton.id = 'pinButton';
    pinButton.textContent = isPinned ? 'Desfijar' : 'Fijar';
    pinButton.addEventListener('click', togglePin);
    titleButtons.appendChild(pinButton);

    const minimizeButton = document.createElement('button');
    minimizeButton.textContent = 'Minimizar';
    minimizeButton.addEventListener('click', minimizeWindow);
    titleButtons.appendChild(minimizeButton);

    // Add logging toggle button
    try {
      const logButton = document.createElement('button');
      logButton.id = 'nvLogButton';
      const refresh = () => {
        try {
          const lvl = (window.NV && NV.utils && NV.utils.getLogLevel) ? NV.utils.getLogLevel() : (localStorage.getItem('nv_log_level')||'info');
          logButton.textContent = (String(lvl).toLowerCase()==='debug') ? 'Depurar' : 'Registro';
        } catch(_) { logButton.textContent = 'Registro'; }
      };
      refresh();
      logButton.addEventListener('click', () => {
        try {
          const cur = (window.NV && NV.utils && NV.utils.getLogLevel) ? NV.utils.getLogLevel() : (localStorage.getItem('nv_log_level')||'info');
          const next = (String(cur).toLowerCase()==='debug') ? 'info' : 'debug';
          if (window.NV && NV.utils && NV.utils.setLogLevel) NV.utils.setLogLevel(next); else localStorage.setItem('nv_log_level', next);
        } catch(_) {}
        refresh();
      });
      titleButtons.appendChild(logButton);
    } catch(_) {}

    titleBar.appendChild(titleButtons);
    titleBar.addEventListener('mousedown', onMouseDown);
    div.appendChild(titleBar);

    const contentContainer = document.createElement('div');
    contentContainer.className = 'content';

    const innerContainer = document.createElement('div');
    innerContainer.className = 'innerContainer';

    const textareaLabel = document.createElement('label');
    textareaLabel.textContent = 'Lista de productos (código[-cantidad] persona):';
    textareaLabel.textContent = 'Lista de productos (codigo[-cantidad] persona):';

    const textarea = document.createElement('textarea');
    textarea.id = 'productsInput';
    textarea.rows = 6;
    textarea.value = productList;
    innerContainer.appendChild(textarea);

    const btn = document.createElement('button');
    btn.id = 'startAdding';
    btn.className = 'actionButton';
    btn.textContent = 'Agregar productos';
    innerContainer.appendChild(btn);

    const clearFailedBtn = document.createElement('button');
    clearFailedBtn.id = 'clearFailedProducts';


    // Cooldown/status barra
    const cooldownBar = document.createElement('div');
    cooldownBar.id = 'nvCooldown';
    cooldownBar.style.display = 'none';
    innerContainer.appendChild(cooldownBar);

    const failedProductsDiv = document.createElement('div');
    failedProductsDiv.id = 'failedProductsContainer';
    failedProductsDiv.className = 'productsContainer';
    {
      const h3 = document.createElement('h3');
      h3.textContent = 'Productos fallidos:';
      failedProductsDiv.appendChild(h3);
      const details = document.createElement('div');
      details.id = 'failedProductsDetails';
      failedProductsDiv.appendChild(details);
    }
    innerContainer.appendChild(failedProductsDiv);

    // Render inicial de detalles de fallidos
    showFailedProductsDetails();

    // Render inicial de detalles de fallidos
    showFailedProductsDetails();

    contentContainer.appendChild(innerContainer);

    const capturedProductsPanel = document.createElement('div');
    capturedProductsPanel.id = 'capturedProductsPanel';

    const clearCapturedBtn = document.createElement('button');
    clearCapturedBtn.id = 'clearCapturedProducts';
    clearCapturedBtn.className = 'actionButton';
    clearCapturedBtn.textContent = 'Limpiar productos capturados';
    capturedProductsPanel.appendChild(clearCapturedBtn);

    const capturedProductsDiv = document.createElement('div');
    capturedProductsDiv.id = 'capturedProductsContainer';
    capturedProductsDiv.className = 'productsContainer';
    capturedProductsDiv.innerHTML = '<p>No hay productos capturados.</p>';
    capturedProductsPanel.appendChild(capturedProductsDiv);

    contentContainer.appendChild(capturedProductsPanel);
    div.appendChild(contentContainer);

    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'resizeHandle';
    resizeHandle.addEventListener('mousedown', onResizeMouseDown);
    div.appendChild(resizeHandle);

    (document.body || document.documentElement).prepend(div);
    console.log(LOGP, 'UI insertada');

    // Eventos
    btn.addEventListener('click', function () {
      isAddingProducts = true;
      localStorage.setItem('isAddingProducts', 'true');
      const products = textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
      localStorage.setItem('products', products.join('\n'));
      processNextProduct();
    });

    clearFailedBtn.addEventListener('click', function () {
      localStorage.removeItem('failedProducts');
      localStorage.removeItem('failedProductsData');
      const pre = '<h3>Productos fallidos:</h3><div id="failedProductsDetails"></div>';
      failedProductsDiv.innerHTML = pre;
      showFailedProductsDetails();
    });

    clearCapturedBtn.addEventListener('click', function () {
      localStorage.removeItem('capturedProducts');
      showCapturedProducts();
    });

    showCapturedProducts();
    // Reanudar observer tras construir UI
    setTimeout(() => { try { window.__nvUiObserverPaused = false; } catch(_) {} }, 0);
  }

  // ========= Lógica de Navegación =========
    function processNextProduct() {
        const products = (localStorage.getItem('products') || '').split('\n').map(s => s.trim()).filter(Boolean);
        if (products.length === 0) { handleError('No hay productos para procesar.'); return; }

        const { code, quantity, person } = parseEntryLine(products[0]);
        if (!code) { handleError('Código de producto inválido.'); return; }

        // guarda la persona (y qty) del renglón actual para que captureProductData la use
        localStorage.setItem('currentPerson', person || '');
        localStorage.setItem('currentQtyFromLine', String(quantity || '1'));
        localStorage.setItem('currentCodeFromLine', String(code || ''));

        console.log(LOGP, `Procesando producto código ${code} cantidad ${quantity} persona "${person}"`);
        window.location.href =
            `https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/search/?text=${encodeURIComponent(code)}`;
    }

    // ========= Capturas =========
    function captureProductData(quantity = 1) {
        const productElement = document.querySelector('.js-nautilus-AddtoCart');
        if (!productElement) return;

        // âž• Persona y cantidad previstas de la línea
        const personFromLine = localStorage.getItem('currentPerson') || '';
        const qtyFromLineRaw = localStorage.getItem('currentQtyFromLine');
        let qty = Math.max(1, parseInt(qtyFromLineRaw ?? String(quantity), 10) || 1);

        const fullProductCode = productElement.getAttribute('data-product-code') || '';
        const productCode = (fullProductCode.split('_')[0]) || fullProductCode;

        // âœ… Considerar el input SOLO si es MAYOR que la de la línea (no reducir)
        const form = productElement.closest('form') ||
              document.querySelector(`form.add_to_cart_form input[name="productCodePost"][value="${fullProductCode}"]`)?.closest('form');
        if (form) {
            const qtyInput = form.querySelector('input.qtyList, input[name="qty"]');
            if (qtyInput) {
                const n = parseInt(qtyInput.value, 10);
                if (!isNaN(n) && n > qty) qty = n; // <-- clave
            }
        }

        const image = findProductImageUrl(productElement);

        const productData = {
            code: productCode,
            name: productElement.getAttribute('data-product-name'),
            price: productElement.getAttribute('data-product-price'),
            catalogPrice: productElement.getAttribute('data-product-catalog-price'),
            brand: productElement.getAttribute('data-product-brand'),
            category: productElement.getAttribute('data-product-category'),
            variant: productElement.getAttribute('data-product-variant'),
            offerType: productElement.getAttribute('data-product-offer-type'),
            quantity: qty,
            image,
            person: personFromLine
        };

        let capturedProducts = [];
        try { capturedProducts = JSON.parse(localStorage.getItem('capturedProducts')) || []; } catch (e) {}
        capturedProducts.push(productData);
        localStorage.setItem('capturedProducts', JSON.stringify(capturedProducts));

        showCapturedProducts();
    }

  function captureVisibleFromGrid() {
    const cards = document.querySelectorAll('.js-nautilus-AddtoCart');
    let capturedProducts = [];
    try { capturedProducts = JSON.parse(localStorage.getItem('capturedProducts')) || []; } catch (e) { }

    let added = 0;
    cards.forEach(card => {
      const fullCode = card.getAttribute('data-product-code') || '';
      const code = (fullCode.split('_')[0]) || fullCode;
      const name = card.getAttribute('data-product-name') || '';
      const price = card.getAttribute('data-product-price') || '';
      const catalogPrice = card.getAttribute('data-product-catalog-price') || '';
      const brand = card.getAttribute('data-product-brand') || '';
      const category = card.getAttribute('data-product-category') || '';
      const variant = card.getAttribute('data-product-variant') || '';
      const offerType = card.getAttribute('data-product-offer-type') || '';

      let qty = 1;
      const form = card.closest('form') || card.parentElement?.querySelector('form') ||
        card.closest('.actions-container-for-SearchResultsGrid')?.querySelector('form.add_to_cart_form');
      if (form) {
        const qtyInput = form.querySelector('input.qtyList, input[name="qty"]');
        if (qtyInput) {
          const n = parseInt(qtyInput.value, 10);
          if (!isNaN(n) && n > 0) qty = n;
        }
      }

      const image = findProductImageUrl(card);

      if (code) {
        capturedProducts.push({ code, name, price, catalogPrice, brand, category, variant, offerType, quantity: qty, image });
        added++;
      }
    });

    if (added > 0) {
      localStorage.setItem('capturedProducts', JSON.stringify(capturedProducts));
      showCapturedProducts();
      console.log(LOGP, `Capturados ${added} productos visibles del grid`);
      alert(`Capturados ${added} productos visibles`);
    } else {
      alert('No se encontraron productos visibles para capturar.');
    }
  }

  // ====== FALLBACKS / FALLIDOS ======
  function findProductElementForCode(targetCode) {
    const nodes = Array.from(document.querySelectorAll('.js-nautilus-AddtoCart, [data-product-code]'));
    if (!nodes.length) return null;
    const norm = s => String(s||'').toLowerCase();
    const t = norm(targetCode||'');
    // 1) Match exacto o con sufijo _variant
    let el = nodes.find(n => {
      const v = norm(n.getAttribute('data-product-code') || '');
      return v === t || v === (t + '_' ) || v.startsWith(t + '_');
    });
    if (el) return el;
    // 2) Inclusión
    el = nodes.find(n => norm(n.getAttribute('data-product-code')||'').includes(t));
    return el || nodes[0];
  }

  function safeInnerText(sel) {
    const el = document.querySelector(sel);
    return el ? (el.textContent || '').trim() : '';
  }

  function readQtyFromFormNear(el, defQty) {
    const form = el?.closest('form') || el?.parentElement?.querySelector('form') ||
                 document.querySelector('form.add_to_cart_form');
    let qty = Math.max(1, parseInt(defQty, 10) || 1);
    if (form) {
      const qtyInput = form.querySelector('input.qtyList, input[name="qty"]');
      if (qtyInput) {
        const n = parseInt(qtyInput.value, 10);
        if (!isNaN(n) && n > qty) qty = n;
      }
    }
    return qty;
  }

  function captureFailedProductData() {
    try {
      const personFromLine = localStorage.getItem('currentPerson') || '';
      const qtyFromLineRaw = localStorage.getItem('currentQtyFromLine') || '1';
      const codeFromLine = localStorage.getItem('currentCodeFromLine') || '';

      // Localizar el nodo "mejor candidato"
      const el = findProductElementForCode(codeFromLine);

      // Datos base por si no encontramos nada
      let fullCode = el?.getAttribute('data-product-code') || codeFromLine || '';
      const productCode = (fullCode.split('_')[0]) || fullCode;

      // Intentar leer datos como en captureProductData
      const productData = {
        code: productCode,
        name: el?.getAttribute('data-product-name') || safeInnerText('.product-name, h1, .product-details__name') || '',
        price: el?.getAttribute('data-product-price') || safeInnerText('.price, .product-price, [data-product-price]') || '',
        catalogPrice: el?.getAttribute('data-product-catalog-price') || '',
        brand: el?.getAttribute('data-product-brand') || '',
        category: el?.getAttribute('data-product-category') || '',
        variant: el?.getAttribute('data-product-variant') || '',
        offerType: el?.getAttribute('data-product-offer-type') || '',
        quantity: 1,
        image: findProductImageUrl(el || document),
        person: personFromLine
      };

      // Ajustar cantidad (preferir la del input si es mayor)
      const qLine = Math.max(1, parseInt(qtyFromLineRaw, 10) || 1);
      productData.quantity = readQtyFromFormNear(el || null, qLine);

      // Persistir en failedProductsData (manteniendo failedProducts texto para compatibilidad)
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem('failedProductsData')) || []; } catch(_){}
      arr.push(productData);
      localStorage.setItem('failedProductsData', JSON.stringify(arr));

      showFailedProductsDetails(); // refrescar panel
      console.log(LOGP, 'Fallido capturado (datos)', productData);
    } catch (e) {
      console.warn(LOGP, 'No fue posible capturar datos del fallido:', e);
    }
  }

  // ========= Exportadores Docs (HTML / PNG) =========

  // Convierte cualquier imagen a JPG HD manteniendo proporción (modo "contain")
  async function toJPEGDataURL(src, cssW = 88, cssH = 88, {
    scale = 3,
    quality = 0.95,
    bg = '#ffffff'
  } = {}) {
    function load(url) {
      return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
      });
    }

    let img;
    try {
      img = await load(src);
    } catch {
      try {
        const r = await fetch(src, { mode: 'cors' });
        const b = await r.blob();
        const u = URL.createObjectURL(b);
        img = await load(u);
        URL.revokeObjectURL(u);
      } catch {
        return src; // fallback
      }
    }

    const outW = Math.max(1, Math.round(cssW * scale));
    const outH = Math.max(1, Math.round(cssH * scale));
    const c = document.createElement('canvas');
    c.width = outW; c.height = outH;
    const ctx = c.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, outW, outH);

    const r = Math.min(outW / img.naturalWidth, outH / img.naturalHeight);
    const dw = Math.round(img.naturalWidth * r);
    const dh = Math.round(img.naturalHeight * r);
    const dx = Math.round((outW - dw) / 2);
    const dy = Math.round((outH - dh) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);

    return c.toDataURL('image/jpeg', quality);
  }

    async function openPrintableDoc(productMap) {
        // ==== Totales globales (desde el map deduplicado recibido) ====
        let totalQty = 0;
        let totalValue = 0;
        productMap.forEach(p => {
            const q = p.quantity || 1;
            const priceN = parsePrice(p.price);
            totalQty += q;
            totalValue += (priceN || 0) * q;
        });

        // ==== Armar grupos por persona (desde capturados RAW) ====
        const norm = s => String(s||'').trim().replace(/\s+/g,' ');
        let allCaptured = [];
        try { allCaptured = JSON.parse(localStorage.getItem('capturedProducts')) || []; } catch (_) {}

        const groups = new Map();  // key -> { name, items: Map(code->p), units, value }
        allCaptured.forEach(p => {
            const pname = norm(p.person);
            const key = pname || '(Sin nombre)';
            if (!groups.has(key)) groups.set(key, { name: pname || '(Sin nombre)', items: new Map(), units: 0, value: 0 });

            const g = groups.get(key);
            const code = p.code || 'N/A';
            const q = Number(p.quantity || 1);
            const v = (parsePrice(p.price) || 0) * q;

            // Dedup dentro de la persona por código
            const prev = g.items.get(code) || { ...p, quantity: 0, person: pname };
            prev.quantity += q;
            if (!prev.name) prev.name = p.name;
            if (!prev.price) prev.price = p.price;
            if (!prev.catalogPrice) prev.catalogPrice = p.catalogPrice;
            if (!prev.image) prev.image = p.image;
            prev.person = pname;

            g.items.set(code, prev);
            g.units += q;
            g.value += v;
        });

        // ==== Totales por persona (lista para resumen) ====
        const perPersonList = Array.from(groups.values())
        .filter(g => g.name && g.name !== '(Sin nombre)')
        .sort((a,b) => (a.name||'').localeCompare(b.name||''))
        .map(g => ({ name: g.name, units: g.units, value: g.value }));

        // ==== Tarjetas compactas y “paste-friendly” para Docs ====
        const buildCardHTML = async (p, idx) => {
            const price = p.price ? toMoney(parsePrice(p.price)) : '';
            const cat   = p.catalogPrice ? toMoney(parsePrice(p.catalogPrice)) : '';
            const jpgSrc = p.image ? await toJPEGDataURL(p.image, 88, 88, { scale: 1.8, quality: 0.92 }) : '';
            return `
<div class="card" style="display:grid;grid-template-columns:88px 1fr;gap:8px;padding:8px;border:1px solid #e5e5e5;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.06);background:#fff;">
  <img src="${jpgSrc}" width="88" height="88" onerror="this.style.visibility='hidden'"
       style="width:88px;height:88px;object-fit:cover;border-radius:8px;border:1px solid #ddd;background:#fff;">
  <div>
    <p style="margin:0;line-height:1.15;font-size:13px;">
      <strong>Producto ${idx}</strong> - <strong>Código:</strong> ${p.code || '} ${p.quantity>1?`<strong>X${p.quantity}</strong>`:'}
      <br><strong>Nombre:</strong> ${(p.name||'')}
      <br><strong>Precio:</strong> ${price} ${cat?`<small>(Cat: ${cat})</small>`:''}
    </p>
  </div>
</div>`;
        };

        let bodyGridHTML = '';
        if (groups.size > 0) {
            // Secciones por persona (sin headings, sin listas — puro <p> + <br>)
            const sections = [];
            const orderedGroups = Array.from(groups.values())
            .sort((a,b) => (a.name||'').localeCompare(b.name||''));
            for (const g of orderedGroups) {
                let idx = 1;
                const cards = [];
                for (const [, p] of g.items) {
                    cards.push(await buildCardHTML(p, idx++));
                }
                sections.push(`
<section class="person-section" style="margin:12px 0 8px 0;">
  <p class="person-h" style="margin:0 0 6px 0;line-height:1.15;font-size:14px;font-weight:700;">
    ${g.name} — ${g.units} und — ${toMoney(g.value)}
  </p>
  <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">
    ${cards.join('\n')}
  </div>
</section>`);
            }
            bodyGridHTML = sections.join('\n');
        } else {
            // Plano (sin personas): usar el map deduplicado recibido
            let idx = 1;
            const cards = [];
            for (const [, p] of productMap) {
                const p2 = { ...p, person: '' };
                cards.push(await buildCardHTML(p2, idx++));
            }
            bodyGridHTML = `<div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">${cards.join('\n')}</div>`;
        }

        // ==== Resumen por persona (solo <p>, sin <ul>/<li>) ====
        const perPersonHTML = perPersonList.length ? `
    <div class="perperson" style="margin:6px 0 8px 0;font-size:13px;">
      <p style="margin:0;line-height:1.15;"><strong>Totales por persona:</strong></p>
      ${perPersonList.map(x => `
        <p style="margin:0;line-height:1.15;">- <span class="pp-name">${x.name}</span> - ${x.units} und - ${toMoney(x.value)}</p>
      `).join('')}
    </div>` : '';

        // ==== HTML final (con reset compacto inline) ====
        const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Productos capturados</title>
<style>
/* Reset suave para pegar en Docs con menos separación */
html,body,div,section,p,ul,li{margin:0;padding:0}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;margin:16px;background:#fafafa;color:#222;line-height:1.15}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;flex-wrap:wrap}
.header .btn{padding:6px 10px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer}
.summary{margin:4px 0 8px 0;font-size:13px}
@media print {.header{display:none}}
</style></head>
<body>
  <div class="header">
    <div><strong>Productos capturados</strong></div>
    <div>
      <button class="btn" id="copy">Copiar todo</button>
      <button class="btn" onclick="window.print()">Imprimir / PDF</button>
    </div>
  </div>

  <div id="content">
    <div class="summary">
      <p style="margin:0;line-height:1.15;">
        <strong>Total unidades:</strong> ${totalQty}
        &nbsp;&nbsp;
        <strong>Total estimado:</strong> ${toMoney(totalValue)}
      </p>
    </div>

    ${perPersonHTML}

    ${bodyGridHTML}
  </div>

  <script>
    (function(){
      const btn = document.getElementById('copy');
      btn.addEventListener('click', () => {
        try{
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(document.getElementById('content'));
          sel.removeAllRanges(); sel.addRange(range);
          const ok = document.execCommand('copy');
          if (!ok) throw new Error('copy falló');
          alert('Copiado. Ahora pégalo en Google Docs (Ctrl+V).');
        } catch(e) {
          alert('No se pudo copiar automáticamente. Selecciona el contenido y copia (Ctrl+C).');
        }
      });
    })();
  </script>
</body></html>`;

        const blob = new Blob([html], {type:'text/html;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
    }

  // ======= helpers de texto para medir y dibujar =======
  function drawLine(ctx, txt, x, y){ ctx.fillText(txt, x, y); return ctx.measureText(txt).width; }
  function drawWrap(ctx, text, x, y, maxWidth, lineHeight){
    const words = String(text).split(/\s+/); let line = '', yy = y, maxUsed = 0;
    for (let n=0; n<words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxWidth && n>0) {
        ctx.fillText(line, x, yy);
        maxUsed = Math.max(maxUsed, ctx.measureText(line).width);
        line = words[n] + ' ';
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, yy);
    maxUsed = Math.max(maxUsed, ctx.measureText(line).width);
    return { endY: yy, maxWidthUsed: maxUsed };
  }

    // ======= render con recorte automático al contenido (sin Categoría ni oferta) =======
    async function renderCardToPNG(p, i=1) {
        const PAD = 18, IMG = 120;
        const W = 1100, H = 520;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,W,H);

        const imgX = PAD, imgY = PAD;
        let imgRight = imgX + IMG, imgBottom = imgY + IMG;

        let drewImage = false;
        if (p.image) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.decoding = 'async';
                img.referrerPolicy = 'no-referrer';
                img.src = p.image;
                await new Promise((res,rej)=>{ img.onload=res; img.onerror=rej; });
                ctx.drawImage(img, imgX, imgY, IMG, IMG);
                drewImage = true;
            } catch (_) {
                try {
                    const r = await fetch(p.image, { mode: 'cors' });
                    const b = await r.blob();
                    const obj = URL.createObjectURL(b);
                    const img2 = new Image(); img2.src = obj;
                    await new Promise((res,rej)=>{ img2.onload=res; img2.onerror=rej; });
                    ctx.drawImage(img2, imgX, imgY, IMG, IMG);
                    URL.revokeObjectURL(obj);
                    drewImage = true;
                } catch (e) { drewImage = false; }
            }
        }
        if (!drewImage) {
            ctx.fillStyle = '#f3f3f3'; ctx.fillRect(imgX, imgY, IMG, IMG);
            ctx.strokeStyle = '#d0d0d0'; ctx.strokeRect(imgX+0.5, imgY+0.5, IMG-1, IMG-1);
            ctx.fillStyle = '#999'; ctx.font = '14px Arial'; ctx.fillText('sin imagen', imgX+40, imgY + IMG/2+5);
        }

        const X = imgX + IMG + 20;
        let tRight = X;
        let y = PAD + 10;

        ctx.fillStyle = '#111'; ctx.font = 'bold 16px Arial';
        tRight = Math.max(tRight, X + drawLine(ctx, `Producto ${i}`, X, y));

        y += 28;
        ctx.font = 'bold 18px Arial';
        const qtyTxt = p.quantity>1?`  X${p.quantity}`:'';
        tRight = Math.max(tRight, X + drawLine(ctx, `Código: ${p.code||''}${qtyTxt}`, X, y));

        y += 28;
        ctx.font = '16px Arial';
        const wrap1 = drawWrap(ctx, `Nombre: ${p.name||''}`, X, y, W - X - PAD, 20);
        y = wrap1.endY;
        tRight = Math.max(tRight, X + wrap1.maxWidthUsed);

        y += 28;
        ctx.font = '16px Arial';
        const wrapP = drawWrap(ctx, `Persona: ${p.person||''}`, X, y, W - X - PAD, 20);
        y = wrapP.endY;
        tRight = Math.max(tRight, X + wrapP.maxWidthUsed);

        y += 28;
        const priceN = parsePrice(p.price), catN = parsePrice(p.catalogPrice);
        ctx.font = '16px Arial';
        const priceLine = `Precio: ${priceN?toMoney(priceN):''}${catN?`  (Cat: ${toMoney(catN)})`:''}`;
        tRight = Math.max(tRight, X + drawLine(ctx, priceLine, X, y));

        // Eliminado: bloque de "Categoría / Oferta"
        // En su lugar, solo dejamos un margen final
        const textBottom = y + 1;

        const contentLeft   = Math.min(imgX, X);
        const contentTop    = PAD;
        const contentRight  = Math.max(imgRight, tRight);
        const contentBottom = Math.max(imgBottom, textBottom);

        const OUTPAD = 14;
        const sx = Math.max(0, contentLeft - OUTPAD);
        const sy = Math.max(0, contentTop - OUTPAD);
        const sw = Math.min(W - sx, (contentRight - contentLeft) + OUTPAD*2);
        const sh = Math.min(H - sy, (contentBottom - contentTop) + OUTPAD*2);

        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(sw));
        out.height = Math.max(1, Math.round(sh));
        const octx = out.getContext('2d');
        octx.fillStyle = '#ffffff'; octx.fillRect(0,0,out.width,out.height);
        octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height);

        octx.strokeStyle = '#e6e6e6';
        octx.strokeRect(0.5, 0.5, out.width-1, out.height-1);

        return out.toDataURL('image/png');
    }


  // Vista para Google Docs con PNG recortados
  async function openDocsPNG(productMap) {
    const imgs = [];
    let idx = 1;
    for (const [, p] of productMap) {
      try {
        const dataURL = await renderCardToPNG(p, idx++);
        imgs.push(`<img src="${dataURL}" style="max-width:100%;display:block;margin:10px 0;border:1px solid #eee;border-radius:8px">`);
      } catch (e) {
        console.error(LOGP, 'PNG embed fail', p.code, e);
        imgs.push(`<div style="padding:12px;border:1px solid #eee;border-radius:8px;background:#fafafa">Sin imagen (no compatible)</div>`);
      }
    }

    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Docs — PNG incrustado (recortado)</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:24px;background:#fff;color:#222}
  .header{display:flex;gap:8px;align-items:center;margin-bottom:12px}
  .btn{padding:8px 12px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer}
  @media print {.header{display:none}}
</style></head>
<body>
  <div class="header">
    <button class="btn" id="copy">Copiar todo</button>
    <button class="btn" onclick="window.print()">Imprimir / PDF</button>
  </div>
  <div id="content">
    ${imgs.join('\n')}
  </div>
  <script>
    (function(){
      const btn = document.getElementById('copy');
      btn.addEventListener('click', async () => {
        try{
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(document.getElementById('content'));
          sel.removeAllRanges(); sel.addRange(range);
          const ok = document.execCommand('copy');
          if (!ok) throw new Error('execCommand(copy) falló');
          alert('Copiado. Ahora pégalo en Google Docs (Ctrl+V).');
        } catch(e) {
          alert('No se pudo copiar automáticamente. Selecciona todo (Ctrl+A) y luego copia (Ctrl+C).');
        }
      });
    })();
  </script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ========= Render capturados =========
  function showCapturedProducts() {
    const capturedProductsDiv = document.getElementById('capturedProductsContainer');
    if (!capturedProductsDiv) return;
    let capturedProducts = [];
    try { capturedProducts = JSON.parse(localStorage.getItem('capturedProducts')) || []; } catch (e) { }

    if (capturedProducts.length === 0) {
      capturedProductsDiv.textContent = '';
      const p = document.createElement('p');
      p.textContent = 'No hay productos capturados.';
      capturedProductsDiv.appendChild(p);
      return;
    }

    // Controles superiores
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.flexWrap = 'wrap';
    controls.style.gap = '8px';
    controls.style.margin = '0 0 10px 0';

    const sortSelect = document.createElement('select');
    sortSelect.innerHTML = `
      <option value="">Ordenar...</option>
      <option value="name">Nombre (A-Z)</option>
      <option value="price">Precio (asc)</option>
      <option value="price_desc">Precio (desc)</option>
    `;
    sortSelect.onchange = () => {
      const val = sortSelect.value;
      if (val === 'name') capturedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      if (val === 'price') capturedProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      if (val === 'price_desc') capturedProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      localStorage.setItem('capturedProducts', JSON.stringify(capturedProducts));
      showCapturedProducts();
    };
    controls.appendChild(sortSelect);
    try {
      // Reemplazar innerHTML de opciones por elementos seguros
      while (sortSelect.firstChild) sortSelect.removeChild(sortSelect.firstChild);
      const opts = [
        { value: '', text: 'Ordenar...' },
        { value: 'name', text: 'Nombre (A-Z)' },
        { value: 'price', text: 'Precio (â†‘)' },
        { value: 'price_desc', text: 'Precio (â†“)' }
      ];
      opts.forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.text; sortSelect.appendChild(op); });
    } catch(_) {}

    const btnDocs = document.createElement('button');
    btnDocs.className = 'actionButton';
    btnDocs.textContent = 'Abrir vista para Docs (HTML)';
    btnDocs.onclick = () => {
      const map = dedupeProducts(capturedProducts);
      openPrintableDoc(map);
    };
    controls.appendChild(btnDocs);

    const btnDocsPNG = document.createElement('button');
    btnDocsPNG.className = 'actionButton';
    btnDocsPNG.textContent = 'Copiar para Docs (PNG)';
    btnDocsPNG.onclick = async () => {
      const map = dedupeProducts(capturedProducts);
      await openDocsPNG(map);
    };
    controls.appendChild(btnDocsPNG);

    const btnRetry = document.createElement('button');
    btnRetry.className = 'actionButton';
    btnRetry.textContent = 'Reintentar fallidos → cola';
    btnRetry.onclick = () => {
      const failed = (localStorage.getItem('failedProducts') || '').trim();
      if (!failed) return alert('No hay fallidos');
      const arr = failed.split('\n').filter(Boolean);
      const existing = (localStorage.getItem('products') || '').split('\n').filter(Boolean);
      localStorage.setItem('products', [...arr, ...existing].join('\n'));
      localStorage.removeItem('failedProducts');
      alert(`Reinyectados ${arr.length} productos a la cola`);
      const failedDiv = document.getElementById('failedProductsContainer');
      if (failedDiv) {
        failedDiv.innerHTML = '<h3>Productos fallidos:</h3><div id="failedProductsDetails"></div>';
        showFailedProductsDetails();
      }
    };
    controls.appendChild(btnRetry);

    const btnCapture = document.createElement('button');
    btnCapture.className = 'actionButton';
    btnCapture.textContent = 'Capturar productos visibles';
    btnCapture.onclick = captureVisibleFromGrid;
    controls.appendChild(btnCapture);

    capturedProductsDiv.innerHTML = '';
    capturedProductsDiv.appendChild(controls);

    // Deduplicar por code sumando cantidades
    // Deduplicar por código **y persona** sumando cantidades
    const productMap = dedupeProducts(capturedProducts, { perPerson: true });

    // Totales
    let totalQty = 0;
    let totalValue = 0;
    productMap.forEach(p => {
        totalQty += p.quantity;
        totalValue += parsePrice(p.price) * p.quantity;
    });

    // Render compartido (si está disponible) y salir temprano
    try {
      if (window.NV && NV.ui && typeof NV.ui.renderSummary === 'function' && typeof NV.ui.renderProductItem === 'function') {
        const frag = document.createDocumentFragment();
        frag.appendChild(NV.ui.renderSummary(totalQty, totalValue));
        let index = 1;
        productMap.forEach(product => {
          frag.appendChild(NV.ui.renderProductItem(product, index++, 'Producto'));
        });
        capturedProductsDiv.appendChild(frag);
        return;
      }
    } catch (_) {}

    const summary = document.createElement('div');
    summary.className = 'summary';
    summary.innerHTML = `<strong>Total unidades:</strong> ${totalQty} &nbsp;&nbsp; <strong>Total estimado:</strong> ${toMoney(totalValue)}`;
    capturedProductsDiv.appendChild(summary);

    // Render items
    let index = 1;
    productMap.forEach(product => {
      const quantityText = product.quantity > 1 ? `<strong>X${product.quantity}</strong>` : '';
      const item = document.createElement('div');
      item.className = 'productItem';
      const imgUrl = product.image || '';
      const priceFmt = product.price ? toMoney(parsePrice(product.price)) : '';
      const catFmt = product.catalogPrice ? toMoney(parsePrice(product.catalogPrice)) : '';

        item.innerHTML = `
  <img class="thumb" src="${imgUrl}" alt="${(product.name || '').replace(/"/g, '&quot;')}" onerror="this.style.visibility='hidden'">
  <div>
    <p><strong>Producto ${index}:</strong></p>
    <p><strong>Código:</strong> ${product.code} ${quantityText}</p>
    <p><strong>Nombre:</strong> ${product.name ?? ''}</p>
    <p><strong>Persona:</strong> ${product.person ?? ''}</p>
    <p><strong>Precio:</strong> ${priceFmt} ${catFmt ? `&nbsp;<small>(Cat: ${catFmt})</small>` : ''}</p>
    <p><strong>Categoría:</strong> ${product.category ?? ''} &nbsp; <strong>Oferta:</strong> ${product.offerType ?? ''}</p>
  </div>
`;

      capturedProductsDiv.appendChild(item);
      index++;
    });
  }

    // Dedup helper (se mantiene)
    function dedupeProducts(list, { perPerson = false } = {}) {
        const map = new Map();
        const norm = s => String(s||'').trim().replace(/\s+/g,' ');
        list.forEach(p => {
            const code = p.code || 'N/A';
            const person = perPerson ? norm(p.person) : '';
            const key = perPerson ? `${code}@@${person}` : code;

            if (map.has(key)) {
                const acc = map.get(key);
                acc.quantity += (p.quantity || 1);
                // completa campos vacíos
                acc.name ||= p.name;
                acc.price ||= p.price;
                acc.catalogPrice ||= p.catalogPrice;
                acc.image ||= p.image;
                acc.person = person;
            } else {
                map.set(key, { ...p, person, quantity: p.quantity || 1 });
            }
        });
        return map;
    }

  // ========= Render fallidos (detalles con el mismo esquema) =========
  function showFailedProductsDetails() {
    const container = document.getElementById('failedProductsContainer');
    if (!container) return;
    let details = [];
    try { details = JSON.parse(localStorage.getItem('failedProductsData')) || []; } catch(_){}

    let detailsDiv = container.querySelector('#failedProductsDetails');
    if (!detailsDiv) {
      detailsDiv = document.createElement('div');
      detailsDiv.id = 'failedProductsDetails';
      container.appendChild(detailsDiv);
    }

    if (details.length === 0) {
      detailsDiv.innerHTML = '<p style="margin:6px 0;color:#666;font-size:13px">No hay datos capturados de fallidos.</p>';
      return;
    }

    // Mostrar en el mismo formato compacto de â€œcapturadosâ€
    const nodes = [];
    let index = 1;
    for (const p of details) {
      const imgUrl = p.image || '';
      const priceFmt = p.price ? toMoney(parsePrice(p.price)) : '';
      const catFmt = p.catalogPrice ? toMoney(parsePrice(p.catalogPrice)) : '';
      const quantityText = p.quantity > 1 ? `<strong>X${p.quantity}</strong>` : '';

      const div = document.createElement('div');
      div.className = 'productItem';
      div.innerHTML = `
        <img class="thumb" src="${imgUrl}" alt="${(p.name || '').replace(/"/g,'&quot;')}" onerror="this.style.visibility='hidden'">
        <div>
          <p><strong>Fallido ${index}:</strong> <small style="color:#c00">no agregado al carrito</small></p>
          <p><strong>Código:</strong> ${p.code || ''} ${quantityText}</p>
          <p><strong>Nombre:</strong> ${p.name ?? ''}</p>
          <p><strong>Persona:</strong> ${p.person ?? ''}</p>
          <p><strong>Precio:</strong> ${priceFmt} ${catFmt ? `&nbsp;<small>(Cat: ${catFmt})</small>` : ''}</p>
          <p><strong>Categoría:</strong> ${p.category ?? ''} &nbsp; <strong>Oferta:</strong> ${p.offerType ?? ''}</p>
        </div>
      `;
      nodes.push(div);
      index++;
    }

    while (detailsDiv.firstChild) detailsDiv.removeChild(detailsDiv.firstChild);
    nodes.forEach(n => detailsDiv.appendChild(n));
  }

  // ========= Agregar al carrito =========
  function checkForProductButton(attempts = 0) {
    if (window.location.href.includes('/homepage')) {
      handleError('Navegación incorrecta, redirigido a la página de inicio.');
      return;
    }

    function __nvFindAddToCartButton(){
      const selectors = [
        '.js-nautilus-AddtoCart button.btn-primary',
        'form.add_to_cart_form button.btn-primary',
        'button.js-nautilus-addToCart',
        'button.add-to-cart',
        'button[name="addToCart"]',
        '[data-action="ADD_TO_CART"]',
        '.product-details button.btn-primary',
        '.product-main button.btn-primary'
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

        const products = (localStorage.getItem('products') || '').split('\n').filter(Boolean);
        const { code, quantity: quantitySpecified } = parseEntryLine(products[0] || '');
        let quantity = (quantitySpecified || '1').trim();
        // Nota: la persona ya fue guardada en localStorage.currentPerson en processNextProduct()

      if (quantity === '1') {
        captureProductData(1);
        buttonToClick.click();
        setTimeout(() => {
          console.log(LOGP, 'Producto agregado correctamente al carrito.');
          products.shift();
          localStorage.setItem('products', products.join('\n'));
          processNextProduct();
        }, 2000);
      } else {
        const quantityInt = Math.max(1, parseInt(quantity, 10) || 1);
        captureProductData(quantityInt);
        let clickCount = 0;

        const clickInterval = setInterval(() => {
          buttonToClick.click();
          clickCount++;
          if (clickCount >= quantityInt) {
            clearInterval(clickInterval);
            setTimeout(() => {
              console.log(LOGP, 'Producto agregado correctamente al carrito.');
              products.shift();
              localStorage.setItem('products', products.join('\n'));
              processNextProduct();
            }, 2000);
          }
        }, 2000);
      }
    } else {
      if (attempts < 10) {
        console.warn(LOGP, `Intento ${attempts}: Botón AddToCart no encontrado. Reintentando...`);
        // Mostrar cooldown y permitir saltar
        try {
          setCooldown(`Buscando Botón (intento ${attempts+1}/10)`, 1500, () => {
            try {
              const products = (localStorage.getItem('products') || '').split('\n').filter(Boolean);
              const skipped = products.shift();
              localStorage.setItem('products', products.join('\n'));
              if (window.NV && NV.utils && NV.utils.reportError) NV.utils.reportError(`Producto saltado: ${skipped||''}`, { ui: true, level: 'warn', timeoutMs: 3000 });
            } catch(_) {}
            hideCooldown();
            processNextProduct();
          });
        } catch(_) {}
        setTimeout(() => { hideCooldown(); checkForProductButton(attempts + 1); }, 1500);
      } else {
        try {
          if (window.NV && NV.utils && NV.utils.reportError) {
            const hints = {
              url: location.href,
              onGrid: !!document.querySelector('.cardproduct, [class*="cardproduct"]'),
              onDetail: !!document.querySelector('.product-main, .product-details, .js-nautilus-AddtoCart'),
              hasForm: !!document.querySelector('form.add_to_cart_form'),
            };
            NV.utils.reportError('No se encontró el botón de Agregar al carrito. ¿Estás en la página de detalle?', { ctx: hints, ui: true, level: 'warn', timeoutMs: 7000 });
          }
        } catch(_) {}
        const products = (localStorage.getItem('products') || '').split('\n').filter(Boolean);
        const failedProduct = products.shift();
        localStorage.setItem('products', products.join('\n'));

        let failedProducts = localStorage.getItem('failedProducts') || '';
        failedProducts += (failedProduct || '') + '\n';
        localStorage.setItem('failedProducts', failedProducts);

        updateFailedProductsUI(failedProduct || '(desconocido)');
        // NUEVO: capturar los mismos datos posibles del producto fallido
        try { captureFailedProductData(); } catch(_) {}

        console.error(LOGP, 'Botón AddToCart no encontrado tras múltiples intentos.');
        processNextProduct();
      }
    }
  }

  // ========= Errores / fallidos =========
  function handleError(errorMessage) {
    try { if (window.NV && NV.utils && NV.utils.reportError) NV.utils.reportError(errorMessage, { ui: true, level: 'error' }); } catch(_) {}
    console.error(LOGP, errorMessage);
    isAddingProducts = false;
    localStorage.setItem('isAddingProducts', 'false');
    alert(errorMessage);
  }
  function updateFailedProductsUI(failedProduct) {
    const failedProductsContainer = document.getElementById('failedProductsContainer');
    if (failedProductsContainer) {
      const newContent = document.createElement('div');
      newContent.style.color = 'red';
      newContent.textContent = failedProduct;
      failedProductsContainer.appendChild(newContent);
      showFailedProductsDetails();
    }
  }

  // ========= Overrides: Fallidos como lista detallada =========
  try {
    // Reemplaza el render de fallidos para que sea igual al de capturados
    showFailedProductsDetails = function() {
      const container = document.getElementById('failedProductsContainer');
      if (!container) return;
      let details = [];
      try { details = JSON.parse(localStorage.getItem('failedProductsData')) || []; } catch(_){}

      // Forzar plantilla (quita <pre> heredado si existe) con DOM seguro
      while (container.firstChild) container.removeChild(container.firstChild);
      const h3 = document.createElement('h3'); h3.textContent = 'Productos fallidos:'; container.appendChild(h3);
      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.flexWrap = 'wrap';
      controls.style.gap = '8px';
      controls.style.margin = '0 0 10px 0';
      const sortSelect = document.createElement('select');
      [
        { value: '', text: 'Ordenar...' },
        { value: 'name', text: 'Nombre (A-Z)' },
        { value: 'price', text: 'Precio (asc)' },
        { value: 'price_desc', text: 'Precio (desc)' }
      ].forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.text; sortSelect.appendChild(op); });
      controls.appendChild(sortSelect);
      container.appendChild(controls);
      const detailsDiv = document.createElement('div'); detailsDiv.id = 'failedProductsDetails'; container.appendChild(detailsDiv);
      try {
        sortSelect.onchange = () => {
          const val = sortSelect.value;
          let data = [];
          try { data = JSON.parse(localStorage.getItem('failedProductsData')) || []; } catch(_){}
          if (val === 'name') data.sort((a,b) => (a.name||'').localeCompare(b.name||''));
          if (val === 'price') data.sort((a,b) => (parsePrice(a.price)||0) - (parsePrice(b.price)||0));
          if (val === 'price_desc') data.sort((a,b) => (parsePrice(b.price)||0) - (parsePrice(a.price)||0));
          localStorage.setItem('failedProductsData', JSON.stringify(data));
          showFailedProductsDetails();
        };
      } catch(_) {}

      if (!details || details.length === 0) {
        detailsDiv.innerHTML = '<p style="margin:6px 0;color:#666;font-size:13px">No hay productos fallidos.</p>';
        return;
      }

      // Deduplicar por código y persona
      const productMap = dedupeProducts(details, { perPerson: true });

      // Totales
      let totalQty = 0;
      let totalValue = 0;
      productMap.forEach(p => {
        const q = p.quantity || 1;
        totalQty += q;
        totalValue += (parsePrice(p.price) || 0) * q;
      });

      // Render compartido (si está disponible) y salir temprano
      try {
        if (window.NV && NV.ui && typeof NV.ui.renderSummary === 'function' && typeof NV.ui.renderProductItem === 'function') {
          while (detailsDiv.firstChild) detailsDiv.removeChild(detailsDiv.firstChild);
          const frag = document.createDocumentFragment();
          frag.appendChild(NV.ui.renderSummary(totalQty, totalValue));
          let index = 1;
          productMap.forEach(p => {
            frag.appendChild(NV.ui.renderProductItem(p, index++, 'Fallido'));
          });
          detailsDiv.appendChild(frag);
          return;
        }
      } catch (_) {}

      const summary = document.createElement('div');
      summary.className = 'summary';
      summary.innerHTML = `<strong>Total unidades:</strong> ${totalQty} &nbsp;&nbsp; <strong>Total estimado:</strong> ${toMoney(totalValue)}`;
      detailsDiv.appendChild(summary);

      let index = 1;
      productMap.forEach(p => {
        const imgUrl = p.image || '';
        const priceFmt = p.price ? toMoney(parsePrice(p.price)) : '';
        const catFmt = p.catalogPrice ? toMoney(parsePrice(p.catalogPrice)) : '';
        const quantityText = p.quantity > 1 ? `<strong>X${p.quantity}</strong>` : '';

        const item = document.createElement('div');
        item.className = 'productItem';
        item.innerHTML = `
  <img class="thumb" src="${imgUrl}" alt="${(p.name || '').replace(/"/g,'&quot;')}" onerror="this.style.visibility='hidden'">
  <div>
    <p><strong>Fallido ${index}:</strong> <small style="color:#c00">no agregado al carrito</small></p>
    <p><strong>Código:</strong> ${p.code || ''} ${quantityText}</p>
    <p><strong>Nombre:</strong> ${p.name ?? ''}</p>
    <p><strong>Persona:</strong> ${p.person ?? ''}</p>
    <p><strong>Precio:</strong> ${priceFmt} ${catFmt ? `&nbsp;<small>(Cat: ${catFmt})</small>` : ''}</p>
    <p><strong>Categoría:</strong> ${p.category ?? ''} &nbsp; <strong>Oferta:</strong> ${p.offerType ?? ''}</p>
  </div>`;
        detailsDiv.appendChild(item);
        index++;
      });
    };

    // Evita texto rojo plano; refresca la vista detallada
    updateFailedProductsUI = function(_failedProduct) {
      showFailedProductsDetails();
    };
  } catch(_) {}

  // ========= Enlace a módulos (utils/exporters) =========
  try {
    if (window.NV) { NV.LOGP = LOGP; }
    // Inicializar store y tomar flags de UI
    if (window.NV && NV.state && typeof NV.state.init === 'function') {
      const st = NV.state.init();
      try {
        if (st && st.ui) {
          isMinimized = !!st.ui.isMinimized;
          isPinned = !!st.ui.isPinned;
        }
      } catch(_) {}
    }
    if (window.NV && NV.utils) {
      // Reasignar helpers a implementaciones modulares
      parsePrice = NV.utils.parsePrice;
      toMoney = NV.utils.toMoney;
      parseEntryLine = NV.utils.parseEntryLine;
      waitForBody = NV.utils.waitForBody;
      findProductCard = NV.utils.findProductCard;
      findProductImageUrl = NV.utils.findProductImageUrl;
      drawLine = NV.utils.drawLine;
      drawWrap = NV.utils.drawWrap;
    }
    if (window.NV && NV.exporters) {
      toJPEGDataURL = NV.exporters.toJPEGDataURL;
      renderCardToPNG = NV.exporters.renderCardToPNG;
      openPrintableDoc = NV.exporters.openPrintableDoc;
      openDocsPNG = NV.exporters.openDocsPNG;
    }
  } catch (_) { console.warn(LOGP, 'No fue posible enlazar módulos'); }

  // ========= Arranque =========
  (async () => {
    try {
      await waitForBody();
      console.log(LOGP, 'Arrancando en', location.href);
      addUI();
      isAddingProducts = localStorage.getItem('isAddingProducts') === 'true';

      // segundo intento por si la SPA hace swaps de DOM al inicio
      setTimeout(addUI, 1200);

      setTimeout(() => { if (isAddingProducts) checkForProductButton(); }, 1500);

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
            try { window.__nvUiObserverPaused = true; addUI(); } finally { setTimeout(() => { try { window.__nvUiObserverPaused = false; } catch(_) {} }, 0); }
          }
        }, 200);
      });
      try { window.__nvUiObserver = mo; window.__nvUiObserverTarget = document.documentElement; window.__nvUiObserverOpts = { childList: true, subtree: true }; } catch(_) {}
      mo.observe(document.documentElement, { childList: true, subtree: true });

      // Atajos (Alt+C y Alt+R)
      document.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyC') { e.preventDefault(); captureVisibleFromGrid(); }
        if (e.altKey && e.code === 'KeyR') {
          e.preventDefault();
          localStorage.removeItem('isMinimized');
          localStorage.removeItem('windowPosition');
          isMinimized = false;
          addUI();
          alert('UI reiniciada (Alt+R).');
        }
      });

    } catch (e) {
      console.error(LOGP, 'Fallo de arranque:', e);
      try { addUI(); } catch(_) {}
    }
  })();

})();













})();

