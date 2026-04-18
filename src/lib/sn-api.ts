/**
 * Standard Notes Component Relay — lightweight protocol-compliant integration.
 *
 * CRITICAL: Message listeners are registered in the constructor (at module load),
 * NOT in initialize(). SN sends `component-registered` during iframe load, often
 * before React mounts. If we wait for useEffect → initialize(), we miss it entirely,
 * causing all saves to queue and never persist.
 */

import { refreshSnThemeType } from './theme-bridge';

type ContentCallback = (text: string) => void;
type ReplyCallback = (data: unknown) => void;

interface SNItemContent {
  text: string;
  preview_plain?: string;
  preview_html?: string;
  appData?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SNItem {
  uuid: string;
  content_type: string;
  content: SNItemContent;
  isMetadataUpdate?: boolean;
  [key: string]: unknown;
}

interface SentMessage {
  action: string;
  callback: ReplyCallback;
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const debugLines: string[] = [];
function debugLog(msg: string) {
  const ts = new Date().toISOString().slice(11, 23);
  const line = `[${ts}] ${msg}`;
  debugLines.push(line);
  if (debugLines.length > 100) debugLines.shift();
  console.log('[CP-SN-API]', msg);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

class SNExtensionAPI {
  private sessionKey: string | null = null;
  private contentCallback: ContentCallback | null = null;
  private currentItem: SNItem | null = null;
  private origin = '*';
  private registered = false;
  private sentMessages: Map<string, SentMessage> = new Map();
  private pendingSaveText: string | null = null;
  private pendingItemText: string | null = null;

  constructor() {
    window.addEventListener('message', this.handleMessage);
    document.addEventListener('message', this.handleMessage as EventListener);
    debugLog('constructor: listeners registered at module load');
  }

  getDebugLog(): string[] {
    return [...debugLines];
  }

  initialize(callback: ContentCallback) {
    this.contentCallback = callback;
    debugLog('initialize() called');

    if (this.pendingItemText !== null) {
      const text = this.pendingItemText;
      this.pendingItemText = null;
      debugLog(`initialize: delivering buffered item (textLen=${text.length})`);
      callback(text);
    }
  }

  private handleMessage = (event: MessageEvent | Event) => {
    const msgEvent = event as MessageEvent;
    let data: unknown = msgEvent.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    if (!isRecord(data)) return;

    const action = typeof data.action === 'string' ? data.action : undefined;
    if (!action) return;

    debugLog(
      `RECV action=${action} hasOriginal=${!!data.original} hasData=${!!data.data}`,
    );

    switch (action) {
      case 'component-registered': {
        this.sessionKey =
          typeof data.sessionKey === 'string' ? data.sessionKey : null;
        this.origin = msgEvent.origin || '*';
        this.registered = true;

        debugLog(
          `registered: sessionKey=${this.sessionKey?.slice(0, 8) ?? 'none'}... origin=${this.origin}`,
        );

        const componentData = isRecord(data.componentData) ? data.componentData : {};
        const innerData = isRecord(data.data) ? data.data : {};
        const themeUrls: string[] = this.extractThemeUrls(componentData, innerData);
        this.activateThemes(themeUrls);

        this.postMessage('themes-activated', {});

        this.postMessage('stream-context-item', {}, (responseData) => {
          const item = this.extractItem(responseData);
          if (item) {
            debugLog(
              `item extracted: uuid=${item.uuid?.slice(0, 8)} textLen=${item.content?.text?.length ?? 0} isMetadata=${item.isMetadataUpdate}`,
            );
            if (!item.isMetadataUpdate) {
              this.setItem(item);
            }
          } else {
            debugLog('WARNING: no item found in callback data');
          }
        });
        break;
      }

      case 'themes': {
        const inner = isRecord(data.data) ? data.data : {};
        const urls = Array.isArray(inner.themes) ? (inner.themes as unknown[]) : [];
        this.activateThemes(urls.filter((u): u is string => typeof u === 'string'));
        break;
      }

      default: {
        if (!isRecord(data.original)) {
          debugLog(`unhandled action=${action} (no original)`);
          return;
        }
        const originalId =
          typeof data.original.messageId === 'string'
            ? data.original.messageId
            : undefined;
        if (originalId && this.sentMessages.has(originalId)) {
          const sent = this.sentMessages.get(originalId)!;
          if (sent.action === 'stream-context-item') {
            sent.callback(data.data);
          } else {
            this.sentMessages.delete(originalId);
          }
        }
        break;
      }
    }
  };

  private extractThemeUrls(componentData: Record<string, unknown>, innerData: Record<string, unknown>): string[] {
    const pick = (source: Record<string, unknown>): unknown =>
      source.activeThemeUrls;
    const raw = pick(componentData) ?? pick(innerData);
    if (!Array.isArray(raw)) return [];
    return raw.filter((u): u is string => typeof u === 'string');
  }

  private extractItem(data: unknown): SNItem | null {
    if (!isRecord(data)) return null;
    if (isRecord(data.item) && isRecord(data.item.content)) {
      return data.item as unknown as SNItem;
    }
    if (Array.isArray(data.items) && data.items.length > 0) {
      const first = data.items[0];
      if (isRecord(first) && isRecord(first.content)) {
        return first as unknown as SNItem;
      }
    }
    if (isRecord(data.content) && typeof data.uuid === 'string') {
      return data as unknown as SNItem;
    }
    return null;
  }

  private setItem(item: SNItem) {
    this.currentItem = item;
    const text = item.content.text || '';

    if (this.contentCallback) {
      this.contentCallback(text);
    } else {
      this.pendingItemText = text;
      debugLog('setItem: buffered (callback not ready yet)');
    }

    if (this.pendingSaveText !== null) {
      const saveText = this.pendingSaveText;
      this.pendingSaveText = null;
      debugLog('flushing pending save');
      this.saveText(saveText);
    }
  }

  saveText(text: string, previewPlainOverride?: string) {
    if (!this.currentItem) {
      debugLog(`saveText: queued (no currentItem yet) textLen=${text.length}`);
      this.pendingSaveText = text;
      return;
    }

    const preview =
      previewPlainOverride !== undefined
        ? previewPlainOverride
        : this.derivePreview(text);

    const updatedItem: SNItem = {
      ...this.currentItem,
      content: {
        ...this.currentItem.content,
        text,
        preview_plain: preview,
      },
    };

    this.currentItem = updatedItem;
    debugLog(
      `saveText: sending save-items uuid=${updatedItem.uuid?.slice(0, 8)} textLen=${text.length}`,
    );
    this.postMessage('save-items', { items: [updatedItem] });
  }

  private derivePreview(text: string): string {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('@') && l !== '---')
      .slice(0, 3)
      .map((l) => l.replace(/^[#*>\s"]+/, '').replace(/["]$/, ''));
    return lines.join(' | ').slice(0, 90);
  }

  private postMessage(
    action: string,
    data: Record<string, unknown>,
    callback?: ReplyCallback,
  ) {
    const messageId = generateUuid();
    if (callback) {
      this.sentMessages.set(messageId, { action, callback });
    }

    const msg = {
      action,
      data,
      messageId,
      sessionKey: this.sessionKey,
      api: 'component',
    };

    if (!this.registered) {
      debugLog(`postMessage BLOCKED (not registered): ${action}`);
      return;
    }

    const target = window.parent !== window ? window.parent : window;
    try {
      target.postMessage(msg, this.origin);
    } catch {
      target.postMessage(msg, '*');
    }
  }

  private activateThemes(urls: string[]) {
    document.querySelectorAll('link[data-sn-theme]').forEach((el) => el.remove());
    const pending: Promise<void>[] = [];
    for (const url of urls) {
      if (!url) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute('data-sn-theme', 'true');
      pending.push(
        new Promise((resolve) => {
          link.addEventListener('load', () => resolve());
          link.addEventListener('error', () => resolve());
        }),
      );
      document.head.appendChild(link);
    }
    // Pick up --sn-stylekit-theme-type once SN's sheets are parsed, so our
    // [data-sn-theme="dark"] rules mirror SN's theme exactly.
    if (pending.length === 0) {
      refreshSnThemeType();
    } else {
      Promise.all(pending).then(() => refreshSnThemeType());
    }
  }

  destroy() {
    this.contentCallback = null;
    this.pendingItemText = null;
    debugLog('destroy: callback cleared, listeners preserved');
  }
}

export const snApi = new SNExtensionAPI();
