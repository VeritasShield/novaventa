// Global types and NV namespace declarations for editor/TypeScript tooling

declare interface Product {
  code: string;
  name?: string;
  price?: string | number;
  catalogPrice?: string | number;
  category?: string;
  variant?: string;
  offerType?: string;
  quantity: number;
  image?: string;
  person?: string;
}

declare interface CapturedProduct extends Product {}

declare interface FailedProduct extends Product {}

declare namespace NV {
  const LOGP: string;

  namespace utils {
    function waitForBody(maxMs?: number): Promise<void>;
    function parsePrice(val: unknown): number;
    function toMoney(n: number | string): string;
    function parseEntryLine(line: string): { code: string; quantity: string; person: string };
    function findProductCard(el: Element | null): Element | null;
    function findProductImageUrl(ctx: Element | Document): string;
    function drawLine(ctx: CanvasRenderingContext2D, txt: string, x: number, y: number): number;
    function drawWrap(
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number
    ): { endY: number; maxWidthUsed: number };
  }

  namespace exporters {
    function toJPEGDataURL(
      src: string,
      cssW?: number,
      cssH?: number,
      opts?: { scale?: number; quality?: number; bg?: string }
    ): Promise<string>;

    function renderCardToPNG(p: Product, i?: number): Promise<string>;

    function openPrintableDoc(productMap: Map<string, Product>): Promise<void>;

    function openDocsPNG(productMap: Map<string, Product>): Promise<void>;
  }

  namespace state {
    interface UIState { isMinimized: boolean; isPinned: boolean; windowPosition: null | { left?: string; top?: string; width?: string; height?: string } }
    interface FlagsState { isAddingProducts: boolean }
    interface CurrentEntry { person: string; qtyFromLine: string; codeFromLine: string }
    interface AggregateState {
      version: number;
      ui: UIState;
      flags: FlagsState;
      queue: { products: string[] };
      capturedProducts: Product[];
      failed: { text: string; data: FailedProduct[] };
      currentEntry: CurrentEntry;
    }

    function init(): AggregateState;
    function get(): AggregateState | null;
    function getUI(): UIState;
    function setUI(partial: Partial<UIState>): void;
    function setFlags(partial: Partial<FlagsState>): void;
    function setQueue(products: string[]): void;
    function setCaptured(list: Product[]): void;
    function setFailed(text: string, data: FailedProduct[]): void;
  }

  namespace ui {
    function renderSummary(totalQty: number, totalValueNumber: number): HTMLDivElement;
    function renderProductItem(p: Product, index: number, opts?: { type?: 'captured' | 'failed' }): HTMLDivElement;
  }
}

export {};
