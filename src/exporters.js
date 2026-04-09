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

  /**
   * Extrae lista de personas, unidades y subtotales en un HTML de formato Tabla 
   * optimizado para pegar en Excel/Google Sheets.
   * @param {Map<string, Product>} productMap
   */
  X.openSubtotalsTable = function openSubtotalsTable(productMap) {
    const groups = new Map();
    let globalTotal = 0; let globalQty = 0;

    productMap.forEach(p => {
      const person = String(p.person || '(Sin nombre)').trim();
      const q = Number(p.quantity || 1);
      const v = (U.parsePrice(p.price) || 0) * q;
      if (!groups.has(person)) groups.set(person, { name: person, units: 0, value: 0 });
      const g = groups.get(person);
      g.units += q; g.value += v;
      globalQty += q; globalTotal += v;
    });

    const sortedGroups = Array.from(groups.values()).sort((a,b) => a.name.localeCompare(b.name));
    const rows = sortedGroups.map(g => `
      <tr>
        <td style="padding:8px; border:1px solid #ccc;">${g.name}</td>
        <td style="padding:8px; border:1px solid #ccc; text-align:center;">${g.units}</td>
        <td style="padding:8px; border:1px solid #ccc; text-align:right;">${U.toMoney(g.value)}</td>
      </tr>
    `).join('');

    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Tabla de Subtotales</title>
<style>
  body{font-family:Arial,sans-serif;margin:24px;background:#fff;color:#222}
  table { border-collapse: collapse; width: 100%; max-width: 600px; margin-bottom: 20px; }
  th { background-color: #f5f5f5; padding: 10px; border: 1px solid #ccc; text-align: left; }
  .header{display:flex;gap:8px;align-items:center;margin-bottom:12px}
  .btn{padding:8px 12px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer}
</style></head>
<body>
  <div class="header">
    <button class="btn" id="copyBtn">Copiar Tabla</button>
    <button class="btn" onclick="window.close()">Cerrar</button>
  </div>
  <table id="subtotalsTable">
    <thead><tr><th>Persona</th><th style="text-align:center;">Unidades</th><th style="text-align:right;">Subtotal</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr style="font-weight:bold; background-color:#f9f9f9;">
      <td style="padding:8px; border:1px solid #ccc;">TOTAL</td>
      <td style="padding:8px; border:1px solid #ccc; text-align:center;">${globalQty}</td>
      <td style="padding:8px; border:1px solid #ccc; text-align:right;">${U.toMoney(globalTotal)}</td>
    </tr></tfoot>
  </table>
  <script>
    document.getElementById('copyBtn').addEventListener('click', () => {
      try { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(document.getElementById('subtotalsTable')); sel.removeAllRanges(); sel.addRange(range); document.execCommand('copy'); alert('Tabla copiada al portapapeles. Pégala en Excel o Docs.'); } catch (e) { alert('Error al copiar.'); }
    });
  </script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  /**
   * Exporta el estado actual a un archivo JSON local
   * @param {object} stateData 
   */
  X.exportBackup = function exportBackup(stateData) {
    const json = JSON.stringify(stateData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaventa-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
