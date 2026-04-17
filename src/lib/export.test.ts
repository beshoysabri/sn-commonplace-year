import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportCsv } from './export-csv';
import { exportMarkdown } from './export-md';
import { createSampleYear } from './data';

/**
 * Intercept the Blob constructor to capture what the exporter puts into
 * it — jsdom's Blob.prototype.text()/arrayBuffer() aren't implemented in
 * all versions, so we grab the underlying string parts directly.
 */
interface Capture {
  text: string;
  filename?: string;
}

function setupDownloadCapture(): {
  capture: Capture;
  restore: () => void;
} {
  const capture: Capture = { text: '' };
  const origBlob = globalThis.Blob;
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;
  const origClick = HTMLAnchorElement.prototype.click;

  class CapturingBlob {
    type: string;
    size: number;
    constructor(parts: BlobPart[] = [], opts?: BlobPropertyBag) {
      this.type = opts?.type ?? '';
      const text = parts
        .map((p) => (typeof p === 'string' ? p : ''))
        .join('');
      capture.text += text;
      this.size = text.length;
    }
  }
  (globalThis as unknown as { Blob: typeof Blob }).Blob =
    CapturingBlob as unknown as typeof Blob;

  URL.createObjectURL = () => 'blob:mocked';
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function click(
    this: HTMLAnchorElement,
  ) {
    capture.filename = this.download;
  };

  return {
    capture,
    restore() {
      (globalThis as unknown as { Blob: typeof Blob }).Blob = origBlob;
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
      HTMLAnchorElement.prototype.click = origClick;
    },
  };
}

function exportedText(capture: Capture): string {
  const text = capture.text;
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Count CSV rows respecting double-quoted newlines (RFC 4180). */
function csvRowCount(text: string): number {
  let inQuote = false;
  let rows = 1;
  for (const ch of text) {
    if (ch === '"') inQuote = !inQuote;
    else if (ch === '\n' && !inQuote) rows++;
  }
  if (text.endsWith('\n')) rows--;
  return rows;
}

describe('export — CSV', () => {
  let hook: ReturnType<typeof setupDownloadCapture>;
  beforeEach(() => {
    hook = setupDownloadCapture();
  });
  afterEach(() => hook.restore());

  it('emits one header row + one row per lesson (all scope)', async () => {
    const year = createSampleYear(2023);
    exportCsv(year);
    const text = exportedText(hook.capture);
    expect(csvRowCount(text)).toBe(1 + year.lessons.length);
    const header = text.split('\n', 1)[0];
    expect(header).toContain('number');
    expect(header).toContain('sources');
    expect(hook.capture.filename).toBe('commonplace-2023.csv');
  });

  it('important scope narrows to flagged lessons with -important suffix', async () => {
    const year = createSampleYear(2023);
    exportCsv(year, { scope: 'important' });
    const text = exportedText(hook.capture);
    expect(csvRowCount(text)).toBe(1 + 3);
    expect(hook.capture.filename).toBe('commonplace-2023-important.csv');
  });

  it('escapes cells containing commas or quotes', async () => {
    const year = createSampleYear(2023);
    exportCsv(year);
    const text = exportedText(hook.capture);
    const jungLine = text.split('\n').find((l) => l.startsWith('23#3'));
    expect(jungLine).toBeDefined();
    expect(jungLine!).toMatch(/"[^"]*ancient adept[^"]*"/);
  });
});

describe('export — Markdown', () => {
  let hook: ReturnType<typeof setupDownloadCapture>;
  beforeEach(() => {
    hook = setupDownloadCapture();
  });
  afterEach(() => hook.restore());

  it('canonical variant round-trips via the @commonplace parser', async () => {
    const year = createSampleYear(2023);
    exportMarkdown(year, { scope: 'all', variant: 'canonical' });
    const text = exportedText(hook.capture);
    expect(text.startsWith('@commonplace: year')).toBe(true);
    expect(hook.capture.filename).toBe('commonplace-2023.md');
  });

  it('readable variant produces headings and blockquotes', async () => {
    const year = createSampleYear(2023);
    exportMarkdown(year, { scope: 'all', variant: 'readable' });
    const text = exportedText(hook.capture);
    expect(text).toContain('# The Commonplace Book of 2023');
    expect(text).toContain('## 23#1');
    expect(text).toMatch(/> .*Hannibal/);
  });
});
