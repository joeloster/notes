import { useState, useCallback, useRef, useEffect } from 'react';
import { Note, NoteColor, ViewState, DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT, SNAP_GRID } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';

function snapToGrid(value: number): number {
  return Math.round(value / SNAP_GRID) * SNAP_GRID;
}

export function useCanvasState(userId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<NoteColor>('yellow');
  const [loaded, setLoaded] = useState(false);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        setNotes(data.map(n => ({
          id: n.id,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          content: n.content,
          color: n.color as NoteColor,
        })));
      }
      setLoaded(true);
    };
    fetchNotes();
  }, [userId]);

  const addNote = useCallback(async (canvasX: number, canvasY: number) => {
    const x = snapToGrid(canvasX - DEFAULT_NOTE_WIDTH / 2);
    const y = snapToGrid(canvasY - DEFAULT_NOTE_HEIGHT / 2);

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        x, y,
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        content: '',
        color: activeColor,
      })
      .select()
      .single();

    if (!error && data) {
      const note: Note = {
        id: data.id,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        content: data.content,
        color: data.color as NoteColor,
      };
      setNotes(prev => [...prev, note]);
      setSelectedNoteId(note.id);
      return note;
    }
  }, [activeColor, userId]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));

    // Debounce content updates
    const existing = debounceTimers.current.get(id);
    if (existing) clearTimeout(existing);

    debounceTimers.current.set(id, setTimeout(async () => {
      debounceTimers.current.delete(id);
      const dbUpdates: Record<string, any> = {};
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('notes').update(dbUpdates).eq('id', id);
      }
    }, 500));
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelectedNoteId(prev => prev === id ? null : prev);
    await supabase.from('notes').delete().eq('id', id);
  }, []);

  const moveNote = useCallback((id: string, x: number, y: number) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const persistPosition = useCallback(async (id: string, x: number, y: number) => {
    await supabase.from('notes').update({ x, y }).eq('id', id);
  }, []);

  const resizeNote = useCallback((id: string, width: number, height: number) => {
    const w = Math.max(140, snapToGrid(width));
    const h = Math.max(100, snapToGrid(height));
    setNotes(prev => prev.map(n => n.id === id ? { ...n, width: w, height: h } : n));
  }, []);

  const persistSize = useCallback(async (id: string, width: number, height: number) => {
    await supabase.from('notes').update({ width, height }).eq('id', id);
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
    loaded,
    setActiveColor,
    setSelectedNoteId,
    setView,
    addNote,
    updateNote,
    deleteNote,
    moveNote,
    persistPosition,
    resizeNote,
    persistSize,
    zoom,
    resetView,
    pan,
  };
}
