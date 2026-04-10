import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, List, ListOrdered, CheckSquare, Type } from 'lucide-react';

interface NoteEditorToolbarProps {
  editor: Editor | null;
  visible: boolean;
}

const TEXT_SIZES = [
  { label: 'S', value: 'small', class: 'text-xs' },
  { label: 'M', value: 'medium', class: 'text-sm' },
  { label: 'L', value: 'large', class: 'text-base' },
] as const;

export const NoteEditorToolbar: React.FC<NoteEditorToolbarProps> = ({ editor, visible }) => {
  if (!editor || !visible) return null;

  const currentSize = editor.getAttributes('textStyle')?.fontSize || 'medium';

  const setFontSize = (size: string) => {
    if (size === 'medium') {
      // Remove custom font size (default)
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-card/95 backdrop-blur-md shadow-lg border border-border">
        {/* Text Size */}
        <div className="flex items-center gap-0.5 mr-1">
          <Type size={14} className="text-muted-foreground mr-1" />
          {TEXT_SIZES.map(s => (
            <button
              key={s.value}
              onMouseDown={(e) => { e.preventDefault(); setFontSize(s.value); }}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                currentSize === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Bold */}
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bold')
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:bg-muted'
          }`}
          title="Bold"
        >
          <Bold size={15} />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Bullet List */}
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:bg-muted'
          }`}
          title="Bullet List"
        >
          <List size={15} />
        </button>

        {/* Numbered List */}
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:bg-muted'
          }`}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </button>

        {/* Checkbox List */}
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleTaskList().run(); }}
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('taskList')
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:bg-muted'
          }`}
          title="Checkbox List"
        >
          <CheckSquare size={15} />
        </button>
      </div>
    </div>
  );
};
