const LOGP = '[NV TM]';

/**
 * Espera a que exista document.body
 * @param {number} [maxMs]
 * @returns {Promise<void>}
 */
export function waitForBody(maxMs: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.body) return resolve();
    const t0 = performance.now();
    const iv = setInterval(() => {
      if (document.body) { clearInterval(iv); resolve(); }
      else if (performance.now() - t0 > maxMs) { clearInterval(iv); reject(new Error('body timeout')); }
    }, 50);
  });
}

/**
 * Heurística es-CO para strings numéricos/precios
 * @param {unknown} val
 * @returns {number}
 */
export function parsePrice(val: unknown): number {
  if (val == null) return 0;
  let s = String(val).trim();
  if (!s) return 0;
  try { s = s.replace(/\u00A0/g, ' '); } catch(e) { console.debug(`${LOGP} parsePrice replace error`, e); }
  
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

  function toNum(str: string): number {
    const n = parseFloat(str);
    return isNaN(n) ? 0 : (negative ? -n : n);
  }

  // Both separators: assume es-CO (dot thousands, comma decimal)
  if (hasDot && hasComma) {
    if (lastDot > lastComma) {
      // Formato US (12,345.67) -> Comas son miles, punto es decimal
      s = s.replace(/,/g, '');
    } else {
      // Formato CO/EU (12.345,67) -> Puntos son miles, coma es decimal
      s = s.replace(/\./g, '').replace(/,/g, '.');
    }
    return toNum(s);
  }

  // Only comma
  if (!hasDot && hasComma) {
    const decLen = s.length - lastComma - 1;
    if (decLen === 3) { // thousands pattern like 12,345
      s = s.replace(/,/g, '');
      return toNum(s);
    } else {
      s = s.replace(/,/g, '.');
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
}

/**
 * Formatea a COP sin decimales
 * @param {number|string} n
 * @returns {string}
 */
export function toMoney(n: number | string): string {
  const v = Math.round(Number(n) || 0);
  try {
    return v.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } catch (e) {
    return '$' + v.toLocaleString('es-CO');
  }
}

/**
 * Parseo de línea "codigo-cantidad persona"
 * @param {string} line
 * @returns {{ code: string, quantity: string, person: string }}
 */
export function parseEntryLine(line: string): { code: string; quantity: string; person: string } {
  const s = String(line||'').trim();
  if (!s) return { code:'', quantity:'1', person:'' };

  const clean = (str: string | undefined) => String(str || '').replace(/[.,;:]+$/, '').trim();

  let m = s.match(/^(\S+?)\s*-\s*(\d+)(?:\s*(.*))?$/);
  if (m) return { code: clean(m[1]), quantity: clean(m[2]) || '1', person: clean(m[3]) };

  m = s.match(/^(\S+)(?:\s+(.*))?$/);
  return { code: clean(m?.[1]), quantity: '1', person: clean(m?.[2]) };
}

/**
 * Busca tarjeta padre (grid) para un nodo
 * @param {Element|null} el
 * @returns {Element | null}
 */
export function findProductCard(el: Element | null): Element | null {
  if (!el || typeof el.closest !== 'function') return null;
  return el.closest('.cardproduct, [class*="cardproduct"]') || el.closest('.col-xs-12');
}

/**
 * Encuentra URL de imagen (grid o detalle)
 * @param {Element|Document|null} ctx
 * @returns {string}
 */
export function findProductImageUrl(ctx: Element | Document | null): string {
  let card = findProductCard(ctx as Element | null);
  if (card) {
    let img = card.querySelector('img[data-image]') ||
              card.querySelector('.cardproduct__img img') ||
              card.querySelector('img');
    if (img) return img.getAttribute('data-image') || img.getAttribute('src') || '';
  }
  let detailImg = document.querySelector('.product-main img[data-image], .product-main img, .js-image-tdp-notFound, .product-details img');
  if (detailImg) return detailImg.getAttribute('data-image') || detailImg.getAttribute('src') || '';
  let anyImg = document.querySelector<HTMLImageElement>('img[src*="/images/"], img[src*="cdn"], img[src*=".webp"], img[src*=".jpg"], img[src*=".png"]');
  return anyImg ? (anyImg.getAttribute('data-image') || anyImg.src || '') : '';
}

/**
 * Deduplica lista de productos sumando cantidades
 */
export function dedupeProducts(list: Product[], { perPerson = false }: { perPerson?: boolean } = {}): Map<string, Product> {
  const map = new Map<string, Product>();
  const norm = (s: string | undefined) => String(s||'').trim().replace(/\s+/g,' ');
  list.forEach(p => {
    const code = p.code || 'N/A';
    const person = perPerson ? norm(p.person) : '';
    const key = perPerson ? `${code}@@${person}` : code;
    if (map.has(key)) {
      const acc = map.get(key)!;
      acc.quantity += Number(p.quantity || 1);
      acc.name ||= p.name;
      acc.price ||= p.price;
      acc.catalogPrice ||= p.catalogPrice;
      acc.image ||= p.image;
      acc.brand ||= p.brand;
      acc.category ||= p.category;
      acc.variant ||= p.variant;
      acc.offerType ||= p.offerType;
      acc.person = person;
    } else {
      map.set(key, { ...p, person, quantity: Number(p.quantity || 1) });
    }
  });
  return map;
}

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retraso dinámico (Jitter) para evadir bloqueos por WAF o Rate Limiting
 * @param {number} minMs 
 * @param {number} maxMs 
 * @returns {Promise<void>}
 */
export const randomDelay = (minMs: number, maxMs: number): Promise<void> => delay(Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs);

/**
 * Dibuja texto y retorna ancho
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} txt
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function drawLine(ctx: CanvasRenderingContext2D, txt: string, x: number, y: number): number { ctx.fillText(txt, x, y); return ctx.measureText(txt).width; }

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
export function drawWrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): { endY: number, maxWidthUsed: number } {
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

interface ReportErrorOpts {
  ctx?: unknown;
  ui?: boolean;
  level?: 'error' | 'warn' | 'info' | 'debug';
  timeoutMs?: number;
}

// Reporte de errores unificado
export function reportError(message: string, { ctx = null, ui = true, level = 'error', timeoutMs = 5000 }: ReportErrorOpts = {}): void {
  try {
    const prefix = LOGP + ' ';
    const payload = { message: String(message || ''), ctx };
    if (level === 'warn') console.warn(prefix, payload);
    else console.error(prefix, payload);
  } catch(e) {
    console.error('Critical error in reportError logger', e);
  }
  
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
    toast.style.marginBottom = '8px'; // Asegura separación limpia en múltiples errores
    toast.textContent = String(message || 'Error');
    host.appendChild(toast);
    setTimeout(() => { try { toast.remove(); } catch(e) { console.debug(`${LOGP} failed to remove toast`, e); } }, Math.max(1000, timeoutMs|0));
  } catch(e) {
    console.error(`${LOGP} failed to render error toast UI`, e);
  }
}

// Logging con niveles
const LVL: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };

export function getLogLevel(): string {
  try {
    const v = (localStorage.getItem('nv_log_level') || 'info').toLowerCase();
    return LVL[v] != null ? v : 'info';
  } catch (e) {
    return 'info';
  }
}

export function setLogLevel(l: string): void { 
  try { 
    localStorage.setItem('nv_log_level', String(l||'info')); 
  } catch(e) {
    console.warn(`${LOGP} Failed to save log level to localStorage`, e);
  } 
}

export function log(level: string, ...args: unknown[]): void {
  const cur = LVL[getLogLevel()];
  const want = LVL[(level||'info').toLowerCase()] ?? LVL.info;
  if (want > cur) return;
  const prefix = LOGP;
  try {
    if (want <= LVL.error) console.error(prefix, ...args);
    else if (want <= LVL.warn) console.warn(prefix, ...args);
    else if (want <= LVL.info) console.info(prefix, ...args);
    else console.debug(prefix, ...args);
  } catch(e) {
    console.error('Critical failure in logger', e);
  }
}
