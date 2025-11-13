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
