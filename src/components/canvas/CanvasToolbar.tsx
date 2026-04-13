import React from 'react';
import { Plus, ZoomIn, ZoomOut, LogOut } from 'lucide-react';
import { NoteColor, NOTE_COLORS } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';

interface CanvasToolbarProps {
  activeColor: NoteColor;
  scale: number;
  onAddNote: () => void;
  onSetColor: (color: NoteColor) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeColor, scale, onAddNote, onSetColor, onZoomIn, onZoomOut, onResetView,
}) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-toolbar-bg border border-toolbar-border rounded-2xl px-3 py-2 shadow-[0_8px_32px_-8px_hsl(var(--toolbar-shadow)/0.15)] mx-4 max-w-[calc(100vw-2rem)]">
      {/* Add note */}
      <button
        onClick={onAddNote}
        className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        title="Add Note"
      >
        <Plus size={16} />
      </button>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Color palette */}
      <div className="flex items-center gap-1.5 px-1">
        {NOTE_COLORS.map(c => (
          <button
            key={c.name}
            onClick={() => onSetColor(c.name)}
            className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${
              activeColor === c.name ? 'ring-2 ring-offset-2 ring-foreground/20 scale-110' : ''
            }`}
            style={{ background: `hsl(var(--note-${c.name}))` }}
            title={c.label}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5">
        <button onClick={onZoomOut} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-muted-foreground w-12 text-center font-medium">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={onZoomIn} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        title="Sign Out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
};
