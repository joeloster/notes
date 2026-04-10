import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Note, NOTE_COLOR_MAP, NOTE_COLOR_RING_MAP, NOTE_COLORS, NoteColor } from '@/types/canvas';
import { Trash2 } from 'lucide-react';
import { NoteEditor } from './NoteEditor';
import { Editor } from '@tiptap/react';

interface StickyNoteProps {
  note: Note;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
  onNoteWheelCapture: (e: WheelEvent, hasOverflow: boolean) => void;
  onEditingChange: (editing: boolean, editor: Editor | null) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note, scale, isSelected, onSelect, onMove, onResize, onUpdate, onDelete, onNoteWheelCapture, onEditingChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const dragStart = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dragThreshold = useRef({ startX: 0, startY: 0, moved: false });

  const handleEditorReady = useCallback((editor: Editor | null) => {
    editorRef.current = editor;
  }, []);

  // Auto-focus on new empty notes
  useEffect(() => {
    if (isSelected && note.content === '' && editorRef.current) {
      setIsEditing(true);
      editorRef.current.commands.focus();
    }
  }, [isSelected, note.content]);

  // Notify parent of editing state
  useEffect(() => {
    onEditingChange(isEditing, editorRef.current);
  }, [isEditing, onEditingChange]);

  // When deselected, stop editing
  useEffect(() => {
    if (!isSelected && isEditing) {
      setIsEditing(false);
    }
  }, [isSelected, isEditing]);

  // Smart scroll: capture wheel events on the note element
  useEffect(() => {
    const el = noteRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      const editorEl = el.querySelector('.ProseMirror');
      if (!editorEl) {
        onNoteWheelCapture(e, false);
        return;
      }
      const hasOverflow = editorEl.scrollHeight > editorEl.clientHeight;
      if (hasOverflow && isSelected) {
        e.stopPropagation();
        e.preventDefault();
        editorEl.scrollTop += e.deltaY;
        return;
      }
      onNoteWheelCapture(e, false);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [isSelected, onNoteWheelCapture]);

  // Drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.note-actions')) return;
    e.stopPropagation();
    onSelect();
    dragThreshold.current = { startX: e.clientX, startY: e.clientY, moved: false };
    dragStart.current = { x: e.clientX, y: e.clientY, noteX: note.x, noteY: note.y };
    setIsDragging(true);
  }, [note.x, note.y, onSelect]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      if (!dragThreshold.current.moved) {
        const dist = Math.abs(e.clientX - dragThreshold.current.startX) + Math.abs(e.clientY - dragThreshold.current.startY);
        if (dist < 4) return;
        dragThreshold.current.moved = true;
        if (isEditing && editorRef.current) {
          editorRef.current.commands.blur();
          setIsEditing(false);
        }
      }
      onMove(dragStart.current.noteX + dx, dragStart.current.noteY + dy);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging, scale, onMove, isEditing]);

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
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isResizing, scale, onResize]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: note.width, h: note.height };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => editorRef.current?.commands.focus(), 0);
  };

  return (
    <div
      ref={noteRef}
      className={`absolute select-none transition-shadow duration-200 rounded-xl ${NOTE_COLOR_MAP[note.color]} ${
        isSelected ? `ring-2 ${NOTE_COLOR_RING_MAP[note.color]} shadow-lg` : 'shadow-md'
      } ${isDragging && dragThreshold.current.moved ? 'cursor-grabbing z-50 shadow-xl' : 'cursor-grab z-10'}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 note-actions">
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

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="absolute top-9 left-2 flex gap-1.5 bg-card p-2 rounded-lg shadow-lg z-50 note-actions">
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
