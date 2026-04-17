import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LessonModal } from './LessonModal';
import { createSampleYear, createNewLesson } from '../lib/data';

describe('<LessonModal />', () => {
  it('renders an existing lesson pre-filled', () => {
    const year = createSampleYear(2023);
    const lesson = year.lessons.find((l) => l.number === '23#2')!;
    render(
      <LessonModal
        lesson={lesson}
        data={year}
        onSave={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByDisplayValue('23#2')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('AUT VIAM INVENIAM AUT FACIAM'),
    ).toBeInTheDocument();
  });

  it('shows per-fragment editor when body has " / " separators', () => {
    const year = createSampleYear(2023);
    const lesson = year.lessons.find((l) => l.number === '23#2')!;
    render(
      <LessonModal
        lesson={lesson}
        data={year}
        onSave={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/5 fragments detected/i)).toBeInTheDocument();
  });

  it('does not show per-fragment editor for a single-quote lesson', () => {
    const year = createSampleYear(2023);
    const lesson = year.lessons.find((l) => l.number === '23#1')!;
    render(
      <LessonModal
        lesson={lesson}
        data={year}
        onSave={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByText(/fragments detected/i)).toBeNull();
  });

  it('calls onSave with updated lesson when user edits title and saves', () => {
    const year = createSampleYear(2023);
    const lesson = year.lessons.find((l) => l.number === '23#1')!;
    const onSave = vi.fn();
    render(
      <LessonModal
        lesson={lesson}
        data={year}
        onSave={onSave}
        onClose={() => {}}
      />,
    );
    const titleInput = screen.getByPlaceholderText(
      /one-line distillation|the path appears/i,
    );
    fireEvent.change(titleInput, { target: { value: 'A lesson title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledOnce();
    const [updated, patches] = onSave.mock.calls[0];
    expect(updated.title).toBe('A lesson title');
    expect(patches.newSources).toEqual([]);
  });

  it('marks a new lesson with the "New" label and "Create" button', () => {
    const year = createSampleYear(2023);
    const draft = createNewLesson('23#99');
    render(
      <LessonModal
        lesson={draft}
        data={year}
        isNew
        onSave={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('toggles important via the priority button', () => {
    const year = createSampleYear(2023);
    const lesson = year.lessons.find((l) => l.number === '23#1')!;
    const onSave = vi.fn();
    render(
      <LessonModal
        lesson={lesson}
        data={year}
        onSave={onSave}
        onClose={() => {}}
      />,
    );
    // Priority toggle inside the modal: aria-pressed="false" initially (not important).
    const btns = screen.getAllByRole('button');
    const star = btns.find(
      (b) =>
        b.getAttribute('aria-pressed') === 'false' &&
        b.getAttribute('aria-label')?.toLowerCase().includes('mark'),
    );
    expect(star).toBeTruthy();
    fireEvent.click(star!);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalled();
    const [updated] = onSave.mock.calls[0];
    expect(updated.important).toBe(true);
  });

  it('delete flow: shows confirm dialog then calls onDelete', () => {
    const year = createSampleYear(2023);
    const lesson = year.lessons.find((l) => l.number === '23#1')!;
    const onDelete = vi.fn();
    render(
      <LessonModal
        lesson={lesson}
        data={year}
        onSave={() => {}}
        onDelete={onDelete}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    const confirmDialog = screen.getByRole('dialog', { name: /delete 23#1/i });
    fireEvent.click(within(confirmDialog).getByText('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
