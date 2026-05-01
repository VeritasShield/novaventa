import { findProductImageUrl, log } from './utils.js';
import { get, setCaptured, setFailed } from './state.js';
import { showCapturedProducts, showFailedProductsDetails } from './ui.js';

const LOGP = '[NV TM]';

  function findProductElementForCode(targetCode) {
    const nodes = Array.from(document.querySelectorAll('.js-nautilus-AddtoCart, [data-product-code]'));
    if (!nodes.length) return null;
    const norm = s => String(s||'').toLowerCase();
    const t = norm(targetCode||'');
    let el = nodes.find(n => {
      const v = norm(n.getAttribute('data-product-code') || '');
      return v === t || v === (t + '_' ) || v.startsWith(t + '_');
    });
    if (el) return el;
    el = nodes.find(n => norm(n.getAttribute('data-product-code')||'').includes(t));
    return el || null;
  }

  function safeInnerText(ctx, sel) {
    const el = ctx && typeof ctx.querySelector === 'function' ? ctx.querySelector(sel) : null;
    return el ? (el.textContent || '').trim() : '';
  }

  function readQtyFromFormNear(el, defQty) {
    const form = (typeof el?.closest === 'function' ? el.closest('form') : null) || el?.parentElement?.querySelector('form') ||
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

export function captureProductData(quantity = 1) {
    const st = get();
    const personFromLine = st.currentEntry.person || '';
    const qtyFromLineRaw = st.currentEntry.qtyFromLine;
    const codeFromLine = st.currentEntry.codeFromLine || '';

    let el = document.querySelector('.js-nautilus-AddtoCart') || findProductElementForCode(codeFromLine) || document.querySelector('.product-main, .product-details');

    let qty = Math.max(1, parseInt(qtyFromLineRaw ?? String(quantity), 10) || 1);

    const fullProductCode = el?.getAttribute('data-product-code') || codeFromLine || '';
    const productCode = (fullProductCode.split('_')[0]) || fullProductCode;

    const form = el?.closest('form') ||
          document.querySelector(`form.add_to_cart_form input[name="productCodePost"][value="${fullProductCode}"]`)?.closest('form') ||
          document.querySelector('form.add_to_cart_form');

    if (form) {
        const qtyInput = form.querySelector('input.qtyList, input[name="qty"]');
        if (qtyInput) {
            const n = parseInt(qtyInput.value, 10);
            if (!isNaN(n) && n > qty) qty = n;
        }
    }

    const productData = {
        code: productCode,
        name: el?.getAttribute('data-product-name') || safeInnerText(el || document.body, '.product-name, h1, .product-details__name') || '',
        price: el?.getAttribute('data-product-price') || safeInnerText(el || document.body, '.price, .product-price, [data-product-price]') || '',
        catalogPrice: el?.getAttribute('data-product-catalog-price') || '',
        brand: el?.getAttribute('data-product-brand') || '',
        category: el?.getAttribute('data-product-category') || '',
        variant: el?.getAttribute('data-product-variant') || '',
        offerType: el?.getAttribute('data-product-offer-type') || '',
        quantity: qty,
        image: findProductImageUrl(el || document.body),
        person: personFromLine
    };

    let capturedProducts = st.capturedProducts.slice();
    capturedProducts.push(productData);
    setCaptured(capturedProducts);
    showCapturedProducts();
  };

export function captureVisibleFromGrid() {
    const cards = document.querySelectorAll('.js-nautilus-AddtoCart');
    let capturedProducts = get().capturedProducts.slice();
    let added = 0;

    cards.forEach(card => {
      const fullCode = card.getAttribute('data-product-code') || '';
      const code = (fullCode.split('_')[0]) || fullCode;
      if (!code) return;
      capturedProducts.push({
        code,
        name: card.getAttribute('data-product-name') || '',
        price: card.getAttribute('data-product-price') || '',
        catalogPrice: card.getAttribute('data-product-catalog-price') || '',
        brand: card.getAttribute('data-product-brand') || '',
        category: card.getAttribute('data-product-category') || '',
        variant: card.getAttribute('data-product-variant') || '',
        offerType: card.getAttribute('data-product-offer-type') || '',
        quantity: readQtyFromFormNear(card, 1),
        image: findProductImageUrl(card)
      });
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
      const st = get();
      const personFromLine = st.currentEntry.person || '';
      const qtyFromLineRaw = st.currentEntry.qtyFromLine || '1';
      const codeFromLine = st.currentEntry.codeFromLine || '';

      const el = findProductElementForCode(codeFromLine);
      const fullCode = el?.getAttribute('data-product-code') || codeFromLine || '';
      
      const productData = {
        code: (fullCode.split('_')[0]) || fullCode,
        name: el?.getAttribute('data-product-name') || safeInnerText(el || document.body, '.product-name, h1, .product-details__name') || '',
        price: el?.getAttribute('data-product-price') || safeInnerText(el || document.body, '.price, .product-price, [data-product-price]') || '',
        catalogPrice: el?.getAttribute('data-product-catalog-price') || '',
        brand: el?.getAttribute('data-product-brand') || '',
        category: el?.getAttribute('data-product-category') || '',
        variant: el?.getAttribute('data-product-variant') || '',
        offerType: el?.getAttribute('data-product-offer-type') || '',
        quantity: readQtyFromFormNear(el || null, Math.max(1, parseInt(qtyFromLineRaw, 10) || 1)),
        image: findProductImageUrl(el || document.body),
        person: personFromLine
      };

      let arr = st.failed.data.slice();
      arr.push(productData);
      setFailed(st.failed.text, arr);

      showFailedProductsDetails();
      log('info', 'Fallido capturado (datos)', productData);
    } catch (e) {
      log('warn', 'No fue posible capturar datos del fallido:', e);
    }
  };