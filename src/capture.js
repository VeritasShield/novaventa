(function(){
  const NVNS = (window.NV = window.NV || {});
  NVNS.capture = NVNS.capture || {};
  const C = NVNS.capture;
  const U = NVNS.utils;
  const S = NVNS.state;
  const LOGP = NVNS.LOGP || '[NV TM]';

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

  C.captureProductData = function captureProductData(quantity = 1) {
    const productElement = document.querySelector('.js-nautilus-AddtoCart');
    if (!productElement) return;

    const st = S.get();
    const personFromLine = st.currentEntry.person || '';
    const qtyFromLineRaw = st.currentEntry.qtyFromLine;
    let qty = Math.max(1, parseInt(qtyFromLineRaw ?? String(quantity), 10) || 1);

    const fullProductCode = productElement.getAttribute('data-product-code') || '';
    const productCode = (fullProductCode.split('_')[0]) || fullProductCode;

    const form = productElement.closest('form') ||
          document.querySelector(`form.add_to_cart_form input[name="productCodePost"][value="${fullProductCode}"]`)?.closest('form');
    if (form) {
        const qtyInput = form.querySelector('input.qtyList, input[name="qty"]');
        if (qtyInput) {
            const n = parseInt(qtyInput.value, 10);
            if (!isNaN(n) && n > qty) qty = n;
        }
    }

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
        image: U.findProductImageUrl(productElement),
        person: personFromLine
    };

    let capturedProducts = st.capturedProducts.slice();
    capturedProducts.push(productData);
    S.setCaptured(capturedProducts);
    if (NVNS.ui && NVNS.ui.showCapturedProducts) NVNS.ui.showCapturedProducts();
  };

  C.captureVisibleFromGrid = function captureVisibleFromGrid() {
    const cards = document.querySelectorAll('.js-nautilus-AddtoCart');
    let capturedProducts = S.get().capturedProducts.slice();
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
        image: U.findProductImageUrl(card)
      });
      added++;
    });

    if (added > 0) {
      S.setCaptured(capturedProducts);
      if (NVNS.ui && NVNS.ui.showCapturedProducts) NVNS.ui.showCapturedProducts();
      console.log(LOGP, `Capturados ${added} productos visibles del grid`);
      alert(`Capturados ${added} productos visibles`);
    } else {
      alert('No se encontraron productos visibles para capturar.');
    }
  };

  C.captureFailedProductData = function captureFailedProductData() {
    try {
      const st = S.get();
      const personFromLine = st.currentEntry.person || '';
      const qtyFromLineRaw = st.currentEntry.qtyFromLine || '1';
      const codeFromLine = st.currentEntry.codeFromLine || '';

      const el = findProductElementForCode(codeFromLine);
      const fullCode = el?.getAttribute('data-product-code') || codeFromLine || '';
      
      const productData = {
        code: (fullCode.split('_')[0]) || fullCode,
        name: el?.getAttribute('data-product-name') || safeInnerText('.product-name, h1, .product-details__name') || '',
        price: el?.getAttribute('data-product-price') || safeInnerText('.price, .product-price, [data-product-price]') || '',
        catalogPrice: el?.getAttribute('data-product-catalog-price') || '',
        brand: el?.getAttribute('data-product-brand') || '',
        category: el?.getAttribute('data-product-category') || '',
        variant: el?.getAttribute('data-product-variant') || '',
        offerType: el?.getAttribute('data-product-offer-type') || '',
        quantity: readQtyFromFormNear(el || null, Math.max(1, parseInt(qtyFromLineRaw, 10) || 1)),
        image: U.findProductImageUrl(el || document.body),
        person: personFromLine
      };

      let arr = st.failed.data.slice();
      arr.push(productData);
      S.setFailed(st.failed.text, arr);

      if (NVNS.ui && NVNS.ui.showFailedProductsDetails) NVNS.ui.showFailedProductsDetails();
      console.log(LOGP, 'Fallido capturado (datos)', productData);
    } catch (e) {
      console.warn(LOGP, 'No fue posible capturar datos del fallido:', e);
    }
  };
})();