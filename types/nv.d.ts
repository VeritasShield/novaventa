declare module '*.css' {
  const content: string;
  export default content;
}

declare global {
  function GM_getValue(key: string, defaultValue?: any): any;
  function GM_setValue(key: string, value: any): void;
  function GM_deleteValue(key: string): void;
  function GM_xmlhttpRequest(details: any): any;

  interface Product {
    code: string;
    name?: string;
    price?: string;
    catalogPrice?: string;
    brand?: string;
    category?: string;
    variant?: string;
    offerType?: string;
    quantity: number;
    image?: string;
    person?: string;
  }

  interface UIState {
    isMinimized: boolean;
    isPinned: boolean;
    windowPosition: { left: string; top: string; width: string; height: string } | null;
  }

  interface AppState {
    version: number;
    ui: UIState;
    flags: { isAddingProducts: boolean };
    queue: { products: string[] };
    capturedProducts: Product[];
    failed: { text: string; data: Product[] };
    currentEntry: { person: string; qtyFromLine: string; codeFromLine: string };
  }

  interface Window {
    __nvUiObserverPaused?: boolean;
    __nvUiObserverTimer?: number | null;
    __nvUiObserver?: MutationObserver;
    __nvUiObserverTarget?: HTMLElement;
    __nvUiObserverOpts?: MutationObserverInit;
    __nvCooldownTimer?: number | null;
  }

  interface AppCallbacks {
    onStartAdding: (text: string) => void;
    onStopAdding?: () => void;
    onClearFailed: () => void;
    onClearCaptured: () => void;
    onInit?: () => void;
    onCaptureVisible?: () => void;
  }
}
export {};