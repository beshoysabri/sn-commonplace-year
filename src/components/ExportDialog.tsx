import { useState } from 'react';
import type { CommonplaceYear } from '../types/commonplace';
import { Modal } from './shared/Modal';
import { exportMarkdown } from '../lib/export-md';
import { exportCsv } from '../lib/export-csv';

// Heavy-deps (jsPDF, xlsx) lazy-loaded on demand to keep the main bundle lean.
// See vite's "chunks larger than 500 kB" warning.
interface PdfExportOptions {
  scope: 'all' | 'important' | 'by-theme' | 'by-source';
  includeReflections: boolean;
  includeSummary: boolean;
  includeIndexes: boolean;
  paperSize: 'a5' | 'letter';
  dedication?: string;
}

const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  scope: 'all',
  includeReflections: true,
  includeSummary: true,
  includeIndexes: true,
  paperSize: 'a5',
};

type Format = 'md-canonical' | 'md-readable' | 'csv' | 'xlsx' | 'pdf';

interface ExportDialogProps {
  data: CommonplaceYear;
  onClose: () => void;
}

export function ExportDialog({ data, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<Format>('pdf');
  const [scope, setScope] = useState<'all' | 'important'>('all');
  const [pdfOpts, setPdfOpts] = useState<PdfExportOptions>({
    ...DEFAULT_PDF_OPTIONS,
  });

  const handleExport = async () => {
    switch (format) {
      case 'md-canonical':
        exportMarkdown(data, { scope, variant: 'canonical' });
        break;
      case 'md-readable':
        exportMarkdown(data, { scope, variant: 'readable' });
        break;
      case 'csv':
        exportCsv(data, { scope });
        break;
      case 'xlsx': {
        const mod = await import('../lib/export-xlsx');
        mod.exportXlsx(data, { scope });
        break;
      }
      case 'pdf': {
        const mod = await import('../lib/export-pdf');
        mod.exportPdf(data, {
          ...pdfOpts,
          scope: scope === 'important' ? 'important' : pdfOpts.scope,
        });
        break;
      }
    }
    onClose();
  };

  const footer = (
    <div className="cp-modal-footer-actions">
      <div className="cp-modal-footer-spacer" />
      <button type="button" className="cp-btn cp-btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="cp-btn cp-btn-primary" onClick={handleExport}>
        Export
      </button>
    </div>
  );

  return (
    <Modal title="Export" size="md" onClose={onClose} footer={footer}>
      <div className="cp-lesson-form">
        <fieldset className="cp-form-field">
          <legend className="cp-form-label">Format</legend>
          <div className="cp-format-grid">
            <FormatRadio
              value="pdf"
              current={format}
              onChange={setFormat}
              label="PDF"
              hint="Typeset book of your year"
            />
            <FormatRadio
              value="md-canonical"
              current={format}
              onChange={setFormat}
              label="Markdown (canonical)"
              hint="Round-trips the commonplace format"
            />
            <FormatRadio
              value="md-readable"
              current={format}
              onChange={setFormat}
              label="Markdown (readable)"
              hint="Blog-friendly, no metadata tags"
            />
            <FormatRadio
              value="csv"
              current={format}
              onChange={setFormat}
              label="CSV"
              hint="One row per lesson"
            />
            <FormatRadio
              value="xlsx"
              current={format}
              onChange={setFormat}
              label="Excel (.xlsx)"
              hint="Multi-sheet workbook"
            />
          </div>
        </fieldset>

        <fieldset className="cp-form-field">
          <legend className="cp-form-label">Scope</legend>
          <label className="cp-form-radio">
            <input
              type="radio"
              name="scope"
              checked={scope === 'all'}
              onChange={() => setScope('all')}
            />
            <span>All lessons</span>
          </label>
          <label className="cp-form-radio">
            <input
              type="radio"
              name="scope"
              checked={scope === 'important'}
              onChange={() => setScope('important')}
            />
            <span>Important only (your canon)</span>
          </label>
        </fieldset>

        {format === 'pdf' && (
          <fieldset className="cp-form-field cp-pdf-options">
            <legend className="cp-form-label">PDF options</legend>
            <label className="cp-form-radio">
              <input
                type="checkbox"
                checked={pdfOpts.includeReflections}
                onChange={(e) =>
                  setPdfOpts((p) => ({
                    ...p,
                    includeReflections: e.target.checked,
                  }))
                }
              />
              <span>Include reflections</span>
            </label>
            <label className="cp-form-radio">
              <input
                type="checkbox"
                checked={pdfOpts.includeSummary}
                onChange={(e) =>
                  setPdfOpts((p) => ({
                    ...p,
                    includeSummary: e.target.checked,
                  }))
                }
              />
              <span>Include foreword / summary</span>
            </label>
            <label className="cp-form-radio">
              <input
                type="checkbox"
                checked={pdfOpts.includeIndexes}
                onChange={(e) =>
                  setPdfOpts((p) => ({
                    ...p,
                    includeIndexes: e.target.checked,
                  }))
                }
              />
              <span>Include indexes (people, themes, bibliography)</span>
            </label>
            <div className="cp-form-row-inline">
              <label className="cp-form-field">
                <span className="cp-form-label">Paper size</span>
                <select
                  className="cp-input"
                  value={pdfOpts.paperSize}
                  onChange={(e) =>
                    setPdfOpts((p) => ({
                      ...p,
                      paperSize: e.target.value as 'a5' | 'letter',
                    }))
                  }
                >
                  <option value="a5">A5</option>
                  <option value="letter">US Letter</option>
                </select>
              </label>
              <label className="cp-form-field cp-form-field-wide">
                <span className="cp-form-label">Dedication (optional)</span>
                <input
                  type="text"
                  className="cp-input"
                  value={pdfOpts.dedication ?? ''}
                  onChange={(e) =>
                    setPdfOpts((p) => ({
                      ...p,
                      dedication: e.target.value || undefined,
                    }))
                  }
                  placeholder="For my future self."
                />
              </label>
            </div>
          </fieldset>
        )}
      </div>
    </Modal>
  );
}

function FormatRadio({
  value,
  current,
  onChange,
  label,
  hint,
}: {
  value: Format;
  current: Format;
  onChange: (f: Format) => void;
  label: string;
  hint: string;
}) {
  const active = current === value;
  return (
    <label
      className={`cp-format-option ${active ? 'active' : ''}`}
      onClick={() => onChange(value)}
    >
      <input
        type="radio"
        name="format"
        value={value}
        checked={active}
        onChange={() => onChange(value)}
      />
      <div className="cp-format-option-body">
        <span className="cp-format-option-label">{label}</span>
        <span className="cp-format-option-hint">{hint}</span>
      </div>
    </label>
  );
}
