import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, List, ListOrdered, CheckSquare } from 'lucide-react';

interface NoteEditorToolbarProps {
  editor: Editor | null;
  visible: boolean;
}

const TEXT_SIZES = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
] as const;

type TextSize = (typeof TEXT_SIZES)[number]['value'];

interface ToolbarState {
  bold: boolean;
  bulletList: boolean;
  orderedList: boolean;
  taskList: boolean;
  textSize: TextSize;
}

/** Read the current formatting state from the editor */
const readEditorState = (editor: Editor): ToolbarState => {
  const attrs = editor.getAttributes('textStyle');
  const fs = (attrs?.fontSize as TextSize) || 'medium';
  return {
    bold: editor.isActive('bold'),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    taskList: editor.isActive('taskList'),
    textSize: fs,
  };
};

export const NoteEditorToolbar: React.FC<NoteEditorToolbarProps> = ({ editor, visible }) => {
  const [state, setState] = useState<ToolbarState>({
    bold: false, bulletList: false, orderedList: false, taskList: false, textSize: 'medium',
  });

  // Track when we've done an optimistic update so editor transactions
  // don't revert the UI within a grace window
  const lockUntilRef = useRef(0);

  const setOptimistic = useCallback((partial: Partial<ToolbarState>) => {
    // Lock for 150ms — ignore editor-driven syncs during this window
    lockUntilRef.current = Date.now() + 150;
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const syncFromEditor = useCallback(() => {
    if (!editor) return;
    // If inside the grace window, skip — our optimistic state is canonical
    if (Date.now() < lockUntilRef.current) return;
    setState(readEditorState(editor));
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    // Initial sync
    setState(readEditorState(editor));

    const handler = () => syncFromEditor();
    editor.on('transaction', handler);
    editor.on('selectionUpdate', handler);
    return () => {
      editor.off('transaction', handler);
      editor.off('selectionUpdate', handler);
    };
  }, [editor, syncFromEditor]);

  if (!editor || !visible) return null;

  const prevent = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleBold = (e: React.MouseEvent) => {
    prevent(e);
    const next = !state.bold;
    setOptimistic({ bold: next });
    editor.chain().focus().toggleBold().run();
  };

  const handleSize = (size: TextSize) => (e: React.MouseEvent) => {
    prevent(e);
    setOptimistic({ textSize: size });
    if (size === 'medium') {
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      editor.chain().focus().unsetMark('textStyle').setMark('textStyle', { fontSize: size }).run();
    }
  };

  const handleList = (type: 'bulletList' | 'orderedList' | 'taskList') => (e: React.MouseEvent) => {
    prevent(e);
    const next = !state[type];
    // Lists are mutually exclusive — deactivate others
    const listUpdate: Partial<ToolbarState> = { bulletList: false, orderedList: false, taskList: false, [type]: next };
    setOptimistic(listUpdate);
    const cmds: Record<string, () => void> = {
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      orderedList: () => editor.chain().focus().toggleOrderedList().run(),
      taskList: () => editor.chain().focus().toggleTaskList().run(),
    };
    cmds[type]();
  };

  const btn = (active: boolean) =>
    `p-1.5 rounded-md transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'}`;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-card/95 backdrop-blur-md shadow-lg border border-border">
        {/* Text Size */}
        <div className="flex items-center gap-0.5 mr-1">
          {TEXT_SIZES.map(s => (
            <button
              key={s.value}
              onMouseDown={handleSize(s.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                state.textSize === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        <button onMouseDown={handleBold} className={btn(state.bold)} title="Bold">
          <Bold size={15} />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button onMouseDown={handleList('bulletList')} className={btn(state.bulletList)} title="Bullet List">
          <List size={15} />
        </button>
        <button onMouseDown={handleList('orderedList')} className={btn(state.orderedList)} title="Numbered List">
          <ListOrdered size={15} />
        </button>
        <button onMouseDown={handleList('taskList')} className={btn(state.taskList)} title="Checkbox List">
          <CheckSquare size={15} />
        </button>
      </div>
    </div>
  );
};
