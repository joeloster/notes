import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Note, NOTE_COLOR_MAP, NOTE_COLOR_RING_MAP, NOTE_COLORS, NoteColor, SNAP_GRID } from '@/types/canvas';
import { Trash2 } from 'lucide-react';
import { NoteEditor } from './NoteEditor';
import { Editor } from '@tiptap/react';

interface StickyNoteProps {
  note: Note;
  scale: number;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
  onEditingChange: (editing: boolean, editor: Editor | null) => void;
}

// --- Target detection helpers (inline for clarity) ---
const isCheckbox = (el: HTMLElement) =>
  el.closest('input[type="checkbox"]') !== null ||
  Boolean(el.closest('label')?.querySelector('input[type="checkbox"]'));

const isControl = (el: HTMLElement) =>
  isCheckbox(el) ||
  el.closest('button') !== null ||
  el.closest('input') !== null ||
  el.closest('[role="button"]') !== null;

const isEditable = (el: HTMLElement) =>
  el.closest('[contenteditable="true"]') !== null;

export const StickyNote: React.FC<StickyNoteProps> = ({
  note, scale, isSelected, isHighlighted, onSelect, onMove, onResize, onUpdate, onDelete, onEditingChange,
}) => {
  // --- Single source of truth ---
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editorRef = useRef<Editor | null>(null);
  const dragStart = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const didDrag = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // --- Editor ready callback ---
  const handleEditorReady = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  // --- Notify parent of editing state ---
  useEffect(() => {
    const active = isEditing && isSelected;
    onEditingChange(active, active ? editorRef.current : null);
  }, [isEditing, isSelected, onEditingChange]);

  // --- Exit editing when deselected ---
  useEffect(() => {
    if (!isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [isSelected, isEditing]);

  // --- Auto-focus new empty notes ---
  useEffect(() => {
    if (isSelected && note.content === '' && editorRef.current) {
      setIsEditing(true);
      editorRef.current.commands.focus();
    }
  }, [isSelected, note.content]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => onEditingChange(false, null);
  }, [onEditingChange]);

  // ============================
  // EVENT HANDLERS
  // ============================

  /**
   * mousedown on the note container.
   * Priority: checkbox > contenteditable > controls > drag
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 1. Checkbox — let it through, block everything else
    if (isCheckbox(target)) {
      e.stopPropagation();
      return;
    }

    // 2. Contenteditable — allow text selection, no drag
    if (isEditable(target)) {
      e.stopPropagation();
      onSelect();
      return;
    }

    // 3. Buttons/inputs — let them handle themselves
    if (isControl(target)) {
      e.stopPropagation();
      return;
    }

    // 4. Everything else — start drag
    e.stopPropagation();
    onSelect();
    didDrag.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, noteX: note.x, noteY: note.y };
    setIsDragging(true);
  }, [note.x, note.y, onSelect]);

  /**
   * click on the note — enters edit mode if it was a clean click
   * (not a drag, not a control, target is the editor area)
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (didDrag.current) return;
    if (isControl(target)) return;
    if (isEditing) return;

    // Only enter edit mode if clicking in the editor scroll area
    if (target.closest('[data-note-editor-scroll="true"]')) {
      e.stopPropagation();
      onSelect();
      setIsEditing(true);
      requestAnimationFrame(() => editorRef.current?.commands.focus());
    }
  }, [isEditing, onSelect]);

  /**
   * Double-click — always enters edit mode (except on controls)
   */
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (isControl(target)) return;
    e.stopPropagation();
    setIsEditing(true);
    requestAnimationFrame(() => editorRef.current?.commands.focus());
  }, []);

  // --- Drag movement (window listeners) ---
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - dragStart.current.x);
      const dy = Math.abs(e.clientY - dragStart.current.y);
      if (!didDrag.current && dx + dy < 4) return;
      didDrag.current = true;

      // If we were editing, exit on drag
      if (isEditing) {
        editorRef.current?.commands.blur();
        setIsEditing(false);
      }

      lastMouse.current = { x: e.clientX, y: e.clientY };
      const moveX = (e.clientX - dragStart.current.x) / scale;
      const moveY = (e.clientY - dragStart.current.y) / scale;
      onMove(dragStart.current.noteX + moveX, dragStart.current.noteY + moveY);
    };
    const handleUp = () => {
      if (didDrag.current) {
        const snap = (v: number) => Math.round(v / SNAP_GRID) * SNAP_GRID;
        const rawX = dragStart.current.noteX + (lastMouse.current.x - dragStart.current.x) / scale;
        const rawY = dragStart.current.noteY + (lastMouse.current.y - dragStart.current.y) / scale;
        onMove(snap(rawX), snap(rawY));
      }
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, scale, onMove, isEditing]);

  // --- Resize ---
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: note.width, h: note.height };
  }, [note.width, note.height]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStart.current.x) / scale;
      const dy = (e.clientY - resizeStart.current.y) / scale;
      onResize(resizeStart.current.w + dx, resizeStart.current.h + dy);
    };
    const handleUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizing, scale, onResize]);

  return (
    <div
      className={`absolute select-none rounded-xl ${isDragging ? '' : 'transition-all duration-200'} ${NOTE_COLOR_MAP[note.color]} ${
        isSelected ? `ring-2 ${NOTE_COLOR_RING_MAP[note.color]} shadow-lg` : 'shadow-md'
      } ${isHighlighted && !isSelected ? 'ring-2 ring-primary/60 shadow-lg shadow-primary/20' : ''} ${isDragging && didDrag.current ? 'cursor-grabbing z-50 shadow-xl' : 'cursor-grab z-10'}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <button
          onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
          className="w-4 h-4 rounded-full border border-foreground/10 hover:scale-125 transition-transform"
          style={{ background: `hsl(var(--note-${note.color}))` }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-foreground/10 text-foreground/40 hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Color picker */}
      {showColorPicker && (
        <div className="absolute top-9 left-2 flex gap-1.5 bg-card p-2 rounded-lg shadow-lg z-50">
          {NOTE_COLORS.map(c => (
            <button
              key={c.name}
              onClick={(e) => { e.stopPropagation(); onUpdate({ color: c.name }); setShowColorPicker(false); }}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                note.color === c.name ? 'border-foreground/30 scale-110' : 'border-transparent'
              }`}
              style={{ background: `hsl(var(--note-${c.name}))` }}
              title={c.label}
            />
          ))}
        </div>
      )}

      {/* Content area */}
      <div className="px-3 pb-2 h-[calc(100%-36px)]">
        <NoteEditor
          content={note.content}
          isEditing={isEditing}
          isFocused={isSelected}
          onUpdate={(html) => onUpdate({ content: html })}
          onFocus={() => { setIsEditing(true); onSelect(); }}
          onBlur={() => setIsEditing(false)}
          onEditorReady={handleEditorReady}
        />
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeStart}
      >
        <svg viewBox="0 0 16 16" className="w-full h-full text-foreground/20">
          <path d="M14 14L8 14L14 8Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};
