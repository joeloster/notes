import React from 'react';
import { Plus, ZoomIn, ZoomOut, LogOut, Hand, BoxSelect } from 'lucide-react';
import { NoteColor, NOTE_COLORS } from '@/types/canvas';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type InteractionMode = 'pan' | 'select';

interface CanvasToolbarProps {
  activeColor: NoteColor;
  scale: number;
  interactionMode: InteractionMode;
  onAddNote: () => void;
  onSetColor: (color: NoteColor) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleMode: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeColor, scale, interactionMode, onAddNote, onSetColor, onZoomIn, onZoomOut, onResetView, onToggleMode,
}) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isSelectMode = interactionMode === 'select';

  return (
    <TooltipProvider delayDuration={400}>
      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-2xl border border-toolbar-border bg-toolbar-bg px-2 py-2 shadow-[0_8px_32px_-8px_hsl(var(--toolbar-shadow)/0.15)] sm:gap-1 sm:px-3">
          {/* Add note */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddNote}
                className="rounded-xl bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/90 sm:p-2"
              >
                <Plus size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Add new note</TooltipContent>
          </Tooltip>

          <div className="mx-0.5 h-8 w-px bg-border sm:mx-1" />

          {/* Color palette */}
          <div className="flex items-center gap-1 px-0.5 sm:gap-1.5 sm:px-1">
            {NOTE_COLORS.map(c => (
              <button
                key={c.name}
                onClick={() => onSetColor(c.name)}
                className={`h-5 w-5 rounded-full transition-all hover:scale-110 sm:h-6 sm:w-6 ${
                  activeColor === c.name ? 'ring-2 ring-offset-2 ring-foreground/20 scale-110' : ''
                }`}
                style={{ background: `hsl(var(--note-${c.name}))` }}
                title={c.label}
              />
            ))}
          </div>

          <div className="mx-0.5 h-8 w-px bg-border sm:mx-1" />

          {/* Mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleMode}
                className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
                  isSelectMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {isSelectMode ? <BoxSelect size={16} /> : <Hand size={16} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isSelectMode ? 'Select & move group' : 'Select & move group'}
            </TooltipContent>
          </Tooltip>

          <div className="mx-0.5 h-8 w-px bg-border sm:mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button onClick={onZoomOut} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted sm:p-2">
              <ZoomOut size={16} />
            </button>
            <span className="w-10 text-center text-[11px] font-medium text-muted-foreground sm:w-12 sm:text-xs">
              {Math.round(scale * 100)}%
            </span>
            <button onClick={onZoomIn} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted sm:p-2">
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="mx-0.5 h-8 w-px bg-border sm:mx-1" />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted sm:p-2"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
};