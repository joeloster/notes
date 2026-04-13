import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Note } from '@/types/canvas';

interface CanvasSearchProps {
  notes: Note[];
  onNavigateToNote: (noteId: string) => void;
  highlightedNoteId: string | null;
  onHighlightNote: (noteId: string | null) => void;
  isToolbarActive?: boolean;
}

function stripHtml(html: string): string {
  // Replace block-level tags and <br> with spaces before extracting text
  const withSpaces = html.replace(/<\/(p|div|li|br|h[1-6])>/gi, ' ').replace(/<br\s*\/?>/gi, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = withSpaces;
  const text = tmp.textContent || tmp.innerText || '';
  // Normalize newlines and multiple spaces
  return text.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Extract unique words from notes that match the query */
function getMatchingWords(notes: Note[], query: string, limit = 3): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const wordSet = new Set<string>();

  for (const note of notes) {
    const text = stripHtml(note.content);
    // Split into words, find ones containing the query
    const words = text.split(/\s+/).filter(w => w.length > 0);
    for (const word of words) {
      const clean = word.replace(/[^\w'-]/g, '');
      if (clean.length > 1 && clean.toLowerCase().includes(q) && clean.toLowerCase() !== q) {
        wordSet.add(clean);
        if (wordSet.size >= limit * 3) break; // collect extras for dedup
      }
    }
    if (wordSet.size >= limit * 3) break;
  }

  // Deduplicate case-insensitively, prefer original casing
  const seen = new Map<string, string>();
  for (const w of wordSet) {
    const lower = w.toLowerCase();
    if (!seen.has(lower)) seen.set(lower, w);
  }
  return Array.from(seen.values()).slice(0, limit);
}

export const CanvasSearch: React.FC<CanvasSearchProps> = ({
  notes, onNavigateToNote, highlightedNoteId, onHighlightNote,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    return getMatchingWords(notes, query, 3);
  }, [query, notes]);

  // Track whether the last query change came from a suggestion click
  const fromSuggestionRef = useRef(false);

  // Reset index when results change
  useEffect(() => {
    setCurrentIndex(0);
    if (fromSuggestionRef.current) {
      // Suggestion already set hasNavigated and highlighted — don't reset
      fromSuggestionRef.current = false;
    } else {
      setHasNavigated(false);
      if (results.length > 0) {
        onHighlightNote(results[0]);
      } else {
        onHighlightNote(null);
      }
    }
  }, [results, onHighlightNote]);

  // Navigate to current result
  const navigateTo = useCallback((index: number) => {
    if (results.length === 0) return;
    const clamped = ((index % results.length) + results.length) % results.length;
    setCurrentIndex(clamped);
    setHasNavigated(true);
    onHighlightNote(results[clamped]);
    onNavigateToNote(results[clamped]);
  }, [results, onNavigateToNote, onHighlightNote]);

  const handleNext = useCallback(() => {
    if (!hasNavigated) {
      navigateTo(0);
      return;
    }
    navigateTo(currentIndex + 1);
  }, [currentIndex, hasNavigated, navigateTo]);

  const handlePrev = useCallback(() => {
    if (!hasNavigated) {
      navigateTo(results.length - 1);
      return;
    }
    navigateTo(currentIndex - 1);
  }, [currentIndex, hasNavigated, navigateTo, results.length]);

  // Open / close
  const open = useCallback(() => {
    setIsOpen(true);
    setShowSuggestions(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setCurrentIndex(0);
    setHasNavigated(false);
    setShowSuggestions(false);
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

  const handleSelectSuggestion = useCallback((word: string) => {
    setQuery(word);
    setDebouncedQuery(word);
    setCurrentIndex(0);
    setHasNavigated(true);
    setShowSuggestions(false);

    // Navigate to first match immediately
    const q = word.toLowerCase();
    const matchingIds = notes.filter(n => stripHtml(n.content).toLowerCase().includes(q)).map(n => n.id);
    if (matchingIds.length > 0) {
      onHighlightNote(matchingIds[0]);
      onNavigateToNote(matchingIds[0]);
    }

    const focusInput = () => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.setSelectionRange(word.length, word.length);
    };

    focusInput();
    requestAnimationFrame(focusInput);
  }, [notes, onHighlightNote, onNavigateToNote]);

  // Keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      if (results.length > 0) {
        navigateTo(hasNavigated ? currentIndex : 0);
      }
    }
  }, [close, currentIndex, hasNavigated, navigateTo, results.length]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(e.target.value.trim().length > 0);
  }, []);

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-primary font-semibold">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="fixed top-4 right-4 z-50 flex flex-col items-end gap-0"
      onKeyDown={e => e.stopPropagation()}
      onKeyUp={e => e.stopPropagation()}
    >
      {isOpen ? (
        <div className="relative">
          <div className="flex items-center gap-1 bg-toolbar-bg border border-toolbar-border rounded-2xl px-3 py-1.5 shadow-[0_8px_32px_-8px_hsl(var(--toolbar-shadow)/0.15)] animate-scale-in w-[340px]">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && setShowSuggestions(true)}
              placeholder="Search notes..."
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
            />

            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 w-16 text-right">
              {debouncedQuery.trim()
                ? results.length === 0
                  ? 'No results'
                  : `${currentIndex + 1} of ${results.length}`
                : ''}
            </span>

            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={handlePrev} disabled={results.length <= 1} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30">
                <ChevronUp size={14} />
              </button>
              <button onClick={handleNext} disabled={results.length <= 1} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30">
                <ChevronDown size={14} />
              </button>
            </div>

            <button onClick={close} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0">
              <X size={14} />
            </button>
          </div>

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 right-0 w-[340px] bg-toolbar-bg border border-toolbar-border rounded-xl shadow-[0_8px_32px_-8px_hsl(var(--toolbar-shadow)/0.15)] overflow-hidden z-50">
              {suggestions.map((word, i) => (
                <div
                  key={`${word}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectSuggestion(word);
                  }}
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Search size={12} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{highlightMatch(word, query)}</span>
                </div>
              ))}
            </div>
          )}
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
