import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useCanvasState } from '@/hooks/useCanvasState';
import { StickyNote } from './StickyNote';
import { CanvasToolbar, InteractionMode } from './CanvasToolbar';
import { CanvasSearch } from './CanvasSearch';
import { MiniMap } from './MiniMap';
import { NoteEditorToolbar } from './NoteEditorToolbar';
import { GRID_SIZE, SNAP_GRID } from '@/types/canvas';
import { Editor } from '@tiptap/react';
import { getGroupSelectionBounds, isPointWithinBounds } from './noteInteractionUtils';

interface InfiniteCanvasProps {
  userId: string;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ userId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const hasPanned = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [isNoteEditing, setIsNoteEditing] = useState(false);
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Multi-select state
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('pan');
  const [groupSelectedIds, setGroupSelectedIds] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selectionStart = useRef<{ canvasX: number; canvasY: number } | null>(null);
  const isSelecting = useRef(false);

  // Group drag state
  const groupDragRef = useRef<{ startX: number; startY: number; origPositions: Map<string, { x: number; y: number }> } | null>(null);
  const isGroupDragging = useRef(false);
  const groupDragCleanupRef = useRef<(() => void) | null>(null);

  // Pinch-to-zoom state
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);

  const {
    notes, view, selectedNoteId, activeColor, loaded,
    setActiveColor, setSelectedNoteId, setView,
    addNote, updateNote, deleteNote, moveNote, moveNotes, persistPosition, persistPositions, resizeNote, persistSize,
    zoom, resetView,
  } = useCanvasState(userId);

  const selectedGroupBounds = useMemo(
    () => getGroupSelectionBounds(notes, groupSelectedIds),
    [notes, groupSelectedIds],
  );

  const clearGroupSelection = useCallback(() => {
    setGroupSelectedIds(new Set());
    setSelectionRect(null);
  }, []);

  const handleNavigateToNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const scale = 1;
    const targetX = canvasSize.w / 2 - (note.x + note.width / 2) * scale;
    const targetY = canvasSize.h / 2 - (note.y + note.height / 2) * scale;
    setView({ x: targetX, y: targetY, scale });
  }, [notes, canvasSize, setView]);

  const handleEditingChange = useCallback((editing: boolean, editor: Editor | null) => {
    setIsNoteEditing(editing);
    setActiveEditor(editing ? editor : null);
  }, []);

  useEffect(() => {
    const handleResize = () => setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Wheel zoom (desktop)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        zoom(-e.deltaY * 0.008, e.clientX, e.clientY);
      } else {
        zoom(-e.deltaY * 0.003, e.clientX, e.clientY);
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('.ProseMirror')) return;
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') {
        const cx = (canvasSize.w / 2 - view.x) / view.scale;
        const cy = (canvasSize.h / 2 - view.y) / view.scale;
        addNote(cx, cy);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteId) {
          deleteNote(selectedNoteId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedNoteId(null);
        setGroupSelectedIds(new Set());
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [addNote, deleteNote, selectedNoteId, setSelectedNoteId, view, canvasSize]);

  const screenToCanvas = useCallback((sx: number, sy: number) => ({
    x: (sx - view.x) / view.scale,
    y: (sy - view.y) / view.scale,
  }), [view]);

  // --- Group drag handlers ---
  const handleGroupDragStart = useCallback((_noteId: string, startX: number, startY: number) => {
    if (groupSelectedIds.size === 0) return;

    const selectedNotes = notes.filter((note) => groupSelectedIds.has(note.id));
    if (selectedNotes.length === 0) {
      clearGroupSelection();
      return;
    }

    groupDragCleanupRef.current?.();
    isPanning.current = false;

    const origPositions = new Map<string, { x: number; y: number }>(
      selectedNotes.map((note) => [note.id, { x: note.x, y: note.y }]),
    );

    groupDragRef.current = { startX, startY, origPositions };
    isGroupDragging.current = true;

    let hasMoved = false;
    const snap = (value: number) => Math.round(value / SNAP_GRID) * SNAP_GRID;

    const handleMove = (e: PointerEvent) => {
      if (!groupDragRef.current) return;

      const pointerDistance = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);
      if (!hasMoved && pointerDistance < 4) return;

      hasMoved = true;
      const dx = (e.clientX - startX) / view.scale;
      const dy = (e.clientY - startY) / view.scale;

      for (const [id, pos] of origPositions) {
        moveNote(id, pos.x + dx, pos.y + dy);
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (!groupDragRef.current) return;

      if (hasMoved) {
        const dx = (e.clientX - startX) / view.scale;
        const dy = (e.clientY - startY) / view.scale;
        const positions: { id: string; x: number; y: number }[] = [];

        for (const [id, pos] of origPositions) {
          const fx = snap(pos.x + dx);
          const fy = snap(pos.y + dy);
          moveNote(id, fx, fy);
          positions.push({ id, x: fx, y: fy });
        }

        void persistPositions(positions);
      }

      groupDragCleanupRef.current?.();
      groupDragCleanupRef.current = null;
      isGroupDragging.current = false;
      groupDragRef.current = null;
    };

    groupDragCleanupRef.current = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  }, [clearGroupSelection, groupSelectedIds, moveNote, notes, persistPositions, view.scale]);

  useEffect(() => () => {
    groupDragCleanupRef.current?.();
  }, []);

  // --- Pointer event handlers for pan + pinch + select ---
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target !== canvasRef.current && !target.classList.contains('canvas-grid') && !target.classList.contains('canvas-transform')) return;

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    if (interactionMode === 'select') {
      // Start selection rectangle
      clearGroupSelection();
      setSelectedNoteId(null);
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      selectionStart.current = { canvasX: canvasPos.x, canvasY: canvasPos.y };
      isSelecting.current = true;
      setSelectionRect({ x: canvasPos.x, y: canvasPos.y, w: 0, h: 0 });
      return;
    }

    // Single pointer → pan or group drag
    if (activePointers.current.size === 1) {
      // Check if clicking inside group selection bounding box
      if (groupSelectedIds.size > 0) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        if (selectedGroupBounds && isPointWithinBounds(canvasPos.x, canvasPos.y, selectedGroupBounds)) {
          // Start group drag
          handleGroupDragStart('', e.clientX, e.clientY);
          return;
        } else {
          // Clicked outside — clear selection
          clearGroupSelection();
        }
      }

      isPanning.current = true;
      hasPanned.current = false;
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
      panStart.current = { x: e.clientX - view.x, y: e.clientY - view.y };
      setSelectedNoteId(null);
    }

    // Two pointers → init pinch
    if (activePointers.current.size === 2) {
      isPanning.current = false;
      const pts = Array.from(activePointers.current.values());
      lastPinchDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      lastPinchCenter.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    }
  }, [view.x, view.y, setSelectedNoteId, interactionMode, screenToCanvas, groupSelectedIds, selectedGroupBounds, handleGroupDragStart, clearGroupSelection]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Selection rectangle drawing
    if (isSelecting.current && selectionStart.current) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const sx = selectionStart.current.canvasX;
      const sy = selectionStart.current.canvasY;
      const rect = {
        x: Math.min(sx, canvasPos.x),
        y: Math.min(sy, canvasPos.y),
        w: Math.abs(canvasPos.x - sx),
        h: Math.abs(canvasPos.y - sy),
      };
      setSelectionRect(rect);

      // Compute which notes intersect
      const selected = new Set<string>();
      for (const n of notes) {
        if (
          n.x + n.width > rect.x &&
          n.x < rect.x + rect.w &&
          n.y + n.height > rect.y &&
          n.y < rect.y + rect.h
        ) {
          selected.add(n.id);
        }
      }
      setGroupSelectedIds(selected);
      return;
    }

    // Pinch-to-zoom (two pointers)
    if (activePointers.current.size === 2 && lastPinchDist.current !== null) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const delta = (dist - lastPinchDist.current) * 0.005;
      zoom(delta, center.x, center.y);
      lastPinchDist.current = dist;
      lastPinchCenter.current = center;
      return;
    }

    // Single pointer → pan
    if (!isPanning.current) return;
    const dist = Math.abs(e.clientX - mouseDownPos.current.x) + Math.abs(e.clientY - mouseDownPos.current.y);
    if (dist > 3) hasPanned.current = true;
    setView(prev => ({
      ...prev,
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    }));
  }, [setView, zoom, screenToCanvas, notes]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (isSelecting.current) {
      isSelecting.current = false;
      selectionStart.current = null;
      setSelectionRect(null);
      // One-shot: revert to pan mode, keep selection
      setInteractionMode('pan');
      return;
    }

    if (activePointers.current.size < 2) {
      lastPinchDist.current = null;
      lastPinchCenter.current = null;
    }
    if (activePointers.current.size === 0) {
      isPanning.current = false;
    }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target !== canvasRef.current && !target.classList.contains('canvas-grid') && !target.classList.contains('canvas-transform')) return;
    if (hasPanned.current) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    addNote(pos.x, pos.y);
  }, [screenToCanvas, addNote]);

  const handleAddNoteCenter = useCallback(() => {
    const cx = (canvasSize.w / 2 - view.x) / view.scale;
    const cy = (canvasSize.h / 2 - view.y) / view.scale;
    addNote(cx, cy);
  }, [canvasSize, view, addNote]);

  const handleToggleMode = useCallback(() => {
    setInteractionMode(prev => prev === 'pan' ? 'select' : 'pan');
    clearGroupSelection();
  }, [clearGroupSelection]);

  const gridSize = GRID_SIZE * view.scale;
  const majorGridSize = gridSize * 5;
  const offsetX = view.x % gridSize;
  const offsetY = view.y % gridSize;
  const majorOffsetX = view.x % majorGridSize;
  const majorOffsetY = view.y % majorGridSize;

  return (
    <div
      ref={canvasRef}
      className="w-screen h-screen overflow-hidden bg-canvas-bg select-none"
      style={{
        cursor: interactionMode === 'select' ? 'crosshair' : (isPanning.current ? 'grabbing' : 'default'),
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Floating text toolbar — hidden when search is open */}
      {!isSearchOpen && (
        <NoteEditorToolbar editor={activeEditor} visible={isNoteEditing} />
      )}

      {/* Search — hidden when note toolbar is active */}
      {!isNoteEditing && (
        <CanvasSearch
          notes={notes}
          onNavigateToNote={handleNavigateToNote}
          highlightedNoteId={highlightedNoteId}
          onHighlightNote={setHighlightedNoteId}
          onOpenChange={setIsSearchOpen}
        />
      )}

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-auto canvas-grid"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--canvas-grid) / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--canvas-grid) / 0.5) 1px, transparent 1px),
            linear-gradient(hsl(var(--canvas-grid-major) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--canvas-grid-major) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px, ${offsetX}px ${offsetY}px, ${majorOffsetX}px ${majorOffsetY}px, ${majorOffsetX}px ${majorOffsetY}px`,
        }}
      />

      {/* Transform container */}
      <div
        className="canvas-transform"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {notes.map(note => (
          <StickyNote
            key={note.id}
            note={note}
            scale={view.scale}
            isSelected={selectedNoteId === note.id}
            isHighlighted={highlightedNoteId === note.id}
            isGroupSelected={groupSelectedIds.has(note.id)}
            onSelect={() => setSelectedNoteId(note.id)}
            onClearGroupSelection={groupSelectedIds.size > 0 ? clearGroupSelection : undefined}
            onMove={(x, y) => moveNote(note.id, x, y)}
            onMoveEnd={(x, y) => persistPosition(note.id, x, y)}
            onGroupDragStart={groupSelectedIds.size > 0 ? handleGroupDragStart : undefined}
            onResize={(w, h) => resizeNote(note.id, w, h)}
            onResizeEnd={(w, h) => persistSize(note.id, w, h)}
            onUpdate={(updates) => updateNote(note.id, updates)}
            onDelete={() => deleteNote(note.id)}
            onEditingChange={handleEditingChange}
          />
        ))}

        {selectedGroupBounds && !selectionRect && (
          <div
            className="absolute rounded-2xl border-2 border-primary/70 bg-primary/10"
            style={{
              left: selectedGroupBounds.x,
              top: selectedGroupBounds.y,
              width: selectedGroupBounds.w,
              height: selectedGroupBounds.h,
              zIndex: 9999,
              cursor: isGroupDragging.current ? 'grabbing' : 'grab',
              pointerEvents: 'auto',
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleGroupDragStart('', e.clientX, e.clientY);
            }}
          />
        )}

        {/* Selection rectangle — on top of notes */}
        {selectionRect && (
          <div
            className="absolute border-2 border-primary/60 bg-primary/10 rounded pointer-events-none"
            style={{
              left: selectionRect.x,
              top: selectionRect.y,
              width: selectionRect.w,
              height: selectionRect.h,
              zIndex: 9999,
            }}
          />
        )}
      </div>

      {/* Hint text */}
      {loaded && notes.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Double-click anywhere to create a note</p>
            <p className="text-sm mt-1">or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">N</kbd></p>
          </div>
        </div>
      )}

      <CanvasToolbar
        activeColor={activeColor}
        scale={view.scale}
        interactionMode={interactionMode}
        onAddNote={handleAddNoteCenter}
        onSetColor={setActiveColor}
        onZoomIn={() => zoom(0.15)}
        onZoomOut={() => zoom(-0.15)}
        onResetView={resetView}
        onToggleMode={handleToggleMode}
      />

      <MiniMap
        notes={notes}
        view={view}
        canvasWidth={canvasSize.w}
        canvasHeight={canvasSize.h}
        onNavigate={(x, y) => setView(prev => ({ ...prev, x, y }))}
      />
    </div>
  );
};
