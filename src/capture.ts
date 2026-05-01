import { findProductImageUrl, log } from './utils.js';
import { get, setCaptured, setFailed } from './state.js';
import { showCapturedProducts, showFailedProductsDetails } from './ui.js';

const LOGP = '[NV TM]';

export function findProductElementForCode(targetCode: string): HTMLElement | null {
    const t = String(targetCode || '').trim().toLowerCase();
    if (!t) return null;

    const cards = Array.from(document.querySelectorAll<HTMLElement>('[class*="product-item-card"], .cardproduct'));
    for (const card of cards) {
        const clNode = card.querySelector('[class*="details__cl"]');
        if (clNode) {
            const text = clNode.textContent || '';
            const match = text.match(/CL:\s*(\d+)/i);
            if (match && match[1] === t) return card;
        }
        const aNode = card.querySelector('a[href*="/p"]');
        if (aNode) {
            const href = aNode.getAttribute('href') || '';
            const match = href.match(/-(\d+)\/p/i);
            if (match && match[1] === t) return card;
        }
        const dpCode = card.getAttribute('data-product-code') || card.querySelector('[data-product-code]')?.getAttribute('data-product-code');
        if (dpCode && dpCode.toLowerCase().split('_')[0] === t) {
            return card;
        }
    }
    
    if (document.querySelector('.product-main, .product-details')) {
        return document.querySelector<HTMLElement>('.product-main, .product-details');
    }

    return null;
}

export function getExactAddToCartButton(code: string): HTMLButtonElement | null {
    const card = findProductElementForCode(code);
    if (!card) return null;

    const btns = Array.from(card.querySelectorAll<HTMLButtonElement>('button'));
    for (const btn of btns) {
        const txt = (btn.textContent || '').trim().toLowerCase();
        if (!btn.hasAttribute('data-testid') && (txt.includes('agregar') || btn.className.includes('primary')) && !btn.disabled) {
            return btn;
        }
    }

    const oldSelectors = [
        '[data-action="ADD_TO_CART"]',
        'button[name="addToCart"]',
        'button.js-nautilus-addToCart',
        'button.add-to-cart',
        'form.add_to_cart_form button[type="submit"]',
        '.js-nautilus-AddtoCart button'
    ];
    for (const sel of oldSelectors) {
        const btn = card.querySelector<HTMLButtonElement>(sel);
        if (btn && !btn.disabled) return btn;
    }

    return null;
}

function safeInnerText(ctx: Element | Document | null, sel: string): string {
    const el = ctx && typeof ctx.querySelector === 'function' ? ctx.querySelector(sel) : null;
    return el ? (el.textContent || '').trim() : '';
}

function readQtyFromFormNear(el: Element | null, defQty: number | string): number {
    let qty = Math.max(1, parseInt(String(defQty), 10) || 1);
    if (!el) return qty;

    const newDOMInput = el.querySelector<HTMLInputElement>('input[data-testid="numeric-up-down-input"]');
    if (newDOMInput) {
        const n = parseInt(newDOMInput.value, 10);
        if (!isNaN(n) && n > qty) return n;
    }

    const form = (typeof el.closest === 'function' ? el.closest('form') : null) || el.parentElement?.querySelector('form') || document.querySelector('form.add_to_cart_form');
    if (form) {
        const qtyInput = form.querySelector<HTMLInputElement>('input.qtyList, input[name="qty"]');
        if (qtyInput) {
            const n = parseInt(qtyInput.value, 10);
            if (!isNaN(n) && n > qty) return n;
        }
    }
    return qty;
}

