export interface Note {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: NoteColor;
}

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export const NOTE_COLORS: { name: NoteColor; label: string }[] = [
  { name: 'yellow', label: 'Yellow' },
  { name: 'blue', label: 'Blue' },
  { name: 'green', label: 'Green' },
  { name: 'pink', label: 'Pink' },
  { name: 'purple', label: 'Purple' },
];

export const NOTE_COLOR_MAP: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow',
  blue: 'bg-note-blue',
  green: 'bg-note-green',
  pink: 'bg-note-pink',
  purple: 'bg-note-purple',
};

export const NOTE_COLOR_RING_MAP: Record<NoteColor, string> = {
  yellow: 'ring-[hsl(48,70%,65%)]',
  blue: 'ring-[hsl(210,70%,70%)]',
  green: 'ring-[hsl(140,40%,65%)]',
  pink: 'ring-[hsl(340,60%,75%)]',
  purple: 'ring-[hsl(270,50%,70%)]',
};

export const DEFAULT_NOTE_WIDTH = 220;
export const DEFAULT_NOTE_HEIGHT = 180;
export const GRID_SIZE = 20;
export const SNAP_GRID = 20;
