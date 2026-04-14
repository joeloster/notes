import type { Note } from '@/types/canvas';

const isHtmlElement = (target: EventTarget | null): target is HTMLElement => target instanceof HTMLElement;

export interface SelectionBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const isCheckboxInteractionTarget = (target: EventTarget | null) => {
  if (!isHtmlElement(target)) return false;

  if (target.closest('input[type="checkbox"]')) return true;

  const label = target.closest('label');
  return Boolean(label?.querySelector('input[type="checkbox"]'));
};

export const isNoteControlTarget = (target: EventTarget | null) => {
  if (!isHtmlElement(target)) return false;

  return Boolean(
    isCheckboxInteractionTarget(target)
    || target.closest('button')
    || target.closest('input')
    || target.closest('[role="button"]'),
  );
};

export const isContentEditableTarget = (target: EventTarget | null) => (
  isHtmlElement(target) && Boolean(target.closest('[contenteditable="true"]'))
);


export const getGroupSelectionBounds = (notes: Note[], selectedIds: Set<string>): SelectionBounds | null => {
  const selectedNotes = notes.filter((note) => selectedIds.has(note.id));

  if (selectedNotes.length === 0) return null;

  const minX = Math.min(...selectedNotes.map((note) => note.x));
  const minY = Math.min(...selectedNotes.map((note) => note.y));
  const maxX = Math.max(...selectedNotes.map((note) => note.x + note.width));
  const maxY = Math.max(...selectedNotes.map((note) => note.y + note.height));

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };
};

export const isPointWithinBounds = (x: number, y: number, bounds: SelectionBounds) => (
  x >= bounds.x
  && x <= bounds.x + bounds.w
  && y >= bounds.y
  && y <= bounds.y + bounds.h
);