// ==UserScript==
// @name         Automatización de Pedidos Novaventa — Full Plus (TM)
// @namespace    http://tampermonkey.net/
// @version      3.1.4
// @author
// @description  Vista para Docs (HTML/PNG recortado), UI flotante, captura ampliada, totales es-CO y atajos.
// @license      ISC
// @homepage     https://github.com/bemaisama/novaventa#readme
// @homepageURL  https://github.com/bemaisama/novaventa#readme
// @source       https://github.com/bemaisama/novaventa.git
// @supportURL   https://github.com/bemaisama/novaventa/issues
// @match        https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/*
// @match        https://oficinavirtual.novaventa.com/*
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(r=>{if(typeof GM_addStyle=="function"){GM_addStyle(r);return}const o=document.createElement("style");o.textContent=r,document.head.append(o)})(" :root{--nv-primary: #4CAF50;--nv-primary-hover: #45a049;--nv-bg: #f1f1f1;--nv-panel-bg: #fff;--nv-text: #333;--nv-subtext: #555;--nv-border: #ccc;--nv-card-border: #e0e0e0;--nv-thumb-border: #ddd;--nv-shadow: rgba(0,0,0,.3)}#productsInputContainer{position:fixed;top:100px;left:100px;width:380px;min-width:300px;min-height:220px;background-color:var(--nv-bg);padding:0;box-shadow:0 0 15px var(--nv-shadow);z-index:2147483647;border-radius:10px;font-family:Arial,sans-serif;overflow:hidden;display:flex;flex-direction:column}#productsInputContainer .titleBar{background-color:var(--nv-primary);color:#fff;cursor:move;padding:10px;display:flex;justify-content:space-between;align-items:center}#productsInputContainer .titleBar .title{font-size:16px;font-weight:700}#productsInputContainer .titleBar .buttons{display:flex;gap:5px}#productsInputContainer .titleBar button{background:none;border:none;color:#fff;font-size:18px;cursor:pointer}#productsInputContainer .content{display:flex;flex:1;overflow:hidden}#productsInputContainer .innerContainer{padding:15px;flex:1;overflow:auto}#productsInputContainer textarea{width:100%;border:1px solid var(--nv-border);border-radius:5px;padding:8px;resize:vertical;font-size:14px;box-sizing:border-box}#productsInputContainer button.actionButton{background-color:var(--nv-primary);color:#fff;border:none;padding:10px;margin-top:10px;width:100%;border-radius:5px;cursor:pointer;font-size:14px}#productsInputContainer button.actionButton:hover{background-color:var(--nv-primary-hover)}#productsInputContainer .productsContainer{margin-top:15px;border-top:1px solid var(--nv-border);padding-top:10px}#productsInputContainer .productsContainer h3{margin:0 0 10px;font-size:16px;color:var(--nv-text)}#productsInputContainer .productsContainer .productItem{margin-bottom:10px;border-bottom:1px solid var(--nv-card-border);padding-bottom:8px;display:grid;grid-template-columns:56px 1fr;gap:8px;align-items:start}#productsInputContainer .thumb{width:56px;height:56px;border-radius:6px;object-fit:cover;background:#fff;border:1px solid var(--nv-thumb-border)}#productsInputContainer .productsContainer .productItem p{margin:2px 0;font-size:13px;color:var(--nv-subtext)}#productsInputContainer .summary{margin:8px 0;font-size:13px}#minimizedBar{position:fixed;bottom:10px;left:10px;background-color:var(--nv-primary);color:#fff;padding:10px;box-shadow:0 0 10px #0003;z-index:2147483647;cursor:pointer;border-radius:5px;font-family:Arial,sans-serif}#capturedProductsPanel{width:320px;min-width:220px;background-color:var(--nv-panel-bg);border-left:1px solid var(--nv-border);padding:15px;display:flex;flex-direction:column}#capturedProductsContainer{flex:1;overflow-y:auto}#resizeHandle{width:15px;height:15px;background:transparent;position:absolute;bottom:0;right:0;cursor:se-resize}#nvCooldown{margin-top:10px;padding:8px 10px;border:1px dashed var(--nv-border);background:#fafafa;color:var(--nv-text);border-radius:6px;font-size:12px}.nv-toast{background:#fee;color:#900;border:1px solid #f5b5b5;padding:8px 10px;border-radius:6px;margin-top:8px;box-shadow:0 2px 8px #0000001f;max-width:320px;font-size:13px} ");

