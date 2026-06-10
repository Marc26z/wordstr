// PressStr kind constants (defined in NIP.md)
export const KIND_MAGAZINE = 34609;
export const KIND_MAGAZINE_ISSUE = 39731;
export const KIND_EBOOK = 33953;

export interface MagazineData {
  d: string;
  title: string;
  image?: string;
  summary?: string;
  topics: string[];
  language?: string;
  url?: string;
  content: string;
}

export interface MagazineIssueData {
  d: string;
  title: string;
  issue: string;
  magazineCoord: string; // "34609:<pubkey>:<d>"
  image: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  fileHash?: string;
  /** BUD-10 blossom: URI for the file (includes xs= mirror hints) */
  blossomUri?: string;
  /** Additional mirror URLs for the file (one url tag per mirror) */
  mirrorUrls?: string[];
  summary?: string;
  publishedAt?: number;
  topics: string[];
  content: string;
}

export interface EbookData {
  d: string;
  title: string;
  image: string;
  fileUrl: string;
  mimeType: string;
  authors: string[];
  summary?: string;
  publishedAt?: number;
  fileSize?: number;
  fileHash?: string;
  /** BUD-10 blossom: URI for the file (includes xs= mirror hints) */
  blossomUri?: string;
  /** Additional mirror URLs for the file (one url tag per mirror) */
  mirrorUrls?: string[];
  topics: string[];
  language?: string;
  isbn?: string;
  content: string;
}

/** Slugify a string for use as a `d` tag */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

// Cache the promise so we only load PDF.js once
let pdfJsPromise: Promise<unknown> | null = null;

/**
 * Load PDF.js from CDN at runtime using a <script type="module"> injection.
 * This approach avoids bundler interception while working on all browsers
 * including iOS Safari (WKWebView). The worker is loaded inline as a blob
 * so it doesn't require an additional fetch.
 */
function loadPdfJs(): Promise<unknown> {
  if (pdfJsPromise) return pdfJsPromise;

  pdfJsPromise = new Promise((resolve, reject) => {
    // Check if already available on window (e.g. loaded by a previous script tag)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.__pdfjsLib) {
      resolve(win.__pdfjsLib);
      return;
    }

    // Use a <script type="module"> that imports the CDN module and stores it
    // on window so the outer Promise can pick it up.
    const nonce = `_pdfjs_cb_${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[nonce] = (lib: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__pdfjsLib = lib;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[nonce];
      resolve(lib);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[`${nonce}_err`] = (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[nonce];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[`${nonce}_err`];
      reject(err);
    };

    // Create a Blob URL for the inline module to satisfy CSP
    // (blob: is allowed in script-src, inline scripts are not)
    const code = `
      import * as pdfjs from '${PDFJS_CDN}';
      const lib = pdfjs.default ?? pdfjs;
      lib.GlobalWorkerOptions.workerSrc = '${PDFJS_WORKER_CDN}';
      window['${nonce}'](lib);
    `;
    const blob = new Blob([code], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    const script = document.createElement('script');
    script.type = 'module';
    script.src = blobUrl;
    script.onerror = (e) => {
      URL.revokeObjectURL(blobUrl);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)[`${nonce}_err`]?.(e);
    };
    // Clean up blob URL after script executes
    const origCallback = (window as any)[nonce] as (lib: unknown) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[nonce] = (lib: unknown) => {
      URL.revokeObjectURL(blobUrl);
      origCallback(lib);
    };
    document.head.appendChild(script);
  });

  return pdfJsPromise;
}

/**
 * Extract the first page of a PDF as a JPEG Blob using PDF.js loaded from CDN.
 * Works on all modern browsers including iOS Safari.
 */
export async function extractPdfCover(file: File): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = (await loadPdfJs()) as any;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // Scale so the rendered width is ~600px (portrait covers)
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2.5, 600 / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  await page.render({ canvasContext: ctx, viewport }).promise;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export canvas to JPEG'));
      },
      'image/jpeg',
      0.88,
    );
  });
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Compute SHA-256 hex hash of a File */
export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
