import React, { useCallback, useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, List, ListOrdered, CheckSquare } from 'lucide-react';

interface NoteEditorToolbarProps {
  editor: Editor | null;
  visible: boolean;
}

const TEXT_SIZES = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
] as const;

type TextSize = (typeof TEXT_SIZES)[number]['value'];

interface ToolbarState {
  bulletList: boolean;
  bold: boolean;
  orderedList: boolean;
  taskList: boolean;
  textSize: TextSize;
}

const getTextSize = (editor: Editor | null): TextSize => {
  if (!editor) return 'medium';
  const attrs = editor.getAttributes('textStyle');
  const fs = attrs?.fontSize as TextSize | undefined;
  return fs || 'medium';
};

const getToolbarState = (editor: Editor | null): ToolbarState => ({
  bulletList: editor?.isActive('bulletList') ?? false,
  bold: editor?.isActive('bold') ?? false,
  orderedList: editor?.isActive('orderedList') ?? false,
  taskList: editor?.isActive('taskList') ?? false,
  textSize: getTextSize(editor),
});

export const NoteEditorToolbar: React.FC<NoteEditorToolbarProps> = ({ editor, visible }) => {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(() => getToolbarState(editor));

  const syncToolbarState = useCallback(() => {
    setToolbarState(getToolbarState(editor));
  }, [editor]);

  useEffect(() => {
    syncToolbarState();

    if (!editor) return;

    const handleEditorStateChange = () => {
      syncToolbarState();
    };

    editor.on('transaction', handleEditorStateChange);
    editor.on('selectionUpdate', handleEditorStateChange);
    editor.on('focus', handleEditorStateChange);
    editor.on('blur', handleEditorStateChange);

    return () => {
      editor.off('transaction', handleEditorStateChange);
      editor.off('selectionUpdate', handleEditorStateChange);
      editor.off('focus', handleEditorStateChange);
      editor.off('blur', handleEditorStateChange);
    };
  }, [editor, syncToolbarState]);

  if (!editor || !visible) return null;

  const currentSize = toolbarState.textSize;

  const runCommand = (command: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    command();
    // Force immediate state sync after command
    requestAnimationFrame(syncToolbarState);
  };

  const setFontSize = (size: TextSize) => {
    // Always unset first, then set if not medium
    editor.chain().focus().unsetMark('textStyle').run();
    if (size !== 'medium') {
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    }
    // Immediate optimistic update
    setToolbarState(prev => ({ ...prev, textSize: size }));
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-card/95 backdrop-blur-md shadow-lg border border-border">
        {/* Text Size */}
        <div className="flex items-center gap-0.5 mr-1">
          {TEXT_SIZES.map(s => (
            <button
              key={s.value}
              onMouseDown={runCommand(() => setFontSize(s.value))}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
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
          onMouseDown={runCommand(() => {
            editor.chain().focus().toggleBold().run();
          })}
          className={`p-1.5 rounded-md transition-colors ${
            toolbarState.bold
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
          onMouseDown={runCommand(() => {
            editor.chain().focus().toggleBulletList().run();
          })}
          className={`p-1.5 rounded-md transition-colors ${
            toolbarState.bulletList
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:bg-muted'
          }`}
          title="Bullet List"
        >
          <List size={15} />
        </button>

        {/* Numbered List */}
        <button
          onMouseDown={runCommand(() => {
            editor.chain().focus().toggleOrderedList().run();
          })}
          className={`p-1.5 rounded-md transition-colors ${
            toolbarState.orderedList
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground/70 hover:bg-muted'
          }`}
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </button>

        {/* Checkbox List */}
        <button
          onMouseDown={runCommand(() => {
            editor.chain().focus().toggleTaskList().run();
          })}
          className={`p-1.5 rounded-md transition-colors ${
            toolbarState.taskList
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
