
import { log } from './utils.js';

const VERSION = 1;
const KEY = 'nv_state';
let suspendHook = false;
let currentState: AppState | null = null;

// Keep references to original Storage methods to avoid recursion
const _Storage = typeof Storage !== 'undefined' ? Storage : null;
const orig = {
  setItem: _Storage?.prototype?.setItem || null,
  getItem: _Storage?.prototype?.getItem || null,
  removeItem: _Storage?.prototype?.removeItem || null
};

function getStorage(key: string) {
  if (typeof GM_getValue !== 'undefined') {
    try {
      const val = GM_getValue(key);
      if (val !== undefined) return val;
    } catch (e) { log('warn', `GM_getValue error for ${key}`, e); }
  }
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function setStorage(key: string, val: string) {
  if (typeof GM_setValue !== 'undefined') {
    try { GM_setValue(key, val); } catch (e) { log('warn', `GM_setValue error for ${key}`, e); }
  }
  try { localStorage.setItem(key, val); } catch (e) { log('error', `localStorage setItem failed for ${key}`, e); }
}

function removeStorage(key: string) {
  if (typeof GM_deleteValue !== 'undefined') {
    try { GM_deleteValue(key); } catch (e) { log('warn', `GM_deleteValue error for ${key}`, e); }
  }
  try { localStorage.removeItem(key); } catch (e) { log('warn', `localStorage removeItem failed for ${key}`, e); }
}

function migrateLocalStorageToGM() {
  if (typeof GM_getValue === 'undefined' || typeof GM_setValue === 'undefined') return;
  try {
    if (!GM_getValue(KEY)) {
      let migrated = false;
      const localData = localStorage.getItem(KEY);
      if (localData) {
        GM_setValue(KEY, localData);
        migrated = true;
      }
      const legacyKeys = [
        'isMinimized', 'isPinned', 'windowPosition', 'isAddingProducts',
        'products', 'capturedProducts', 'failedProducts', 'failedProductsData',
        'currentPerson', 'currentQtyFromLine', 'currentCodeFromLine', 'nv_log_level'
      ];
      legacyKeys.forEach(k => {
        const v = localStorage.getItem(k);
        if (v !== null) { GM_setValue(k, v); migrated = true; }
      });
      if (migrated) log('info', 'Estado migrado de localStorage a Tampermonkey (GM_setValue)');
    }
  } catch (e) { log('error', 'Fallo al migrar datos a GM_setValue', e); }
}

function readLegacyJSON(key: string, fallback: any) {
  try { 
    const v = getStorage(key); 
    return v ? JSON.parse(v) : fallback; 
  } catch (e) { 
    log('warn', `Parse error for legacy key ${key}`, e);
    return fallback; 
  }
}

function readLegacyString(key: string, fallback: string) {
  try {
    const v = getStorage(key);
    return v == null ? fallback : String(v);
  } catch (e) { return fallback; }
}

function readLegacyBool(key: string, fallback: boolean) {
  try {
    const v = getStorage(key);
    return v == null ? fallback : (String(v) === 'true');
  } catch (e) { return fallback; }
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

function migrate(data: any): AppState {
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

function stateToLegacy(data: AppState | null) {
  if (!data) return;
  try {
    suspendHook = true;
    const st = data;
    const join = (arr: any) => (Array.isArray(arr) ? arr.join('\n') : '');
    setStorage('isMinimized', st.ui?.isMinimized ? 'true' : 'false');
    setStorage('isPinned', st.ui?.isPinned ? 'true' : 'false');
    if (st.ui?.windowPosition != null) {
      setStorage('windowPosition', JSON.stringify(st.ui.windowPosition));
    } else {
      removeStorage('windowPosition');
    }
    setStorage('isAddingProducts', st.flags?.isAddingProducts ? 'true' : 'false');
    setStorage('products', join(st.queue?.products));
    setStorage('capturedProducts', JSON.stringify(st.capturedProducts || []));
    setStorage('failedProducts', typeof st.failed?.text === 'string' ? st.failed.text : '');
    setStorage('failedProductsData', JSON.stringify(st.failed?.data || []));
    setStorage('currentPerson', st.currentEntry?.person || '');
    setStorage('currentQtyFromLine', st.currentEntry?.qtyFromLine || '1');
    setStorage('currentCodeFromLine', st.currentEntry?.codeFromLine || '');
  } catch (e) {
    log('error', 'Failed to save legacy state', e);
  } finally {
    suspendHook = false;
  }
}

function saveAggregate(data: AppState) {
  try {
    suspendHook = true;
    setStorage(KEY, JSON.stringify(data));
  } catch (e) {
    log('error', `Failed to save ${KEY} to Storage`, e);
  } finally {
    suspendHook = false;
  }
}

function handleLegacyWrite(key: string, value: string, removed: boolean) {
  if (suspendHook || !currentState) return;
  if (key === KEY) return; // ignore self
  try {
    const st = currentState;
    switch (key) {
      case 'isMinimized': st.ui.isMinimized = String(value) === 'true'; break;
      case 'isPinned': st.ui.isPinned = String(value) === 'true'; break;
      case 'windowPosition': st.ui.windowPosition = removed ? null : JSON.parse(String(value) || 'null'); break;
      case 'isAddingProducts': st.flags.isAddingProducts = String(value) === 'true'; break;
      case 'products': st.queue.products = removed ? [] : String(value || '').split('\n').map(s => s.trim()).filter(Boolean); break;
      case 'capturedProducts': st.capturedProducts = removed ? [] : (JSON.parse(String(value || '[]')) || []); break;
      case 'failedProducts': st.failed.text = removed ? '' : String(value || ''); break;
      case 'failedProductsData': st.failed.data = removed ? [] : (JSON.parse(String(value || '[]')) || []); break;
      case 'currentPerson': if (!st.currentEntry) st.currentEntry = { person: '', qtyFromLine: '1', codeFromLine: '' }; st.currentEntry.person = String(value || ''); break;
      case 'currentQtyFromLine': if (!st.currentEntry) st.currentEntry = { person: '', qtyFromLine: '1', codeFromLine: '' }; st.currentEntry.qtyFromLine = String(value || '1'); break;
      case 'currentCodeFromLine': if (!st.currentEntry) st.currentEntry = { person: '', qtyFromLine: '1', codeFromLine: '' }; st.currentEntry.codeFromLine = String(value || ''); break;
      default: return; // unhandled key
    }
    saveAggregate(st);
  } catch (e) {
    log('warn', `Error handling legacy write for key: ${key}`, e);
  }
}

function installHooks() {
  if (!_Storage || !orig.setItem || !orig.removeItem) return;
  try {
    if (!_Storage.prototype.__nvHooked) {
      Object.defineProperty(_Storage.prototype, '__nvHooked', { value: true, writable: false });
      const newSet = function(this: Storage, key: string, val: string){
        if (!orig.setItem) return;
        const r = orig.setItem.call(this, key, val);
        try { handleLegacyWrite(key, val, false); } catch (e) { log('debug', 'Hook newSet err', e); }
        return r;
      };
      const newRemove = function(this: Storage, key: string){
        if (!orig.removeItem) return;
        const r = orig.removeItem.call(this, key);
        try { handleLegacyWrite(key, '', true); } catch (e) { log('debug', 'Hook newRemove err', e); }
        return r;
      };
      _Storage.prototype.setItem = newSet;
      _Storage.prototype.removeItem = newRemove;
    }
  } catch (e) {
    log('warn', 'Failed to install Storage hooks', e);
  }
}

export function init() {
  migrateLocalStorageToGM();
  let st = null;
  try { 
    st = JSON.parse(getStorage(KEY) || 'null'); 
  } catch (e) { 
    log('warn', `Failed to parse aggregate state ${KEY}`, e);
    st = null; 
  }
  if (!st) st = legacyToState();
  st = migrate(st);
  currentState = st;
  saveAggregate(st);
  stateToLegacy(st);
  installHooks();
  return st;
}

export function get() { return currentState || null; }
export function getUI() { return currentState?.ui || { isMinimized: false, isPinned: false, windowPosition: null }; }

export function setUI(part: Partial<UIState>) {
  const st = currentState || legacyToState();
  st.ui = Object.assign({}, st.ui || {}, part || {});
  currentState = st; saveAggregate(st); stateToLegacy(st);
}

export function setFlags(part: Partial<AppState['flags']>) {
  const st = currentState || legacyToState();
  st.flags = Object.assign({}, st.flags || {}, part || {});
  currentState = st; saveAggregate(st); stateToLegacy(st);
}

export function setQueue(products: string[]) {
  const st = currentState || legacyToState();
  st.queue = { products: Array.isArray(products) ? products.slice() : [] };
  currentState = st; saveAggregate(st); stateToLegacy(st);
}

export function setCaptured(list: Product[]) {
  const st = currentState || legacyToState();
  st.capturedProducts = Array.isArray(list) ? list.slice() : [];
  currentState = st; saveAggregate(st); stateToLegacy(st);
}

export function setFailed(text: string, data: Product[]) {
  const st = currentState || legacyToState();
  st.failed = { text: String(text || ''), data: Array.isArray(data) ? data.slice() : [] };
  currentState = st; saveAggregate(st); stateToLegacy(st);
}

export function setCurrentEntry(part: Partial<AppState['currentEntry']>) {
  const st = currentState || legacyToState();
  st.currentEntry = Object.assign({}, st.currentEntry || { person: '', qtyFromLine: '1', codeFromLine: '' }, part || {});
  currentState = st; saveAggregate(st); stateToLegacy(st);
}

export function hardReset() {
  const keys = [
    KEY, 'isMinimized', 'isPinned', 'windowPosition', 'isAddingProducts',
    'products', 'capturedProducts', 'failedProducts', 'failedProductsData',
    'currentPerson', 'currentQtyFromLine', 'currentCodeFromLine', 'nv_log_level'
  ];
  suspendHook = true;
  try { keys.forEach(k => removeStorage(k)); } catch(e) { log('warn', 'Failed to clear keys on hard reset', e); }
  suspendHook = false;
  const st = migrate(legacyToState());
  currentState = st;
  saveAggregate(st);
  stateToLegacy(st);
}
