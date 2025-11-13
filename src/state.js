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

