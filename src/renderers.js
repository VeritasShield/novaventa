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


