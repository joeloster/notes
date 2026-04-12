import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Note } from '@/types/canvas';

interface CanvasSearchProps {
  notes: Note[];
  onNavigateToNote: (noteId: string) => void;
  highlightedNoteId: string | null;
  onHighlightNote: (noteId: string | null) => void;
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export const CanvasSearch: React.FC<CanvasSearchProps> = ({
  notes, onNavigateToNote, highlightedNoteId, onHighlightNote,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce query
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Search results
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return notes.filter(n => stripHtml(n.content).toLowerCase().includes(q)).map(n => n.id);
  }, [debouncedQuery, notes]);

  // Reset index when results change
  useEffect(() => {
    setCurrentIndex(0);
    if (results.length > 0) {
      onHighlightNote(results[0]);
    } else {
      onHighlightNote(null);
    }
  }, [results, onHighlightNote]);

  // Navigate to current result
  const navigateTo = useCallback((index: number) => {
    if (results.length === 0) return;
    const clamped = ((index % results.length) + results.length) % results.length;
    setCurrentIndex(clamped);
    onHighlightNote(results[clamped]);
    onNavigateToNote(results[clamped]);
  }, [results, onNavigateToNote, onHighlightNote]);

  const handleNext = useCallback(() => navigateTo(currentIndex + 1), [currentIndex, navigateTo]);
  const handlePrev = useCallback(() => navigateTo(currentIndex - 1), [currentIndex, navigateTo]);

  // Open / close
  const open = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    onHighlightNote(null);
  }, [onHighlightNote]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  // Keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) handlePrev(); else handleNext();
    }
  }, [close, handleNext, handlePrev]);

  // Global Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (isOpen) inputRef.current?.focus();
        else open();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, open]);

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {isOpen ? (
        <div className="flex items-center gap-1 bg-toolbar-bg border border-toolbar-border rounded-2xl px-3 py-1.5 shadow-[0_8px_32px_-8px_hsl(var(--toolbar-shadow)/0.15)] animate-scale-in">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes..."
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-48"
          />

          {debouncedQuery.trim() && (
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {results.length === 0
                ? 'No results'
                : `${currentIndex + 1} of ${results.length}`}
            </span>
          )}

          {results.length > 1 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={handlePrev} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <ChevronUp size={14} />
              </button>
              <button onClick={handleNext} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          <button onClick={close} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={open}
          className="p-2.5 rounded-full bg-toolbar-bg border border-toolbar-border shadow-[0_8px_32px_-8px_hsl(var(--toolbar-shadow)/0.15)] hover:bg-muted transition-colors text-muted-foreground"
          title="Search notes (Ctrl+F)"
        >
          <Search size={16} />
        </button>
      )}
    </div>
  );
};