function extractProductData(el: HTMLElement | null, fallbackCode: string, qtyRaw: string, person: string): Product {
    const clMatch = el?.querySelector('[class*="details__cl"]')?.textContent?.match(/CL:\s*(\d+)/i)?.[1];
    const hrefMatch = el?.querySelector('a[href*="/p"]')?.getAttribute('href')?.match(/-(\d+)\/p/i)?.[1];
    const dpMatch = el?.getAttribute('data-product-code')?.split('_')[0];
    
    const code = clMatch || hrefMatch || dpMatch || fallbackCode;

    const name = el?.querySelector('[class*="details__descripcion"]')?.textContent?.trim()
              || safeInnerText(el, '.product-name, h1, .product-details__name')
              || el?.getAttribute('data-product-name') || '';

    const price = el?.querySelector('[class*="dinero_precios__actual"]')?.textContent?.trim()
               || el?.querySelector('[class*="puntos_valor-comercial__precio"]')?.textContent?.trim()
               || safeInnerText(el, '.price, .product-price, [data-product-price]')
               || el?.getAttribute('data-product-price') || '';

    const catalogPriceRaw = el?.querySelector('[class*="dinero_precio-lista"]')?.textContent || '';
    const catalogPrice = catalogPriceRaw.replace(/Precio lista/i, '').trim()
                      || el?.getAttribute('data-product-catalog-price') || '';

    const brand = el?.querySelector('[class*="details__marca"]')?.textContent?.trim() 
               || el?.getAttribute('data-product-brand') || '';

    const qty = readQtyFromFormNear(el, Math.max(1, parseInt(qtyRaw, 10) || 1));

    let image = '';
    if (el) {
        const newImg = el.querySelector<HTMLImageElement>('img[class*="heading_image__img"]');
        if (newImg) image = newImg.getAttribute('src') || newImg.getAttribute('srcset')?.split(' ')[0] || '';
    }
    if (!image && el) image = findProductImageUrl(el);

    return {
        code,
        name,
        price,
        catalogPrice,
        brand,
        category: el?.getAttribute('data-product-category') || '',
        variant: el?.getAttribute('data-product-variant') || '',
        offerType: el?.getAttribute('data-product-offer-type') || '',
        quantity: qty,
        image,
        person
    };
}

export function captureProductData(quantity = 1) {
    const st = get()!;
    const personFromLine = st.currentEntry.person || '';
    const qtyFromLineRaw = st.currentEntry.qtyFromLine;
    const codeFromLine = st.currentEntry.codeFromLine || '';

    const el = findProductElementForCode(codeFromLine);
    const productData = extractProductData(el, codeFromLine, qtyFromLineRaw ?? String(quantity), personFromLine);

    let capturedProducts = st.capturedProducts.slice();
    capturedProducts.push(productData);
    setCaptured(capturedProducts);
    showCapturedProducts();
  };

export function captureVisibleFromGrid() {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[class*="product-item-card"], .js-nautilus-AddtoCart'));
    let capturedProducts = get()!.capturedProducts.slice();
    let added = 0;

    cards.forEach(card => {
      const pd = extractProductData(card, '', '1', '');
      if (!pd.code) return;
      capturedProducts.push(pd);
      added++;
    });

    if (added > 0) {
      setCaptured(capturedProducts);
      showCapturedProducts();
      log('info', `Capturados ${added} productos visibles del grid`);
      alert(`Capturados ${added} productos visibles`);
    } else {
      alert('No se encontraron productos visibles para capturar.');
    }
  };

export function captureFailedProductData() {
    try {
      const st = get()!;
      const personFromLine = st.currentEntry.person || '';
      const qtyFromLineRaw = st.currentEntry.qtyFromLine || '1';
      const codeFromLine = st.currentEntry.codeFromLine || '';

      const el = findProductElementForCode(codeFromLine);
      const productData = extractProductData(el, codeFromLine, qtyFromLineRaw, personFromLine);

      let arr = st.failed.data.slice();
      arr.push(productData);
      setFailed(st.failed.text, arr);

      showFailedProductsDetails();
      log('info', 'Fallido capturado (datos)', productData);
    } catch (e) {
      log('warn', 'No fue posible capturar datos del fallido:', e);
    }
  };