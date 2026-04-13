import { useState, useCallback, useRef } from 'react';
import { Note, NoteColor, ViewState, DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT, SNAP_GRID } from '@/types/canvas';

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function snapToGrid(value: number): number {
  return Math.round(value / SNAP_GRID) * SNAP_GRID;
}

export function useCanvasState() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<NoteColor>('yellow');
  const notesRef = useRef(notes);
  notesRef.current = notes;

  const addNote = useCallback((canvasX: number, canvasY: number) => {
    const note: Note = {
      id: generateId(),
      x: snapToGrid(canvasX - DEFAULT_NOTE_WIDTH / 2),
      y: snapToGrid(canvasY - DEFAULT_NOTE_HEIGHT / 2),
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
      content: '',
      color: activeColor,
    };
    setNotes(prev => [...prev, note]);
    setSelectedNoteId(note.id);
    return note;
  }, [activeColor]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelectedNoteId(prev => prev === id ? null : prev);
  }, []);

  const moveNote = useCallback((id: string, x: number, y: number) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const resizeNote = useCallback((id: string, width: number, height: number) => {
    setNotes(prev => prev.map(n => n.id === id ? {
      ...n,
      width: Math.max(140, snapToGrid(width)),
      height: Math.max(100, snapToGrid(height)),
    } : n));
  }, []);

  const zoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setView(prev => {
      const newScale = Math.min(3, Math.max(0.1, prev.scale + delta));
      if (centerX !== undefined && centerY !== undefined) {
        const ratio = 1 - newScale / prev.scale;
        return {
          x: prev.x + (centerX - prev.x) * ratio,
          y: prev.y + (centerY - prev.y) * ratio,
          scale: newScale,
        };
      }
      return { ...prev, scale: newScale };
    });
  }, []);

  const resetView = useCallback(() => {
    setView({ x: 0, y: 0, scale: 1 });
  }, []);

  const pan = useCallback((dx: number, dy: number) => {
    setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  return {
    notes,
    view,
    selectedNoteId,
    activeColor,
    setActiveColor,
    setSelectedNoteId,
    setView,
    addNote,
    updateNote,
    deleteNote,
    moveNote,
    resizeNote,
    zoom,
    resetView,
    pan,
  };
}