(function () {
  'use strict';

  var _a, _b, _c;
  const LOGP$1 = "[NV TM]";
  function waitForBody(maxMs = 1e4) {
    return new Promise((resolve, reject) => {
      if (document.body) return resolve();
      const t0 = performance.now();
      const iv = setInterval(() => {
        if (document.body) {
          clearInterval(iv);
          resolve();
        } else if (performance.now() - t0 > maxMs) {
          clearInterval(iv);
          reject(new Error("body timeout"));
        }
      }, 50);
    });
  }
  function parsePrice(val) {
    if (val == null) return 0;
    let s = String(val).trim();
    if (!s) return 0;
    try {
      s = s.replace(/\u00A0/g, " ");
    } catch (e) {
      console.debug(`${LOGP$1} parsePrice replace error`, e);
    }
    let negative = false;
    if (/^\(.*\)$/.test(s)) {
      negative = true;
      s = s.replace(/^[\(]|[\)]$/g, "");
    }
    if (/^-/.test(s)) {
      negative = true;
    }
    s = s.replace(/[^0-9.,'\-\s]/g, "");
    s = s.replace(/[\s']/g, "");
    if (!s) return 0;
    const hasDot = s.includes(".");
    const hasComma = s.includes(",");
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    function toNum(str) {
      const n = parseFloat(str);
      return isNaN(n) ? 0 : negative ? -n : n;
    }
    if (hasDot && hasComma) {
      if (lastDot > lastComma) {
        s = s.replace(/,/g, "");
      } else {
        s = s.replace(/\./g, "").replace(/,/g, ".");
      }
      return toNum(s);
    }
    if (!hasDot && hasComma) {
      const decLen = s.length - lastComma - 1;
      if (decLen === 3) {
        s = s.replace(/,/g, "");
        return toNum(s);
      } else {
        s = s.replace(/,/g, ".");
        return toNum(s);
      }
    }
    if (hasDot && !hasComma) {
      const decLen = s.length - lastDot - 1;
      if (decLen === 3) {
        s = s.replace(/\./g, "");
        return toNum(s);
      } else {
        return toNum(s);
      }
    }
    return toNum(s);
  }
  function toMoney(n) {
    const v = Math.round(Number(n) || 0);
    try {
      return v.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } catch (e) {
      return "$" + v.toLocaleString("es-CO");
    }
  }
  function parseEntryLine(line) {
    const s = String(line || "").trim();
    if (!s) return { code: "", quantity: "1", person: "" };
    const clean = (str) => String(str || "").replace(/[.,;:]+$/, "").trim();
    let m = s.match(/^(\S+?)\s*-\s*(\d+)(?:\s*(.*))?$/);
    if (m) return { code: clean(m[1]), quantity: clean(m[2]) || "1", person: clean(m[3]) };
    m = s.match(/^(\S+)(?:\s+(.*))?$/);
    return { code: clean(m == null ? void 0 : m[1]), quantity: "1", person: clean(m == null ? void 0 : m[2]) };
  }
  function findProductCard(el) {
    if (!el || typeof el.closest !== "function") return null;
    return el.closest('.cardproduct, [class*="cardproduct"]') || el.closest(".col-xs-12");
  }
  function findProductImageUrl(ctx) {
    let card = findProductCard(ctx);
    if (card) {
      let img = card.querySelector("img[data-image]") || card.querySelector(".cardproduct__img img") || card.querySelector("img");
      if (img) return img.getAttribute("data-image") || img.getAttribute("src") || "";
    }
    let detailImg = document.querySelector(".product-main img[data-image], .product-main img, .js-image-tdp-notFound, .product-details img");
    if (detailImg) return detailImg.getAttribute("data-image") || detailImg.getAttribute("src") || "";
    let anyImg = document.querySelector('img[src*="/images/"], img[src*="cdn"], img[src*=".webp"], img[src*=".jpg"], img[src*=".png"]');
    return anyImg ? anyImg.getAttribute("data-image") || anyImg.src || "" : "";
  }
  function dedupeProducts(list, { perPerson = false } = {}) {
    const map = /* @__PURE__ */ new Map();
    const norm = (s) => String(s || "").trim().replace(/\s+/g, " ");
    list.forEach((p) => {
      const code = p.code || "N/A";
      const person = perPerson ? norm(p.person) : "";
      const key = perPerson ? `${code}@@${person}` : code;
      if (map.has(key)) {
        const acc = map.get(key);
        acc.quantity += Number(p.quantity || 1);
        acc.name || (acc.name = p.name);
        acc.price || (acc.price = p.price);
        acc.catalogPrice || (acc.catalogPrice = p.catalogPrice);
        acc.image || (acc.image = p.image);
        acc.brand || (acc.brand = p.brand);
        acc.category || (acc.category = p.category);
        acc.variant || (acc.variant = p.variant);
        acc.offerType || (acc.offerType = p.offerType);
        acc.person = person;
      } else {
        map.set(key, { ...p, person, quantity: Number(p.quantity || 1) });
      }
    });
    return map;
  }
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomDelay = (minMs, maxMs) => delay(Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs);
  function drawLine(ctx, txt, x, y) {
    ctx.fillText(txt, x, y);
    return ctx.measureText(txt).width;
  }
  function drawWrap(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(/\s+/);
    let line = "", yy = y, maxUsed = 0;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + " ";
      if (ctx.measureText(test).width > maxWidth && n > 0) {
        ctx.fillText(line, x, yy);
        maxUsed = Math.max(maxUsed, ctx.measureText(line).width);
        line = words[n] + " ";
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, yy);
    maxUsed = Math.max(maxUsed, ctx.measureText(line).width);
    return { endY: yy, maxWidthUsed: maxUsed };
  }
  function reportError(message, { ctx = null, ui = true, level = "error", timeoutMs = 5e3 } = {}) {
    try {
      const prefix = LOGP$1 + " ";
      const payload = { message: String(message || ""), ctx };
      if (level === "warn") console.warn(prefix, payload);
      else console.error(prefix, payload);
    } catch (e) {
      console.error("Critical error in reportError logger", e);
    }
    if (!ui) return;
    try {
      let host = document.getElementById("nv_toast_container");
      if (!host) {
        host = document.createElement("div");
        host.id = "nv_toast_container";
        host.style.position = "fixed";
        host.style.top = "10px";
        host.style.right = "10px";
        host.style.zIndex = "2147483647";
        (document.body || document.documentElement).appendChild(host);
      }
      const toast = document.createElement("div");
      toast.className = "nv-toast";
      toast.style.marginBottom = "8px";
      toast.textContent = String(message || "Error");
      host.appendChild(toast);
      setTimeout(() => {
        try {
          toast.remove();
        } catch (e) {
          console.debug(`${LOGP$1} failed to remove toast`, e);
        }
      }, Math.max(1e3, timeoutMs | 0));
    } catch (e) {
      console.error(`${LOGP$1} failed to render error toast UI`, e);
    }
  }
  const LVL = { error: 0, warn: 1, info: 2, debug: 3 };
  function getLogLevel() {
    try {
      const v = (localStorage.getItem("nv_log_level") || "info").toLowerCase();
      return LVL[v] != null ? v : "info";
    } catch (e) {
      return "info";
    }
  }
  function setLogLevel(l) {
    try {
      localStorage.setItem("nv_log_level", String(l || "info"));
    } catch (e) {
      console.warn(`${LOGP$1} Failed to save log level to localStorage`, e);
    }
  }
  function log(level, ...args) {
    const cur = LVL[getLogLevel()];
    const want = LVL[(level || "info").toLowerCase()] ?? LVL.info;
    if (want > cur) return;
    const prefix = LOGP$1;
    try {
      if (want <= LVL.error) console.error(prefix, ...args);
      else if (want <= LVL.warn) console.warn(prefix, ...args);
      else if (want <= LVL.info) console.info(prefix, ...args);
      else console.debug(prefix, ...args);
    } catch (e) {
      console.error("Critical failure in logger", e);
    }
  }
  const VERSION = 1;
  const KEY = "nv_state";
  let suspendHook = false;
  let currentState = null;
  const _Storage = typeof Storage !== "undefined" ? Storage : null;
  const orig = {
    setItem: ((_a = _Storage == null ? void 0 : _Storage.prototype) == null ? void 0 : _a.setItem) || null,
    getItem: ((_b = _Storage == null ? void 0 : _Storage.prototype) == null ? void 0 : _b.getItem) || null,
    removeItem: ((_c = _Storage == null ? void 0 : _Storage.prototype) == null ? void 0 : _c.removeItem) || null
  };
  function getStorage(key) {
    if (typeof GM_getValue !== "undefined") {
      try {
        const val = GM_getValue(key);
        if (val !== void 0) return val;
      } catch (e) {
        log("warn", `GM_getValue error for ${key}`, e);
      }
    }
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function setStorage(key, val) {
    if (typeof GM_setValue !== "undefined") {
      try {
        GM_setValue(key, val);
      } catch (e) {
        log("warn", `GM_setValue error for ${key}`, e);
      }
    }
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      log("error", `localStorage setItem failed for ${key}`, e);
    }
  }
  function removeStorage(key) {
    if (typeof GM_deleteValue !== "undefined") {
      try {
        GM_deleteValue(key);
      } catch (e) {
        log("warn", `GM_deleteValue error for ${key}`, e);
      }
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      log("warn", `localStorage removeItem failed for ${key}`, e);
    }
  }
  function migrateLocalStorageToGM() {
    if (typeof GM_getValue === "undefined" || typeof GM_setValue === "undefined") return;
    try {
      if (!GM_getValue(KEY)) {
        let migrated = false;
        const localData = localStorage.getItem(KEY);
        if (localData) {
          GM_setValue(KEY, localData);
          migrated = true;
        }
        const legacyKeys = [
          "isMinimized",
          "isPinned",
          "windowPosition",
          "isAddingProducts",
          "products",
          "capturedProducts",
          "failedProducts",
          "failedProductsData",
          "currentPerson",
          "currentQtyFromLine",
          "currentCodeFromLine",
          "nv_log_level"
        ];
        legacyKeys.forEach((k) => {
          const v = localStorage.getItem(k);
          if (v !== null) {
            GM_setValue(k, v);
            migrated = true;
          }
        });
        if (migrated) log("info", "Estado migrado de localStorage a Tampermonkey (GM_setValue)");
      }
    } catch (e) {
      log("error", "Fallo al migrar datos a GM_setValue", e);
    }
  }
  function readLegacyJSON(key, fallback) {
    try {
      const v = getStorage(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      log("warn", `Parse error for legacy key ${key}`, e);
      return fallback;
    }
  }
  function readLegacyString(key, fallback) {
    try {
      const v = getStorage(key);
      return v == null ? fallback : String(v);
    } catch (e) {
      return fallback;
    }
  }
  function readLegacyBool(key, fallback) {
    try {
      const v = getStorage(key);
      return v == null ? fallback : String(v) === "true";
    } catch (e) {
      return fallback;
    }
  }
  function legacyToState() {
    const productsStr = readLegacyString("products", "");
    const products = productsStr.split("\n").map((s) => s.trim()).filter(Boolean);
    const capturedProducts = readLegacyJSON("capturedProducts", []) || [];
    const failedText = readLegacyString("failedProducts", "");
    const failedData = readLegacyJSON("failedProductsData", []) || [];
    const isMinimized = readLegacyBool("isMinimized", false);
    const isPinned = readLegacyBool("isPinned", false);
    const windowPosition = readLegacyJSON("windowPosition", null);
    const isAddingProducts = readLegacyBool("isAddingProducts", false);
    const currentPerson = readLegacyString("currentPerson", "");
    const currentQtyFromLine = readLegacyString("currentQtyFromLine", "1");
    const currentCodeFromLine = readLegacyString("currentCodeFromLine", "");
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
    if (!data || typeof data !== "object") return legacyToState();
    if (!("version" in data)) data.version = 0;
    if (data.version < 1) {
      data.version = 1;
      data.ui = data.ui || { isMinimized: false, isPinned: false, windowPosition: null };
      data.flags = data.flags || { isAddingProducts: false };
      data.queue = data.queue || { products: [] };
      data.capturedProducts = data.capturedProducts || [];
      data.failed = data.failed || { text: "", data: [] };
      data.currentEntry = data.currentEntry || { person: "", qtyFromLine: "1", codeFromLine: "" };
    }
    return data;
  }
  function stateToLegacy(data) {
    var _a2, _b2, _c2, _d, _e, _f, _g, _h, _i, _j;
    if (!data) return;
    try {
      suspendHook = true;
      const st = data;
      const join = (arr) => Array.isArray(arr) ? arr.join("\n") : "";
      setStorage("isMinimized", ((_a2 = st.ui) == null ? void 0 : _a2.isMinimized) ? "true" : "false");
      setStorage("isPinned", ((_b2 = st.ui) == null ? void 0 : _b2.isPinned) ? "true" : "false");
      if (((_c2 = st.ui) == null ? void 0 : _c2.windowPosition) != null) {
        setStorage("windowPosition", JSON.stringify(st.ui.windowPosition));
      } else {
        removeStorage("windowPosition");
      }
      setStorage("isAddingProducts", ((_d = st.flags) == null ? void 0 : _d.isAddingProducts) ? "true" : "false");
      setStorage("products", join((_e = st.queue) == null ? void 0 : _e.products));
      setStorage("capturedProducts", JSON.stringify(st.capturedProducts || []));
      setStorage("failedProducts", typeof ((_f = st.failed) == null ? void 0 : _f.text) === "string" ? st.failed.text : "");
      setStorage("failedProductsData", JSON.stringify(((_g = st.failed) == null ? void 0 : _g.data) || []));
      setStorage("currentPerson", ((_h = st.currentEntry) == null ? void 0 : _h.person) || "");
      setStorage("currentQtyFromLine", ((_i = st.currentEntry) == null ? void 0 : _i.qtyFromLine) || "1");
      setStorage("currentCodeFromLine", ((_j = st.currentEntry) == null ? void 0 : _j.codeFromLine) || "");
    } catch (e) {
      log("error", "Failed to save legacy state", e);
    } finally {
      suspendHook = false;
    }
  }
  function saveAggregate(data) {
    try {
      suspendHook = true;
      setStorage(KEY, JSON.stringify(data));
    } catch (e) {
      log("error", `Failed to save ${KEY} to Storage`, e);
    } finally {
      suspendHook = false;
    }
  }
  function handleLegacyWrite(key, value, removed) {
    if (suspendHook || !currentState) return;
    if (key === KEY) return;
    try {
      const st = currentState;
      switch (key) {
        case "isMinimized":
          st.ui.isMinimized = String(value) === "true";
          break;
        case "isPinned":
          st.ui.isPinned = String(value) === "true";
          break;
        case "windowPosition":
          st.ui.windowPosition = removed ? null : JSON.parse(String(value) || "null");
          break;
        case "isAddingProducts":
          st.flags.isAddingProducts = String(value) === "true";
          break;
        case "products":
          st.queue.products = removed ? [] : String(value || "").split("\n").map((s) => s.trim()).filter(Boolean);
          break;
        case "capturedProducts":
          st.capturedProducts = removed ? [] : JSON.parse(String(value || "[]")) || [];
          break;
        case "failedProducts":
          st.failed.text = removed ? "" : String(value || "");
          break;
        case "failedProductsData":
          st.failed.data = removed ? [] : JSON.parse(String(value || "[]")) || [];
          break;
        case "currentPerson":
          if (!st.currentEntry) st.currentEntry = { person: "", qtyFromLine: "1", codeFromLine: "" };
          st.currentEntry.person = String(value || "");
          break;
        case "currentQtyFromLine":
          if (!st.currentEntry) st.currentEntry = { person: "", qtyFromLine: "1", codeFromLine: "" };
          st.currentEntry.qtyFromLine = String(value || "1");
          break;
        case "currentCodeFromLine":
          if (!st.currentEntry) st.currentEntry = { person: "", qtyFromLine: "1", codeFromLine: "" };
          st.currentEntry.codeFromLine = String(value || "");
          break;
        default:
          return;
      }
      saveAggregate(st);
    } catch (e) {
      log("warn", `Error handling legacy write for key: ${key}`, e);
    }
  }
  function installHooks() {
    if (!_Storage || !orig.setItem || !orig.removeItem) return;
    try {
      if (!_Storage.prototype.__nvHooked) {
        Object.defineProperty(_Storage.prototype, "__nvHooked", { value: true, writable: false });
        const newSet = function(key, val) {
          if (!orig.setItem) return;
          const r = orig.setItem.call(this, key, val);
          try {
            handleLegacyWrite(key, val, false);
          } catch (e) {
            log("debug", "Hook newSet err", e);
          }
          return r;
        };
        const newRemove = function(key) {
          if (!orig.removeItem) return;
          const r = orig.removeItem.call(this, key);
          try {
            handleLegacyWrite(key, "", true);
          } catch (e) {
            log("debug", "Hook newRemove err", e);
          }
          return r;
        };
        _Storage.prototype.setItem = newSet;
        _Storage.prototype.removeItem = newRemove;
      }
    } catch (e) {
      log("warn", "Failed to install Storage hooks", e);
    }
  }
  function init() {
    migrateLocalStorageToGM();
    let st = null;
    try {
      st = JSON.parse(getStorage(KEY) || "null");
    } catch (e) {
      log("warn", `Failed to parse aggregate state ${KEY}`, e);
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
  function get() {
    return currentState || null;
  }
  function getUI() {
    return (currentState == null ? void 0 : currentState.ui) || { isMinimized: false, isPinned: false, windowPosition: null };
  }
  function setUI(part) {
    const st = currentState || legacyToState();
    st.ui = Object.assign({}, st.ui || {}, part || {});
    currentState = st;
    saveAggregate(st);
    stateToLegacy(st);
  }
  function setFlags(part) {
    const st = currentState || legacyToState();
    st.flags = Object.assign({}, st.flags || {}, part || {});
    currentState = st;
    saveAggregate(st);
    stateToLegacy(st);
  }
  function setQueue(products) {
    const st = currentState || legacyToState();
    st.queue = { products: Array.isArray(products) ? products.slice() : [] };
    currentState = st;
    saveAggregate(st);
    stateToLegacy(st);
  }
  function setCaptured(list) {
    const st = currentState || legacyToState();
    st.capturedProducts = Array.isArray(list) ? list.slice() : [];
    currentState = st;
    saveAggregate(st);
    stateToLegacy(st);
  }
  function setFailed(text, data) {
    const st = currentState || legacyToState();
    st.failed = { text: String(text || ""), data: Array.isArray(data) ? data.slice() : [] };
    currentState = st;
    saveAggregate(st);
    stateToLegacy(st);
  }
  function setCurrentEntry(part) {
    const st = currentState || legacyToState();
    st.currentEntry = Object.assign({}, st.currentEntry || { person: "", qtyFromLine: "1", codeFromLine: "" }, part || {});
    currentState = st;
    saveAggregate(st);
    stateToLegacy(st);
  }
  function hardReset() {
    const keys = [
      KEY,
      "isMinimized",
      "isPinned",
      "windowPosition",
      "isAddingProducts",
      "products",
      "capturedProducts",
      "failedProducts",
      "failedProductsData",
      "currentPerson",
      "currentQtyFromLine",
      "currentCodeFromLine",
      "nv_log_level"
    ];
    suspendHook = true;
    try {
      keys.forEach((k) => removeStorage(k));
    } catch (e) {
      log("warn", "Failed to clear keys on hard reset", e);
    }
    suspendHook = false;
    const st = migrate(legacyToState());
    currentState = st;
    saveAggregate(st);
    stateToLegacy(st);
  }
  function renderSummary(totalQty, totalValueNumber) {
    const summary = document.createElement("div");
    summary.className = "summary";
    const money = toMoney(totalValueNumber || 0);
    const spanQty = document.createElement("span");
    const strongQty = document.createElement("strong");
    strongQty.textContent = "Total unidades:";
    spanQty.appendChild(strongQty);
    spanQty.appendChild(document.createTextNode(" " + String(totalQty)));
    const spacer = document.createTextNode("   ");
    const spanVal = document.createElement("span");
    const strongVal = document.createElement("strong");
    strongVal.textContent = "Total estimado:";
    spanVal.appendChild(strongVal);
    spanVal.appendChild(document.createTextNode(" " + money));
    summary.appendChild(spanQty);
    summary.appendChild(spacer);
    summary.appendChild(spanVal);
    return summary;
  }
  function renderProductItem(p, index, labelOrOpts) {
    const o = typeof labelOrOpts === "string" ? { label: labelOrOpts } : labelOrOpts || {};
    const label = o.label || (o.type === "failed" ? "Fallido" : "Producto");
    const item = document.createElement("div");
    item.className = "productItem";
    const img = document.createElement("img");
    img.className = "thumb";
    img.loading = "lazy";
    img.decoding = "async";
    const safeImg = String(p.image || "").trim();
    img.src = safeImg.toLowerCase().startsWith("javascript:") ? "" : safeImg;
    img.alt = String(p.name || "");
    img.onerror = function() {
      this.style.visibility = "hidden";
    };
    item.appendChild(img);
    const right = document.createElement("div");
    item.appendChild(right);
    const pTitle = document.createElement("p");
    const strongTitle = document.createElement("strong");
    strongTitle.textContent = String(label) + " " + String(index) + ":";
    pTitle.appendChild(strongTitle);
    if (o.type === "failed" || /fallido/i.test(String(label))) {
      const small = document.createElement("small");
      small.style.color = "#c00";
      small.textContent = " no agregado al carrito";
      pTitle.appendChild(document.createTextNode(" "));
      pTitle.appendChild(small);
    }
    right.appendChild(pTitle);
    const pCode = document.createElement("p");
    const sCode = document.createElement("strong");
    sCode.textContent = "Codigo:";
    pCode.appendChild(sCode);
    pCode.appendChild(document.createTextNode(" " + String(p.code || "")));
    if (p.quantity && p.quantity > 1) {
      const sx = document.createElement("strong");
      sx.textContent = " X" + String(p.quantity);
      pCode.appendChild(document.createTextNode(" "));
      pCode.appendChild(sx);
    }
    right.appendChild(pCode);
    const pName = document.createElement("p");
    const sName = document.createElement("strong");
    sName.textContent = "Nombre:";
    pName.appendChild(sName);
    pName.appendChild(document.createTextNode(" " + String(p.name ?? "")));
    right.appendChild(pName);
    const pPerson = document.createElement("p");
    const sPerson = document.createElement("strong");
    sPerson.textContent = "Persona:";
    pPerson.appendChild(sPerson);
    pPerson.appendChild(document.createTextNode(" " + String(p.person ?? "")));
    right.appendChild(pPerson);
    const pPrice = document.createElement("p");
    const sPrice = document.createElement("strong");
    sPrice.textContent = "Precio:";
    pPrice.appendChild(sPrice);
    const priceFmt = p.price ? toMoney(parsePrice(p.price)) : "";
    const catFmt = p.catalogPrice ? toMoney(parsePrice(p.catalogPrice)) : "";
    pPrice.appendChild(document.createTextNode(" " + priceFmt));
    if (catFmt) {
      const smallCat = document.createElement("small");
      smallCat.textContent = `(Cat: ${catFmt})`;
      pPrice.appendChild(document.createTextNode(" "));
      pPrice.appendChild(smallCat);
    }
    right.appendChild(pPrice);
    const pCat = document.createElement("p");
    const sCat = document.createElement("strong");
    sCat.textContent = "Categoria:";
    pCat.appendChild(sCat);
    pCat.appendChild(document.createTextNode(" " + String(p.category ?? "")));
    pCat.appendChild(document.createTextNode("  "));
    const sOff = document.createElement("strong");
    sOff.textContent = "Oferta:";
    pCat.appendChild(sOff);
    pCat.appendChild(document.createTextNode(" " + String(p.offerType ?? "")));
    right.appendChild(pCat);
    return item;
  }
  const _jpegCache = /* @__PURE__ */ new Map();
  async function loadImageBypassingCORS(url) {
    if (!url) throw new Error("Empty URL");
    const absoluteUrl = new URL(url, window.location.href).href;
    if (absoluteUrl.startsWith("data:")) {
      return await new Promise((res, rej) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => res(img);
        img.onerror = () => rej(new Error("Base64 image load failed"));
        img.src = absoluteUrl;
      });
    }
    try {
      return await new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.onload = () => res(img);
        img.onerror = () => rej(new Error("CORS image load failed"));
        img.src = absoluteUrl;
      });
    } catch (e1) {
      log("debug", `Primary image load failed, attempting CORS bypass: ${absoluteUrl}`);
    }
    let blob;
    if (typeof GM_xmlhttpRequest !== "undefined") {
      blob = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: absoluteUrl,
          responseType: "blob",
          timeout: 15e3,
          onload: (res) => res.status >= 200 && res.status < 300 ? resolve(res.response) : reject(new Error(`HTTP ${res.status}`)),
          onerror: (err) => reject(new Error("GM_xmlhttpRequest error: " + err)),
          ontimeout: () => reject(new Error("Timeout downloading image"))
        });
      });
    } else {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15e3);
      try {
        const r = await fetch(absoluteUrl, { mode: "cors", signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        blob = await r.blob();
      } finally {
        clearTimeout(id);
      }
    }
    const objUrl = URL.createObjectURL(blob);
    try {
      return await new Promise((res, rej) => {
        const i = new Image();
        i.decoding = "async";
        i.onload = () => res(i);
        i.onerror = () => rej(new Error("Blob image load failed"));
        i.src = objUrl;
      });
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  }
  async function _toJPEGDataURL(src, cssW = 88, cssH = 88, scale = 3, quality = 0.95, bg = "#ffffff") {
    let img;
    try {
      img = await loadImageBypassingCORS(src);
    } catch (e) {
      log("debug", `All load strategies failed for image: ${src}`, e);
      return src;
    }
    const outW = Math.max(1, Math.round(cssW * scale));
    const outH = Math.max(1, Math.round(cssH * scale));
    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, outW, outH);
    const r = Math.min(outW / img.naturalWidth, outH / img.naturalHeight);
    const dw = Math.round(img.naturalWidth * r);
    const dh = Math.round(img.naturalHeight * r);
    const dx = Math.round((outW - dw) / 2);
    const dy = Math.round((outH - dh) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
    return c.toDataURL("image/jpeg", quality);
  }
  async function toJPEGDataURL(src, cssW = 88, cssH = 88, { scale = 3, quality = 0.95, bg = "#ffffff" } = {}) {
    const key = `${src}|${cssW}|${cssH}|${scale}|${quality}|${bg}`;
    if (_jpegCache.has(key)) return await _jpegCache.get(key);
    const p = _toJPEGDataURL(src, cssW, cssH, scale, quality, bg).then((res) => {
      if (res === src) _jpegCache.delete(key);
      return res;
    });
    _jpegCache.set(key, p);
    return await p;
  }
  async function renderCardToPNG(p, i = 1) {
    const PAD = 18, IMG = 120;
    const W = 1100, H = 520;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    const imgX = PAD, imgY = PAD;
    let imgRight = imgX + IMG, imgBottom = imgY + IMG;
    let drewImage = false;
    if (p.image) {
      try {
        const img = await loadImageBypassingCORS(p.image);
        ctx.drawImage(img, imgX, imgY, IMG, IMG);
        drewImage = true;
      } catch (e) {
        drewImage = false;
        log("debug", "Failed to render image to PNG canvas", e);
      }
    }
    if (!drewImage) {
      ctx.fillStyle = "#f3f3f3";
      ctx.fillRect(imgX, imgY, IMG, IMG);
      ctx.strokeStyle = "#d0d0d0";
      ctx.strokeRect(imgX + 0.5, imgY + 0.5, IMG - 1, IMG - 1);
      ctx.fillStyle = "#999";
      ctx.font = "14px Arial";
      ctx.fillText("sin imagen", imgX + 40, imgY + IMG / 2 + 5);
    }
    const X0 = imgX + IMG + 20;
    let tRight = X0;
    let y = PAD + 10;
    ctx.fillStyle = "#111";
    ctx.font = "bold 16px Arial";
    tRight = Math.max(tRight, X0 + drawLine(ctx, `Producto ${i}`, X0, y));
    y += 28;
    ctx.font = "bold 18px Arial";
    const qtyTxt = p.quantity > 1 ? `  X${p.quantity}` : "";
    tRight = Math.max(tRight, X0 + drawLine(ctx, `Código: ${p.code || ""}${qtyTxt}`, X0, y));
    y += 28;
    ctx.font = "16px Arial";
    const wrap1 = drawWrap(ctx, `Nombre: ${p.name || ""}`, X0, y, W - X0 - PAD, 20);
    y = wrap1.endY;
    tRight = Math.max(tRight, X0 + wrap1.maxWidthUsed);
    y += 28;
    ctx.font = "16px Arial";
    const wrapP = drawWrap(ctx, `Persona: ${p.person || ""}`, X0, y, W - X0 - PAD, 20);
    y = wrapP.endY;
    tRight = Math.max(tRight, X0 + wrapP.maxWidthUsed);
    y += 28;
    const priceN = parsePrice(p.price), catN = parsePrice(p.catalogPrice);
    ctx.font = "16px Arial";
    const priceLine = `Precio: ${priceN ? toMoney(priceN) : ""}${catN ? `  (Cat: ${toMoney(catN)})` : ""}`;
    tRight = Math.max(tRight, X0 + drawLine(ctx, priceLine, X0, y));
    const textBottom = y + 1;
    const contentLeft = Math.min(imgX, X0);
    const contentTop = PAD;
    const contentRight = Math.max(imgRight, tRight);
    const contentBottom = Math.max(imgBottom, textBottom);
    const OUTPAD = 14;
    const sx = Math.max(0, contentLeft - OUTPAD);
    const sy = Math.max(0, contentTop - OUTPAD);
    const sw = Math.min(W - sx, contentRight - contentLeft + OUTPAD * 2);
    const sh = Math.min(H - sy, contentBottom - contentTop + OUTPAD * 2);
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(sw));
    out.height = Math.max(1, Math.round(sh));
    const octx = out.getContext("2d");
    if (!octx) throw new Error("Failed to get 2D context");
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height);
    octx.strokeStyle = "#e6e6e6";
    octx.strokeRect(0.5, 0.5, out.width - 1, out.height - 1);
    return out.toDataURL("image/png");
  }
  async function openPrintableDoc(productMap) {
    var _a2;
    let totalQty = 0;
    let totalValue = 0;
    productMap.forEach((p) => {
      const q = p.quantity || 1;
      const priceN = parsePrice(p.price);
      totalQty += q;
      totalValue += (priceN || 0) * q;
    });
    const norm = (s) => String(s || "").trim().replace(/\s+/g, " ");
    const allCaptured = ((_a2 = get()) == null ? void 0 : _a2.capturedProducts) || [];
    const groups = /* @__PURE__ */ new Map();
    allCaptured.forEach((p) => {
      const pname = norm(p.person);
      const key = pname || "(Sin nombre)";
      if (!groups.has(key)) groups.set(key, { name: pname || "(Sin nombre)", items: /* @__PURE__ */ new Map(), units: 0, value: 0 });
      const g = groups.get(key);
      const code = p.code || "N/A";
      const q = Number(p.quantity || 1);
      const v = (parsePrice(p.price) || 0) * q;
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
    const perPersonList = Array.from(groups.values()).filter((g) => g.name && g.name !== "(Sin nombre)").sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((g) => ({ name: g.name, units: g.units, value: g.value }));
    const buildCardHTML = async (p, idx) => {
      const price = p.price ? toMoney(parsePrice(p.price)) : "";
      const cat = p.catalogPrice ? toMoney(parsePrice(p.catalogPrice)) : "";
      const jpgSrc = p.image ? await toJPEGDataURL(p.image, 88, 88, { scale: 1.8, quality: 0.92 }) : "";
      return `
<div class="card" style="display:grid;grid-template-columns:88px 1fr;gap:8px;padding:8px;border:1px solid #e5e5e5;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.06);background:#fff;">
  <img src="${jpgSrc}" width="88" height="88" onerror="this.style.visibility='hidden'"
       style="width:88px;height:88px;object-fit:cover;border-radius:8px;border:1px solid #ddd;background:#fff;">
  <div>
    <p style="margin:0;line-height:1.15;font-size:13px;">
      <strong>Producto ${idx}</strong> – <strong>Código:</strong> ${p.code || ""} ${p.quantity > 1 ? `<strong>X${p.quantity}</strong>` : ""}
      <br><strong>Nombre:</strong> ${p.name || ""}
      <br><strong>Precio:</strong> ${price} ${cat ? `<small>(Cat: ${cat})</small>` : ""}
    </p>
  </div>
</div>`;
    };
    let bodyGridHTML = "";
    if (groups.size > 0) {
      const orderedGroups = Array.from(groups.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      const sections = await Promise.all(orderedGroups.map(async (g) => {
        const itemsArr = Array.from(g.items.values());
        const cards = await Promise.all(itemsArr.map((p, i) => buildCardHTML(p, i + 1)));
        return `
<section class="person-section" style="margin:12px 0 8px 0;">
  <p class="person-h" style="margin:0 0 6px 0;line-height:1.15;font-size:14px;font-weight:700;">
    ${g.name} – ${g.units} und – ${toMoney(g.value)}
  </p>
  <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">
    ${cards.join("\n")}
  </div>
</section>`;
      }));
      bodyGridHTML = sections.join("\n");
    } else {
      const itemsArr = Array.from(productMap.values());
      const cards = await Promise.all(itemsArr.map((p, i) => buildCardHTML(p, i + 1)));
      bodyGridHTML = `<div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">${cards.join("\n")}</div>`;
    }
    const perPersonHTML = perPersonList.length ? `
    <div class="perperson" style="margin:6px 0 8px 0;font-size:13px;">
      <p style="margin:0;line-height:1.15;"><strong>Totales por persona:</strong></p>
      ${perPersonList.map((x) => `
        <p style="margin:0;line-height:1.15;">• <span class="pp-name">${x.name}</span> – ${x.units} und – ${toMoney(x.value)}</p>
      `).join("")}
    </div>` : "";
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
  <\/script>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  async function openDocsPNG(productMap) {
    const promises = Array.from(productMap.values()).map(async (p, i) => {
      try {
        const dataURL = await renderCardToPNG(p, i + 1);
        return `<img src="${dataURL}" style="max-width:100%;display:block;margin:10px 0;border:1px solid #eee;border-radius:8px">`;
      } catch (e) {
        log("error", "PNG embed fail", { code: p.code, e });
        return `<div style="padding:12px;border:1px solid #eee;border-radius:8px;background:#fafafa">Sin imagen (no compatible)</div>`;
      }
    });
    const imgs = await Promise.all(promises);
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
    ${imgs.join("\n")}
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
  <\/script>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function openSubtotalsTable(productMap) {
    const groups = /* @__PURE__ */ new Map();
    let globalTotal = 0;
    let globalQty = 0;
    productMap.forEach((p) => {
      const person = String(p.person || "(Sin nombre)").trim();
      const q = Number(p.quantity || 1);
      const v = (parsePrice(p.price) || 0) * q;
      if (!groups.has(person)) groups.set(person, { name: person, units: 0, value: 0 });
      const g = groups.get(person);
      g.units += q;
      g.value += v;
      globalQty += q;
      globalTotal += v;
    });
    const sortedGroups = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
    const rows = sortedGroups.map((g) => `
      <tr>
        <td style="padding:8px; border:1px solid #ccc;">${g.name}</td>
        <td style="padding:8px; border:1px solid #ccc; text-align:center;">${g.units}</td>
        <td style="padding:8px; border:1px solid #ccc; text-align:right;">${toMoney(g.value)}</td>
      </tr>
    `).join("");
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
      <td style="padding:8px; border:1px solid #ccc; text-align:right;">${toMoney(globalTotal)}</td>
    </tr></tfoot>
  </table>
  <script>
    document.getElementById('copyBtn').addEventListener('click', () => {
      try { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(document.getElementById('subtotalsTable')); sel.removeAllRanges(); sel.addRange(range); document.execCommand('copy'); alert('Tabla copiada al portapapeles. Pégala en Excel o Docs.'); } catch (e) { alert('Error al copiar.'); }
    });
  <\/script>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function exportBackup(stateData) {
    const json = JSON.stringify(stateData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `novaventa-backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
  async function openFailedReport(productMap) {
    let totalQty = 0;
    const groups = /* @__PURE__ */ new Map();
    productMap.forEach((p) => {
      totalQty += Number(p.quantity || 1);
      const pname = String(p.person || "").trim().replace(/\s+/g, " ") || "(Sin nombre)";
      if (!groups.has(pname)) groups.set(pname, { name: pname, items: [] });
      groups.get(pname).items.push(p);
    });
    const buildCardHTML = async (p) => {
      const jpgSrc = p.image ? await toJPEGDataURL(p.image, 88, 88, { scale: 1.8, quality: 0.92 }) : "";
      return `
<div class="card" style="display:grid;grid-template-columns:88px 1fr;gap:8px;padding:8px;border:1px solid #f5c6c6;border-radius:10px;background:#fffafA;">
  <img src="${jpgSrc}" width="88" height="88" onerror="this.style.visibility='hidden'"
       style="width:88px;height:88px;object-fit:cover;border-radius:8px;border:1px solid #fcc;background:#fff;">
  <div>
    <p style="margin:0;line-height:1.15;font-size:13px;color:#333;">
      <strong>Código:</strong> ${p.code || ""} ${p.quantity > 1 ? `<strong style="color:#c00">X${p.quantity}</strong>` : ""}
      <br><strong>Nombre:</strong> ${p.name || ""}
      <br><span style="display:inline-block;margin-top:4px;padding:2px 6px;background:#fee;color:#c00;border-radius:4px;font-size:11px;font-weight:bold;">Agotado / No disponible</span>
    </p>
  </div>
</div>`;
    };
    let bodyGridHTML = "";
    if (groups.size > 0 && Array.from(groups.keys()).some((k) => k !== "(Sin nombre)")) {
      const orderedGroups = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
      const sections = await Promise.all(orderedGroups.map(async (g) => {
        const cards = await Promise.all(g.items.map((p) => buildCardHTML(p)));
        return `
<section class="person-section" style="margin:12px 0 8px 0;">
  <p class="person-h" style="margin:0 0 6px 0;line-height:1.15;font-size:14px;font-weight:700;color:#c00;">${g.name}</p>
  <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">${cards.join("\n")}</div>
</section>`;
      }));
      bodyGridHTML = sections.join("\n");
    } else {
      const itemsArr = Array.from(productMap.values());
      const cards = await Promise.all(itemsArr.map((p) => buildCardHTML(p)));
      bodyGridHTML = `<div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;">${cards.join("\n")}</div>`;
    }
    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Reporte de Agotados</title>
<style>
html,body,div,section,p{margin:0;padding:0} *{box-sizing:border-box}
body{font-family:Arial,sans-serif;margin:16px;background:#fafafa;color:#222;line-height:1.15}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:8px;flex-wrap:wrap}
.header .btn{padding:6px 10px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer}
@media print {.header{display:none}}
</style></head><body>
  <div class="header">
    <div><strong style="color:#c00;font-size:18px;">Reporte de Productos Agotados</strong></div>
    <div><button class="btn" id="copy">Copiar para WhatsApp/Docs</button></div>
  </div>
  <div id="content"><p style="margin-bottom:12px;font-size:14px;"><strong>Total de productos no disponibles:</strong> ${totalQty}</p>${bodyGridHTML}</div>
  <script>document.getElementById('copy').addEventListener('click', () => { try{ const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(document.getElementById('content')); sel.removeAllRanges(); sel.addRange(range); document.execCommand('copy'); alert('Copiado. Ahora pégalo en WhatsApp o Docs.'); } catch(e) { alert('Error al copiar.'); } });<\/script>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  let isDragging = false;
  let offsetX, offsetY;
  let isResizing = false;
  let appCallbacks$1 = {};
  function onMouseDown(e) {
    if (e.target.id === "resizeHandle") return;
    isDragging = true;
    const div = document.getElementById("productsInputContainer");
    if (!div) return;
    offsetX = e.clientX - div.getBoundingClientRect().left;
    offsetY = e.clientY - div.getBoundingClientRect().top;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
  function onMouseMove(e) {
    const div = document.getElementById("productsInputContainer");
    if (!div) return;
    if (isDragging) {
      const isPinned = getUI().isPinned;
      const scrollX = isPinned ? window.scrollX : 0;
      const scrollY = isPinned ? window.scrollY : 0;
      div.style.left = e.clientX - offsetX + scrollX + "px";
      div.style.top = e.clientY - offsetY + scrollY + "px";
    } else if (isResizing) {
      div.style.width = e.clientX - div.getBoundingClientRect().left + "px";
      div.style.height = e.clientY - div.getBoundingClientRect().top + "px";
    }
  }
  function onMouseUp() {
    isDragging = false;
    isResizing = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    const div = document.getElementById("productsInputContainer");
    if (!div) return;
    setUI({ windowPosition: { left: div.style.left, top: div.style.top, width: div.style.width, height: div.style.height } });
  }
  function onResizeMouseDown(e) {
    isResizing = true;
    e.preventDefault();
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
  function minimizeWindow() {
    const div = document.getElementById("productsInputContainer");
    const minimizedBar = document.getElementById("minimizedBar");
    if (!div || !minimizedBar) return;
    div.style.display = "none";
    minimizedBar.style.display = "block";
    setUI({ isMinimized: true });
  }
  function restoreWindow(callbacks) {
    const div = document.getElementById("productsInputContainer");
    const minimizedBar = document.getElementById("minimizedBar");
    if (!div || !minimizedBar) {
      setUI({ isMinimized: false });
      injectUI(callbacks);
      return;
    }
    div.style.display = "flex";
    minimizedBar.style.display = "none";
    setUI({ isMinimized: false });
  }
  function togglePin() {
    const div = document.getElementById("productsInputContainer");
    const pinButton = document.getElementById("pinButton");
    if (!div || !pinButton) return;
    const isPinned = !getUI().isPinned;
    const rect = div.getBoundingClientRect();
    if (isPinned) {
      div.style.position = "absolute";
      div.style.top = rect.top + window.scrollY + "px";
      div.style.left = rect.left + window.scrollX + "px";
    } else {
      div.style.position = "fixed";
      div.style.top = rect.top + "px";
      div.style.left = rect.left + "px";
    }
    pinButton.textContent = isPinned ? "Desfijar" : "Fijar";
    setUI({ isPinned, windowPosition: { left: div.style.left, top: div.style.top, width: div.style.width, height: div.style.height } });
  }
  function ensureMinimizedBar(callbacks) {
    let minimizedBar = document.getElementById("minimizedBar");
    const isMin = getUI().isMinimized;
    if (!minimizedBar) {
      minimizedBar = document.createElement("div");
      minimizedBar.id = "minimizedBar";
      minimizedBar.textContent = "Abrir panel de productos";
      minimizedBar.addEventListener("click", () => restoreWindow(callbacks));
      Object.assign(minimizedBar.style, {
        position: "fixed",
        bottom: "10px",
        left: "10px",
        backgroundColor: "#4CAF50",
        color: "#fff",
        padding: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        zIndex: "2147483647",
        cursor: "pointer",
        borderRadius: "5px",
        fontFamily: "Arial, sans-serif",
        display: isMin ? "block" : "none"
      });
      (document.body || document.documentElement).prepend(minimizedBar);
    } else {
      minimizedBar.style.display = isMin ? "block" : "none";
    }
  }
  function setCooldown(message, ms = 1500, onSkip = null) {
    const bar = document.getElementById("nvCooldown");
    if (!bar) return;
    bar.replaceChildren();
    const span = document.createElement("span");
    span.textContent = String(message || "");
    bar.appendChild(span);
    if (onSkip) {
      const sp = document.createElement("span");
      sp.textContent = "  ";
      bar.appendChild(sp);
      const btn = document.createElement("button");
      btn.textContent = "Saltar y continuar";
      btn.style.marginLeft = "6px";
      btn.addEventListener("click", onSkip);
      bar.appendChild(btn);
    }
    const timerSpan = document.createElement("span");
    timerSpan.style.marginLeft = "6px";
    bar.appendChild(timerSpan);
    bar.style.display = "block";
    const t0 = Date.now();
    if (window.__nvCooldownTimer) clearInterval(window.__nvCooldownTimer);
    window.__nvCooldownTimer = window.setInterval(() => {
      const left = Math.max(0, ms - (Date.now() - t0));
      timerSpan.textContent = ` (reintento en ${Math.ceil(left / 1e3)}s)`;
      if (left <= 0) clearInterval(window.__nvCooldownTimer);
    }, 200);
  }
  function hideCooldown() {
    const bar = document.getElementById("nvCooldown");
    if (bar) {
      bar.style.display = "none";
      bar.replaceChildren();
    }
    if (window.__nvCooldownTimer) {
      clearInterval(window.__nvCooldownTimer);
      window.__nvCooldownTimer = null;
    }
  }
  function injectUI(callbacks) {
    appCallbacks$1 = callbacks || {};
    try {
      window.__nvUiObserverPaused = true;
    } catch (e) {
      log("debug", "Failed to pause observer", e);
    }
    if (document.getElementById("productsInputContainer")) {
      ensureMinimizedBar(callbacks);
      const st2 = get();
      const isAdding = !!(st2 == null ? void 0 : st2.flags.isAddingProducts);
      const ta = document.getElementById("productsInput");
      if (ta) {
        ta.disabled = isAdding;
        if (document.activeElement !== ta) ta.value = ((st2 == null ? void 0 : st2.queue.products) || []).join("\n");
      }
      const startBtn = document.getElementById("startAdding");
      if (startBtn) startBtn.style.display = isAdding ? "none" : "block";
      const stopBtn2 = document.getElementById("stopAdding");
      if (stopBtn2) stopBtn2.style.display = isAdding ? "block" : "none";
      setTimeout(() => {
        try {
          window.__nvUiObserverPaused = false;
        } catch (e) {
          log("debug", "Failed to unpause observer", e);
        }
      }, 0);
      return;
    }
    ensureMinimizedBar(callbacks);
    const st = get();
    const uiSt = st.ui || {};
    const div = document.createElement("div");
    div.id = "productsInputContainer";
    div.style.display = uiSt.isMinimized ? "none" : "flex";
    div.style.position = uiSt.isPinned ? "absolute" : "fixed";
    div.style.top = "100px";
    div.style.left = "100px";
    div.style.width = "380px";
    div.style.minWidth = "300px";
    div.style.minHeight = "220px";
    div.style.backgroundColor = "#f1f1f1";
    div.style.boxShadow = "0 0 15px rgba(0,0,0,.3)";
    div.style.zIndex = "2147483647";
    div.style.borderRadius = "10px";
    div.style.overflow = "hidden";
    div.style.flexDirection = "column";
    if (uiSt.windowPosition) {
      if (uiSt.windowPosition.left) div.style.left = uiSt.windowPosition.left;
      if (uiSt.windowPosition.top) div.style.top = uiSt.windowPosition.top;
      if (uiSt.windowPosition.width) div.style.width = uiSt.windowPosition.width;
      if (uiSt.windowPosition.height) div.style.height = uiSt.windowPosition.height;
    }
    const titleBar = document.createElement("div");
    titleBar.className = "titleBar";
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "Automatizacion de Pedidos";
    titleBar.appendChild(title);
    const titleButtons = document.createElement("div");
    titleButtons.className = "buttons";
    const pinButton = document.createElement("button");
    pinButton.id = "pinButton";
    pinButton.textContent = uiSt.isPinned ? "Desfijar" : "Fijar";
    pinButton.addEventListener("click", togglePin);
    titleButtons.appendChild(pinButton);
    const minimizeButton = document.createElement("button");
    minimizeButton.textContent = "Minimizar";
    minimizeButton.addEventListener("click", minimizeWindow);
    titleButtons.appendChild(minimizeButton);
    try {
      const logButton = document.createElement("button");
      logButton.id = "nvLogButton";
      const refresh = () => {
        logButton.textContent = String(getLogLevel()).toLowerCase() === "debug" ? "Depurar" : "Registro";
      };
      refresh();
      logButton.addEventListener("click", () => {
        setLogLevel(String(getLogLevel()).toLowerCase() === "debug" ? "info" : "debug");
        refresh();
      });
      titleButtons.appendChild(logButton);
    } catch (e) {
      log("warn", "Failed to render log button", e);
    }
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Exportar";
    exportBtn.title = "Exportar historial y configuracion a JSON";
    exportBtn.addEventListener("click", () => {
      exportBackup(get());
    });
    titleButtons.appendChild(exportBtn);
    const hardResetBtn = document.createElement("button");
    hardResetBtn.textContent = "Reset";
    hardResetBtn.title = "Borrar todo el historial y configuracion";
    hardResetBtn.addEventListener("click", () => {
      if (confirm("¿Estas seguro de borrar TODO el historial de productos y la configuracion? Esta accion no se puede deshacer.")) {
        hardReset();
        window.location.reload();
      }
    });
    titleButtons.appendChild(hardResetBtn);
    titleBar.appendChild(titleButtons);
    titleBar.addEventListener("mousedown", onMouseDown);
    div.appendChild(titleBar);
    const contentContainer = document.createElement("div");
    contentContainer.className = "content";
    const innerContainer = document.createElement("div");
    innerContainer.className = "innerContainer";
    const textareaLabel = document.createElement("label");
    textareaLabel.textContent = "Lista de productos (codigo[-cantidad] persona):";
    innerContainer.appendChild(textareaLabel);
    const textarea = document.createElement("textarea");
    textarea.id = "productsInput";
    textarea.rows = 6;
    textarea.value = (st.queue.products || []).join("\n");
    textarea.disabled = !!st.flags.isAddingProducts;
    innerContainer.appendChild(textarea);
    const actionButtonsRow = document.createElement("div");
    actionButtonsRow.style.display = "flex";
    actionButtonsRow.style.gap = "8px";
    actionButtonsRow.style.marginTop = "10px";
    const btn = document.createElement("button");
    btn.id = "startAdding";
    btn.className = "actionButton";
    btn.textContent = "Agregar productos";
    btn.style.marginTop = "0";
    btn.style.display = st.flags.isAddingProducts ? "none" : "block";
    const stopBtn = document.createElement("button");
    stopBtn.id = "stopAdding";
    stopBtn.className = "actionButton";
    stopBtn.textContent = "Detener automatización";
    stopBtn.style.marginTop = "0";
    stopBtn.style.backgroundColor = "#d32f2f";
    stopBtn.style.display = st.flags.isAddingProducts ? "block" : "none";
    actionButtonsRow.appendChild(btn);
    actionButtonsRow.appendChild(stopBtn);
    innerContainer.appendChild(actionButtonsRow);
    const clearFailedBtn = document.createElement("button");
    clearFailedBtn.id = "clearFailedProducts";
    clearFailedBtn.className = "actionButton";
    clearFailedBtn.textContent = "Limpiar productos fallidos";
    innerContainer.appendChild(clearFailedBtn);
    const cooldownBar = document.createElement("div");
    cooldownBar.id = "nvCooldown";
    cooldownBar.style.display = "none";
    innerContainer.appendChild(cooldownBar);
    const failedProductsDiv = document.createElement("div");
    failedProductsDiv.id = "failedProductsContainer";
    failedProductsDiv.className = "productsContainer";
    const h3 = document.createElement("h3");
    h3.textContent = "Productos fallidos:";
    failedProductsDiv.appendChild(h3);
    const details = document.createElement("div");
    details.id = "failedProductsDetails";
    failedProductsDiv.appendChild(details);
    innerContainer.appendChild(failedProductsDiv);
    contentContainer.appendChild(innerContainer);
    const capturedProductsPanel = document.createElement("div");
    capturedProductsPanel.id = "capturedProductsPanel";
    const clearCapturedBtn = document.createElement("button");
    clearCapturedBtn.id = "clearCapturedProducts";
    clearCapturedBtn.className = "actionButton";
    clearCapturedBtn.textContent = "Limpiar productos capturados";
    capturedProductsPanel.appendChild(clearCapturedBtn);
    const capturedProductsDiv = document.createElement("div");
    capturedProductsDiv.id = "capturedProductsContainer";
    capturedProductsDiv.className = "productsContainer";
    capturedProductsPanel.appendChild(capturedProductsDiv);
    contentContainer.appendChild(capturedProductsPanel);
    div.appendChild(contentContainer);
    const resizeHandle = document.createElement("div");
    resizeHandle.id = "resizeHandle";
    resizeHandle.addEventListener("mousedown", onResizeMouseDown);
    div.appendChild(resizeHandle);
    (document.body || document.documentElement).prepend(div);
    btn.addEventListener("click", () => {
      var _a2;
      return (_a2 = callbacks.onStartAdding) == null ? void 0 : _a2.call(callbacks, textarea.value);
    });
    stopBtn.addEventListener("click", () => {
      var _a2;
      return (_a2 = callbacks.onStopAdding) == null ? void 0 : _a2.call(callbacks);
    });
    clearFailedBtn.addEventListener("click", () => {
      var _a2;
      return (_a2 = callbacks.onClearFailed) == null ? void 0 : _a2.call(callbacks);
    });
    clearCapturedBtn.addEventListener("click", () => {
      var _a2;
      return (_a2 = callbacks.onClearCaptured) == null ? void 0 : _a2.call(callbacks);
    });
    if (callbacks.onInit) callbacks.onInit();
    setTimeout(() => {
      try {
        window.__nvUiObserverPaused = false;
      } catch (e) {
        log("debug", "Failed to unpause observer", e);
      }
    }, 0);
  }
  function showCapturedProducts() {
    const capturedProductsDiv = document.getElementById("capturedProductsContainer");
    if (!capturedProductsDiv) return;
    let capturedProducts = get().capturedProducts.slice();
    if (capturedProducts.length === 0) {
      capturedProductsDiv.textContent = "";
      const p = document.createElement("p");
      p.textContent = "No hay productos capturados.";
      capturedProductsDiv.appendChild(p);
      return;
    }
    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.flexWrap = "wrap";
    controls.style.gap = "8px";
    controls.style.margin = "0 0 10px 0";
    const sortSelect = document.createElement("select");
    [
      { value: "", text: "Ordenar..." },
      { value: "name", text: "Nombre (A-Z)" },
      { value: "price", text: "Precio (asc)" },
      { value: "price_desc", text: "Precio (desc)" }
    ].forEach((o) => {
      const op = document.createElement("option");
      op.value = o.value;
      op.textContent = o.text;
      sortSelect.appendChild(op);
    });
    sortSelect.onchange = () => {
      const val = sortSelect.value;
      if (val === "name") capturedProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      if (val === "price") capturedProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      if (val === "price_desc") capturedProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      setCaptured(capturedProducts);
      showCapturedProducts();
    };
    controls.appendChild(sortSelect);
    const btnDocs = document.createElement("button");
    btnDocs.className = "actionButton";
    btnDocs.textContent = "Abrir vista para Docs (HTML)";
    btnDocs.onclick = () => {
      openPrintableDoc(dedupeProducts(capturedProducts));
    };
    controls.appendChild(btnDocs);
    const btnDocsPNG = document.createElement("button");
    btnDocsPNG.className = "actionButton";
    btnDocsPNG.textContent = "Copiar para Docs (PNG)";
    btnDocsPNG.onclick = async () => {
      await openDocsPNG(dedupeProducts(capturedProducts));
    };
    controls.appendChild(btnDocsPNG);
    const btnSubtotals = document.createElement("button");
    btnSubtotals.className = "actionButton";
    btnSubtotals.textContent = "Tabla de Subtotales";
    btnSubtotals.onclick = () => {
      openSubtotalsTable(dedupeProducts(capturedProducts, { perPerson: true }));
    };
    controls.appendChild(btnSubtotals);
    const btnRetry = document.createElement("button");
    btnRetry.className = "actionButton";
    btnRetry.textContent = "Reintentar fallidos → cola";
    btnRetry.onclick = () => {
      const st = get();
      const failed = (st.failed.text || "").trim();
      if (!failed) return alert("No hay fallidos");
      const arr = failed.split("\n").filter(Boolean);
      setQueue([...arr, ...st.queue.products]);
      setFailed("", []);
      alert(`Reinyectados ${arr.length} productos a la cola`);
      showFailedProductsDetails();
    };
    controls.appendChild(btnRetry);
    const btnCapture = document.createElement("button");
    btnCapture.className = "actionButton";
    btnCapture.textContent = "Capturar productos visibles";
    if (appCallbacks$1 && appCallbacks$1.onCaptureVisible) btnCapture.onclick = appCallbacks$1.onCaptureVisible;
    controls.appendChild(btnCapture);
    capturedProductsDiv.replaceChildren();
    capturedProductsDiv.appendChild(controls);
    const productMap = dedupeProducts(capturedProducts, { perPerson: true });
    let totalQty = 0;
    let totalValue = 0;
    productMap.forEach((p) => {
      totalQty += p.quantity;
      totalValue += parsePrice(p.price) * p.quantity;
    });
    const frag = document.createDocumentFragment();
    frag.appendChild(renderSummary(totalQty, totalValue));
    let index = 1;
    productMap.forEach((product) => {
      frag.appendChild(renderProductItem(product, index++, "Producto"));
    });
    capturedProductsDiv.appendChild(frag);
  }
  function showFailedProductsDetails() {
    const container = document.getElementById("failedProductsContainer");
    if (!container) return;
    let details = get().failed.data.slice();
    container.replaceChildren();
    const h3 = document.createElement("h3");
    h3.textContent = "Productos fallidos:";
    container.appendChild(h3);
    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.flexWrap = "wrap";
    controls.style.gap = "8px";
    controls.style.margin = "0 0 10px 0";
    const sortSelect = document.createElement("select");
    [
      { value: "", text: "Ordenar..." },
      { value: "name", text: "Nombre (A-Z)" },
      { value: "price", text: "Precio (asc)" },
      { value: "price_desc", text: "Precio (desc)" }
    ].forEach((o) => {
      const op = document.createElement("option");
      op.value = o.value;
      op.textContent = o.text;
      sortSelect.appendChild(op);
    });
    controls.appendChild(sortSelect);
    container.appendChild(controls);
    const btnReport = document.createElement("button");
    btnReport.className = "actionButton";
    btnReport.textContent = "Generar Reporte de Agotados";
    btnReport.onclick = async () => {
      if (openFailedReport) {
        btnReport.textContent = "Generando...";
        await openFailedReport(dedupeProducts(details, { perPerson: true }));
        btnReport.textContent = "Generar Reporte de Agotados";
      }
    };
    controls.appendChild(btnReport);
    const detailsDiv = document.createElement("div");
    detailsDiv.id = "failedProductsDetails";
    container.appendChild(detailsDiv);
    try {
      sortSelect.onchange = () => {
        const val = sortSelect.value;
        let data = get().failed.data.slice();
        if (val === "name") data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        if (val === "price") data.sort((a, b) => (parsePrice(a.price) || 0) - (parsePrice(b.price) || 0));
        if (val === "price_desc") data.sort((a, b) => (parsePrice(b.price) || 0) - (parsePrice(a.price) || 0));
        setFailed(get().failed.text, data);
        showFailedProductsDetails();
      };
    } catch (e) {
      log("warn", "Failed to bind failed products sort logic", e);
    }
    if (!details || details.length === 0) {
      detailsDiv.innerHTML = '<p style="margin:6px 0;color:#666;font-size:13px">No hay productos fallidos.</p>';
      return;
    }
    const productMap = dedupeProducts(details, { perPerson: true });
    let totalQty = 0;
    let totalValue = 0;
    productMap.forEach((p) => {
      const q = p.quantity || 1;
      totalQty += q;
      totalValue += (parsePrice(p.price) || 0) * q;
    });
    const frag = document.createDocumentFragment();
    frag.appendChild(renderSummary(totalQty, totalValue));
    let index = 1;
    productMap.forEach((p) => {
      frag.appendChild(renderProductItem(p, index++, { type: "failed", label: "Fallido" }));
    });
    detailsDiv.appendChild(frag);
  }
  function findProductElementForCode(targetCode) {
    var _a2;
    const t = String(targetCode || "").trim().toLowerCase();
    if (!t) return null;
    const cards = Array.from(document.querySelectorAll('[class*="product-item-card"], .cardproduct'));
    for (const card of cards) {
      const clNode = card.querySelector('[class*="details__cl"]');
      if (clNode) {
        const text = clNode.textContent || "";
        const match = text.match(/CL:\s*(\d+)/i);
        if (match && match[1] === t) return card;
      }
      const aNode = card.querySelector('a[href*="/p"]');
      if (aNode) {
        const href = aNode.getAttribute("href") || "";
        const match = href.match(/-(\d+)\/p/i);
        if (match && match[1] === t) return card;
      }
      const dpCode = card.getAttribute("data-product-code") || ((_a2 = card.querySelector("[data-product-code]")) == null ? void 0 : _a2.getAttribute("data-product-code"));
      if (dpCode && dpCode.toLowerCase().split("_")[0] === t) {
        return card;
      }
    }
    if (document.querySelector(".product-main, .product-details")) {
      return document.querySelector(".product-main, .product-details");
    }
    return null;
  }
  function getExactAddToCartButton(code) {
    const card = findProductElementForCode(code);
    if (!card) return null;
    const btns = Array.from(card.querySelectorAll("button"));
    for (const btn of btns) {
      const txt = (btn.textContent || "").trim().toLowerCase();
      if (!btn.hasAttribute("data-testid") && (txt.includes("agregar") || btn.className.includes("primary")) && !btn.disabled) {
        return btn;
      }
    }
    const oldSelectors = [
      '[data-action="ADD_TO_CART"]',
      'button[name="addToCart"]',
      "button.js-nautilus-addToCart",
      "button.add-to-cart",
      'form.add_to_cart_form button[type="submit"]',
      ".js-nautilus-AddtoCart button"
    ];
    for (const sel of oldSelectors) {
      const btn = card.querySelector(sel);
      if (btn && !btn.disabled) return btn;
    }
    return null;
  }
  function safeInnerText(ctx, sel) {
    const el = ctx && typeof ctx.querySelector === "function" ? ctx.querySelector(sel) : null;
    return el ? (el.textContent || "").trim() : "";
  }
  function readQtyFromFormNear(el, defQty) {
    var _a2;
    let qty = Math.max(1, parseInt(String(defQty), 10) || 1);
    if (!el) return qty;
    const newDOMInput = el.querySelector('input[data-testid="numeric-up-down-input"]');
    if (newDOMInput) {
      const n = parseInt(newDOMInput.value, 10);
      if (!isNaN(n) && n > qty) return n;
    }
    const form = (typeof el.closest === "function" ? el.closest("form") : null) || ((_a2 = el.parentElement) == null ? void 0 : _a2.querySelector("form")) || document.querySelector("form.add_to_cart_form");
    if (form) {
      const qtyInput = form.querySelector('input.qtyList, input[name="qty"]');
      if (qtyInput) {
        const n = parseInt(qtyInput.value, 10);
        if (!isNaN(n) && n > qty) return n;
      }
    }
    return qty;
  }
  function extractProductData(el, fallbackCode, qtyRaw, person) {
    var _a2, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    const clMatch = (_c2 = (_b2 = (_a2 = el == null ? void 0 : el.querySelector('[class*="details__cl"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.match(/CL:\s*(\d+)/i)) == null ? void 0 : _c2[1];
    const hrefMatch = (_f = (_e = (_d = el == null ? void 0 : el.querySelector('a[href*="/p"]')) == null ? void 0 : _d.getAttribute("href")) == null ? void 0 : _e.match(/-(\d+)\/p/i)) == null ? void 0 : _f[1];
    const dpMatch = (_g = el == null ? void 0 : el.getAttribute("data-product-code")) == null ? void 0 : _g.split("_")[0];
    const code = clMatch || hrefMatch || dpMatch || fallbackCode;
    const name = ((_i = (_h = el == null ? void 0 : el.querySelector('[class*="details__descripcion"]')) == null ? void 0 : _h.textContent) == null ? void 0 : _i.trim()) || safeInnerText(el, ".product-name, h1, .product-details__name") || (el == null ? void 0 : el.getAttribute("data-product-name")) || "";
    const price = ((_k = (_j = el == null ? void 0 : el.querySelector('[class*="dinero_precios__actual"]')) == null ? void 0 : _j.textContent) == null ? void 0 : _k.trim()) || ((_m = (_l = el == null ? void 0 : el.querySelector('[class*="puntos_valor-comercial__precio"]')) == null ? void 0 : _l.textContent) == null ? void 0 : _m.trim()) || safeInnerText(el, ".price, .product-price, [data-product-price]") || (el == null ? void 0 : el.getAttribute("data-product-price")) || "";
    const catalogPriceRaw = ((_n = el == null ? void 0 : el.querySelector('[class*="dinero_precio-lista"]')) == null ? void 0 : _n.textContent) || "";
    const catalogPrice = catalogPriceRaw.replace(/Precio lista/i, "").trim() || (el == null ? void 0 : el.getAttribute("data-product-catalog-price")) || "";
    const brand = ((_p = (_o = el == null ? void 0 : el.querySelector('[class*="details__marca"]')) == null ? void 0 : _o.textContent) == null ? void 0 : _p.trim()) || (el == null ? void 0 : el.getAttribute("data-product-brand")) || "";
    const qty = readQtyFromFormNear(el, Math.max(1, parseInt(qtyRaw, 10) || 1));
    let image = "";
    if (el) {
      const newImg = el.querySelector('img[class*="heading_image__img"]');
      if (newImg) image = newImg.getAttribute("src") || ((_q = newImg.getAttribute("srcset")) == null ? void 0 : _q.split(" ")[0]) || "";
    }
    if (!image && el) image = findProductImageUrl(el);
    return {
      code,
      name,
      price,
      catalogPrice,
      brand,
      category: (el == null ? void 0 : el.getAttribute("data-product-category")) || "",
      variant: (el == null ? void 0 : el.getAttribute("data-product-variant")) || "",
      offerType: (el == null ? void 0 : el.getAttribute("data-product-offer-type")) || "",
      quantity: qty,
      image,
      person
    };
  }
  function captureProductData(quantity = 1) {
    const st = get();
    const personFromLine = st.currentEntry.person || "";
    const qtyFromLineRaw = st.currentEntry.qtyFromLine;
    const codeFromLine = st.currentEntry.codeFromLine || "";
    const el = findProductElementForCode(codeFromLine);
    const productData = extractProductData(el, codeFromLine, qtyFromLineRaw ?? String(quantity), personFromLine);
    let capturedProducts = st.capturedProducts.slice();
    capturedProducts.push(productData);
    setCaptured(capturedProducts);
    showCapturedProducts();
  }
  function captureVisibleFromGrid() {
    const cards = Array.from(document.querySelectorAll('[class*="product-item-card"], .js-nautilus-AddtoCart'));
    let capturedProducts = get().capturedProducts.slice();
    let added = 0;
    cards.forEach((card) => {
      const pd = extractProductData(card, "", "1", "");
      if (!pd.code) return;
      capturedProducts.push(pd);
      added++;
    });
    if (added > 0) {
      setCaptured(capturedProducts);
      showCapturedProducts();
      log("info", `Capturados ${added} productos visibles del grid`);
      alert(`Capturados ${added} productos visibles`);
    } else {
      alert("No se encontraron productos visibles para capturar.");
    }
  }
  function captureFailedProductData() {
    try {
      const st = get();
      const personFromLine = st.currentEntry.person || "";
      const qtyFromLineRaw = st.currentEntry.qtyFromLine || "1";
      const codeFromLine = st.currentEntry.codeFromLine || "";
      const el = findProductElementForCode(codeFromLine);
      const productData = extractProductData(el, codeFromLine, qtyFromLineRaw, personFromLine);
      let arr = st.failed.data.slice();
      arr.push(productData);
      setFailed(st.failed.text, arr);
      showFailedProductsDetails();
      log("info", "Fallido capturado (datos)", productData);
    } catch (e) {
      log("warn", "No fue posible capturar datos del fallido:", e);
    }
  }
  const LOGP = "[NV TM]";
  async function processNextProduct() {
    var _a2, _b2, _c2;
    if (!((_a2 = get()) == null ? void 0 : _a2.flags.isAddingProducts)) return;
    const products = get().queue.products;
    if (products.length === 0) {
      setFlags({ isAddingProducts: false });
      injectUI(appCallbacks);
      alert("¡Todos los productos de la cola han sido procesados!");
      return;
    }
    const { code, quantity, person } = parseEntryLine(products[0]);
    if (!code) {
      handleError("Código de producto inválido.");
      return;
    }
    setCurrentEntry({ person: person || "", qtyFromLine: String(quantity || "1"), codeFromLine: String(code || "") });
    console.log(LOGP, `Procesando producto código ${code} cantidad ${quantity} persona "${person}"`);
    const searchToggleBtn = document.querySelector('button.site-header-content-ecommerce_option--search__lBgAH, button[aria-label*="buscador"]');
    let searchInput = document.querySelector('[data-testid="buscador-input"]');
    if (!searchInput && searchToggleBtn) {
      console.log(LOGP, "Buscador oculto, expandiendo...");
      searchToggleBtn.click();
      await randomDelay(300, 600);
      searchInput = document.querySelector('[data-testid="buscador-input"]');
    }
    if (searchInput) {
      const nativeInputValueSetter = (_b2 = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")) == null ? void 0 : _b2.set;
      nativeInputValueSetter == null ? void 0 : nativeInputValueSetter.call(searchInput, code);
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.dispatchEvent(new Event("change", { bubbles: true }));
      const searchBtn = ((_c2 = searchInput.form) == null ? void 0 : _c2.querySelector('button[type="submit"]')) || document.querySelector("button.buscador-input_form__btn__Ha2rK");
      if (searchBtn) searchBtn.click();
      else if (searchInput.form) searchInput.form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      setTimeout(() => checkForProductButton(0), 2e3);
    } else {
      const baseUrl = window.location.origin.includes("oficinavirtual.novaventa.com") ? "https://oficinavirtual.novaventa.com/search" : "https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/search";
      window.location.href = `${baseUrl}/?text=${encodeURIComponent(code)}`;
    }
  }
  async function checkForProductButton(attempts = 0) {
    var _a2, _b2;
    if (!((_a2 = get()) == null ? void 0 : _a2.flags.isAddingProducts)) return;
    if (window.location.href.includes("/homepage")) {
      handleError("Navegación incorrecta, redirigido a la página de inicio.");
      return;
    }
    const products = get().queue.products.slice();
    if (!products.length) {
      setFlags({ isAddingProducts: false });
      return;
    }
    const { code, quantity: quantitySpecified } = parseEntryLine(products[0] || "");
    const quantity = (quantitySpecified || "1").trim();
    const buttonToClick = getExactAddToCartButton(code);
    if (buttonToClick) {
      console.log(LOGP, "Botón encontrado, intentando agregar al carrito.");
      const quantityInt = Math.max(1, parseInt(quantity, 10) || 1);
      captureProductData(quantityInt);
      if (quantityInt > 1) {
        const card = buttonToClick.closest('[class*="product-item-card"], .cardproduct, .product-main, .product-details');
        const qtyInput = card == null ? void 0 : card.querySelector('input[data-testid="numeric-up-down-input"], input.qtyList, input[name="qty"]');
        if (qtyInput) {
          const nativeInputValueSetter = (_b2 = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")) == null ? void 0 : _b2.set;
          nativeInputValueSetter == null ? void 0 : nativeInputValueSetter.call(qtyInput, quantityInt.toString());
          qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
          qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
          await randomDelay(400, 700);
        } else {
          console.warn(LOGP, "Input de cantidad no encontrado, usando clics múltiples (fallback).");
          for (let i = 1; i < quantityInt; i++) {
            buttonToClick.click();
            await randomDelay(1500, 2500);
          }
        }
      }
      buttonToClick.click();
      await randomDelay(2500, 3500);
      console.log(LOGP, "Producto agregado correctamente al carrito.");
      products.shift();
      setQueue(products);
      processNextProduct();
    } else {
      if (attempts < 10) {
        console.warn(LOGP, `Intento ${attempts}: Botón AddToCart no encontrado. Reintentando...`);
        let isSkipped = false;
        try {
          setCooldown(`Buscando Botón (intento ${attempts + 1}/10)`, 1500, () => {
            isSkipped = true;
            try {
              const products2 = get().queue.products.slice();
              const skipped = products2.shift();
              setQueue(products2);
              const st = get();
              setFailed((st.failed.text || "") + (skipped || "") + "\n", st.failed.data);
              try {
                captureFailedProductData();
              } catch (e) {
                log("warn", "Failed to capture skipped product data", e);
              }
              reportError(`Producto saltado: ${skipped || ""}`, { ui: true, level: "warn", timeoutMs: 3e3 });
            } catch (e) {
              log("warn", "Failed to process skipped product", e);
            }
            hideCooldown();
            processNextProduct();
          });
        } catch (e) {
          log("debug", "Error during cooldown setup", e);
        }
        setTimeout(() => {
          var _a3;
          if (isSkipped) return;
          hideCooldown();
          if ((_a3 = get()) == null ? void 0 : _a3.flags.isAddingProducts) {
            checkForProductButton(attempts + 1);
          }
        }, 1500);
      } else {
        try {
          const hints = {
            url: location.href,
            onGrid: !!document.querySelector('.cardproduct, [class*="cardproduct"]'),
            onDetail: !!document.querySelector(".product-main, .product-details, .js-nautilus-AddtoCart"),
            hasForm: !!document.querySelector("form.add_to_cart_form")
          };
          reportError("No se encontró el botón de Agregar al carrito. ¿Estás en la página de detalle?", { ctx: hints, ui: true, level: "warn", timeoutMs: 7e3 });
        } catch (e) {
          log("debug", "Failed to generate hints for error report", e);
        }
        const products2 = get().queue.products.slice();
        const failedProduct = products2.shift();
        setQueue(products2);
        const st = get();
        const failedText = (st.failed.text || "") + (failedProduct || "") + "\n";
        setFailed(failedText, st.failed.data);
        showFailedProductsDetails();
        try {
          captureFailedProductData();
        } catch (e) {
          log("warn", "Failed to capture failed product data", e);
        }
        console.error(LOGP, "Botón AddToCart no encontrado tras múltiples intentos.");
        processNextProduct();
      }
    }
  }
  function handleError(errorMessage) {
    reportError(errorMessage, { ui: true, level: "error" });
    console.error(LOGP, errorMessage);
    setFlags({ isAddingProducts: false });
    injectUI(appCallbacks);
    alert(errorMessage);
  }
  const appCallbacks = {
    onStartAdding: (text) => {
      setFlags({ isAddingProducts: true });
      setQueue(text.split("\n").map((s) => s.trim()).filter(Boolean));
      injectUI(appCallbacks);
      processNextProduct();
    },
    onStopAdding: () => {
      setFlags({ isAddingProducts: false });
      injectUI(appCallbacks);
      alert("Automatización detenida por el usuario.");
    },
    onClearFailed: () => {
      setFailed("", []);
      showFailedProductsDetails();
    },
    onClearCaptured: () => {
      setCaptured([]);
      showCapturedProducts();
    },
    onInit: () => {
      showCapturedProducts();
      showFailedProductsDetails();
    },
    onCaptureVisible: captureVisibleFromGrid
  };
  (async () => {
    var _a2;
    try {
      init();
      await waitForBody();
      console.log(LOGP, "Arrancando en", location.href);
      injectUI(appCallbacks);
      setTimeout(() => injectUI(appCallbacks), 1200);
      setTimeout(() => {
        var _a3;
        if ((_a3 = get()) == null ? void 0 : _a3.flags.isAddingProducts) checkForProductButton();
      }, 1500);
      try {
        window.__nvUiObserverPaused = false;
      } catch (e) {
        log("debug", "Error resetting observer pause flag", e);
      }
      try {
        (_a2 = window.__nvUiObserver) == null ? void 0 : _a2.disconnect();
      } catch (e) {
        log("debug", "Error disconnecting observer", e);
      }
      const mo = new MutationObserver(() => {
        if (window.__nvUiObserverPaused) return;
        if (window.__nvUiObserverTimer) return;
        window.__nvUiObserverTimer = window.setTimeout(() => {
          try {
            window.__nvUiObserverTimer = null;
          } catch (e) {
            log("debug", "Error clearing timer flag", e);
          }
          if (!document.getElementById("productsInputContainer") || !document.getElementById("minimizedBar")) {
            console.log(LOGP, "UI/Barra no encontrada, reinsertando...");
            try {
              window.__nvUiObserverPaused = true;
              injectUI(appCallbacks);
            } finally {
              setTimeout(() => {
                try {
                  window.__nvUiObserverPaused = false;
                } catch (e) {
                  log("debug", "Error resetting observer pause flag", e);
                }
              }, 0);
            }
          }
        }, 250);
      });
      try {
        window.__nvUiObserver = mo;
        window.__nvUiObserverTarget = document.documentElement;
        window.__nvUiObserverOpts = { childList: true, subtree: true };
      } catch (e) {
        log("debug", "Error exposing observer to global", e);
      }
      mo.observe(document.documentElement, { childList: true, subtree: true });
      document.addEventListener("keydown", (e) => {
        var _a3, _b2;
        if (e.altKey && e.code === "KeyC") {
          e.preventDefault();
          captureVisibleFromGrid();
        }
        if (e.altKey && e.code === "KeyR") {
          e.preventDefault();
          (_a3 = document.getElementById("productsInputContainer")) == null ? void 0 : _a3.remove();
          (_b2 = document.getElementById("minimizedBar")) == null ? void 0 : _b2.remove();
          setUI({ isMinimized: false, windowPosition: null, isPinned: false });
          injectUI(appCallbacks);
          alert("UI reiniciada (Alt+R).");
        }
      });
    } catch (e) {
      console.error(LOGP, "Fallo de arranque:", e);
      try {
        injectUI(appCallbacks);
      } catch (err) {
        log("error", "Fallo crítico al inyectar UI en fallback", err);
      }
    }
  })();

})();