import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useCanvasState } from '@/hooks/useCanvasState';
import { StickyNote } from './StickyNote';
import { CanvasToolbar } from './CanvasToolbar';
import { MiniMap } from './MiniMap';
import { GRID_SIZE } from '@/types/canvas';

export const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const {
    notes, view, selectedNoteId, activeColor,
    setActiveColor, setSelectedNoteId, setView,
    addNote, updateNote, deleteNote, moveNote, resizeNote,
    zoom, resetView, pan,
  } = useCanvasState();

  // Resize handler
  useEffect(() => {
    const handleResize = () => setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        zoom(-e.deltaY * 0.002, e.clientX, e.clientY);
      } else {
        pan(-e.deltaX, -e.deltaY);
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoom, pan]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') {
        const cx = (canvasSize.w / 2 - view.x) / view.scale;
        const cy = (canvasSize.h / 2 - view.y) / view.scale;
        addNote(cx, cy);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteId && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          deleteNote(selectedNoteId);
        }
      }
      if (e.key === 'Escape') setSelectedNoteId(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [addNote, deleteNote, selectedNoteId, setSelectedNoteId, view, canvasSize]);

  const screenToCanvas = useCallback((sx: number, sy: number) => ({
    x: (sx - view.x) / view.scale,
    y: (sy - view.y) / view.scale,
  }), [view]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current?.firstChild) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - view.x, y: e.clientY - view.y };
    setSelectedNoteId(null);
  }, [view.x, view.y, setSelectedNoteId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setView(prev => ({
      ...prev,
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    }));
  }, [setView]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current?.firstChild) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    addNote(pos.x, pos.y);
  }, [screenToCanvas, addNote]);

  const handleAddNoteCenter = useCallback(() => {
    const cx = (canvasSize.w / 2 - view.x) / view.scale;
    const cy = (canvasSize.h / 2 - view.y) / view.scale;
    addNote(cx, cy);
  }, [canvasSize, view, addNote]);

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
      style={{ cursor: isPanning.current ? 'grabbing' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
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
            onSelect={() => setSelectedNoteId(note.id)}
            onMove={(x, y) => moveNote(note.id, x, y)}
            onResize={(w, h) => resizeNote(note.id, w, h)}
            onUpdate={(updates) => updateNote(note.id, updates)}
            onDelete={() => deleteNote(note.id)}
          />
        ))}
      </div>

      {/* Hint text */}
      {notes.length === 0 && (
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
        onAddNote={handleAddNoteCenter}
        onSetColor={setActiveColor}
        onZoomIn={() => zoom(0.15)}
        onZoomOut={() => zoom(-0.15)}
        onResetView={resetView}
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
