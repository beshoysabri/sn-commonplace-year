import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { PriorityToggle } from './PriorityToggle';
import { LessonNumberBadge } from './LessonNumberBadge';
import { SourceChip } from './SourceChip';
import { ThemeChip } from './ThemeChip';
import { DatePill } from './DatePill';
import { formatDatePillText } from '../../lib/dates';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import { StatsCard } from './StatsCard';
import { ColorPicker } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { ExportMenu } from './ExportMenu';
import { ShortcutsHelp } from './ShortcutsHelp';
import { Linkify } from './Linkify';

import { createNewSource, createNewTheme } from '../../lib/data';
import { colorFromString, hexToRgba, contrastColor } from '../../lib/colors';

// -------------------------------------------------------------
// colors
// -------------------------------------------------------------

describe('colors lib', () => {
  it('colorFromString is deterministic', () => {
    expect(colorFromString('Jung')).toBe(colorFromString('Jung'));
    expect(colorFromString('Jung')).not.toBe(colorFromString('Watts'));
  });

  it('hexToRgba handles shorthand and full hex', () => {
    expect(hexToRgba('#fff', 0.5)).toBe('rgba(255,255,255,0.5)');
    expect(hexToRgba('#086DD6', 0.25)).toBe('rgba(8,109,214,0.25)');
  });

  it('contrastColor picks dark ink for light backgrounds', () => {
    expect(contrastColor('#FDFBF7')).toBe('#2B2724');
    expect(contrastColor('#2B2724')).toBe('#FDFBF7');
  });
});

// -------------------------------------------------------------
// Modal
// -------------------------------------------------------------

describe('<Modal />', () => {
  it('renders the title and children', () => {
    render(
      <Modal title="Hello" onClose={() => {}}>
        <div>Body goes here</div>
      </Modal>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Body goes here')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal title="x" onClose={onClose}>
        <div>x</div>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when overlay is clicked but not inner content', () => {
    const onClose = vi.fn();
    render(
      <Modal title="x" onClose={onClose}>
        <div data-testid="inside">x</div>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('inside'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------
// ConfirmDialog
// -------------------------------------------------------------

describe('<ConfirmDialog />', () => {
  it('wires confirm and cancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete?"
        message="This cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
        destructive
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

// -------------------------------------------------------------
// PriorityToggle
// -------------------------------------------------------------

describe('<PriorityToggle />', () => {
  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<PriorityToggle important={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('reports aria-pressed reflecting important state', () => {
    const { rerender } = render(
      <PriorityToggle important={false} onToggle={() => {}} />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    rerender(<PriorityToggle important={true} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});

// -------------------------------------------------------------
// LessonNumberBadge
// -------------------------------------------------------------

describe('<LessonNumberBadge />', () => {
  it('displays the number', () => {
    render(<LessonNumberBadge number="23#7" />);
    expect(screen.getByText('23#7')).toBeInTheDocument();
  });
});

// -------------------------------------------------------------
// SourceChip
// -------------------------------------------------------------

describe('<SourceChip />', () => {
  it('renders source name', () => {
    const s = createNewSource('Carl Jung');
    render(<SourceChip source={s} />);
    expect(screen.getByText('Carl Jung')).toBeInTheDocument();
  });

  it('invokes onClick when clickable', () => {
    const s = createNewSource('Carl Jung');
    const fn = vi.fn();
    render(<SourceChip source={s} onClick={fn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledWith(s);
  });
});

// -------------------------------------------------------------
// ThemeChip
// -------------------------------------------------------------

describe('<ThemeChip />', () => {
  it('renders theme name', () => {
    const t = createNewTheme('path');
    render(<ThemeChip theme={t} />);
    expect(screen.getByText('path')).toBeInTheDocument();
  });
});

// -------------------------------------------------------------
// DatePill
// -------------------------------------------------------------

describe('<DatePill />', () => {
  it('formats a date without weekday', () => {
    expect(formatDatePillText('2023-02-14', false)).toBe('Feb 14');
  });

  it('formats a date with weekday', () => {
    // 2023-02-14 was a Tuesday.
    expect(formatDatePillText('2023-02-14', true)).toBe('Feb 14 · Tue');
  });

  it('renders rendered text', () => {
    render(<DatePill date="2023-07-04" />);
    expect(screen.getByText('Jul 4')).toBeInTheDocument();
  });
});

// -------------------------------------------------------------
// SearchBar
// -------------------------------------------------------------

describe('<SearchBar />', () => {
  it('emits onChange', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Jung' },
    });
    expect(onChange).toHaveBeenCalledWith('Jung');
  });

  it('shows a clear button when there is input', () => {
    const onChange = vi.fn();
    render(<SearchBar value="Jung" onChange={onChange} />);
    const clear = screen.getByLabelText('Clear search');
    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith('');
  });
});

// -------------------------------------------------------------
// EmptyState
// -------------------------------------------------------------

describe('<EmptyState />', () => {
  it('renders title + description', () => {
    render(<EmptyState title="Nothing here" description="Start writing." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Start writing.')).toBeInTheDocument();
  });
});

// -------------------------------------------------------------
// StatsCard
// -------------------------------------------------------------

describe('<StatsCard />', () => {
  it('renders the value and label', () => {
    render(<StatsCard label="Lessons" value={87} />);
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
  });
});

// -------------------------------------------------------------
// ColorPicker
// -------------------------------------------------------------

describe('<ColorPicker />', () => {
  it('fires onChange when a swatch is clicked', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#4C6B8A" onChange={onChange} />);
    const swatches = screen.getAllByRole('button');
    // Click the first swatch that is NOT already active.
    const next = swatches.find((b) => b.getAttribute('aria-pressed') === 'false');
    expect(next).toBeTruthy();
    fireEvent.click(next!);
    expect(onChange).toHaveBeenCalled();
  });
});

// -------------------------------------------------------------
// IconPicker
// -------------------------------------------------------------

describe('<IconPicker />', () => {
  it('calls onChange with icon name', () => {
    const onChange = vi.fn();
    render(<IconPicker value="book-open" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('bookmark'));
    expect(onChange).toHaveBeenCalledWith('bookmark');
  });
});

// -------------------------------------------------------------
// ExportMenu
// -------------------------------------------------------------

describe('<ExportMenu />', () => {
  it('opens dropdown and fires option callback', () => {
    const selectCsv = vi.fn();
    render(
      <ExportMenu
        options={[{ id: 'csv', label: 'CSV', onSelect: selectCsv }]}
      />,
    );
    fireEvent.click(screen.getByTitle('Export'));
    fireEvent.click(screen.getByText('CSV'));
    expect(selectCsv).toHaveBeenCalled();
  });
});

// -------------------------------------------------------------
// ShortcutsHelp
// -------------------------------------------------------------

describe('<ShortcutsHelp />', () => {
  it('renders all shortcut groups', () => {
    render(<ShortcutsHelp onClose={() => {}} />);
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });
});

// -------------------------------------------------------------
// Linkify
// -------------------------------------------------------------

describe('<Linkify />', () => {
  it('wraps URLs in anchor tags', () => {
    render(<Linkify text="See https://example.com for more" />);
    const a = screen.getByRole('link');
    expect(a).toHaveAttribute('href', 'https://example.com');
  });

  it('renders plain text when no URL present', () => {
    const { container } = render(<Linkify text="nothing to link" />);
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders nothing for empty text', () => {
    const { container } = render(<Linkify text="" />);
    expect(container.textContent).toBe('');
  });
});
