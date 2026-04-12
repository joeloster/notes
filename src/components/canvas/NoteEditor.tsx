import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

// Custom font size extension
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.getAttribute('data-font-size'),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              const sizeMap: Record<string, string> = {
                small: '0.75rem',
                medium: '0.875rem',
                large: '1.125rem',
              };
              return {
                'data-font-size': attributes.fontSize,
                style: `font-size: ${sizeMap[attributes.fontSize] || '0.875rem'}`,
              };
            },
          },
        },
      },
    ];
  },
});

interface NoteEditorProps {
  content: string;
  isEditing: boolean;
  isFocused: boolean;
  onUpdate: (html: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onEditorReady: (editor: Editor | null) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  content,
  isEditing,
  isFocused,
  onUpdate,
  onFocus,
  onBlur,
  onEditorReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  // Allow checkbox toggling in read-only mode
  const handleReadOnlyChecked = useCallback((node: ProseMirrorNode, checked: boolean) => {
    const currentEditor = editorRef.current;
    if (!currentEditor) return false;

    let position: number | null = null;
    currentEditor.state.doc.descendants((candidate, pos) => {
      if (candidate === node) {
        position = pos;
        return false;
      }
      return true;
    });

    if (position === null) return false;
    const currentNode = currentEditor.state.doc.nodeAt(position);
    if (!currentNode) return false;

    const tr = currentEditor.state.tr.setNodeMarkup(position, undefined, {
      ...currentNode.attrs,
      checked,
    });
    currentEditor.view.dispatch(tr);
    return true;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TextStyle,
      FontSize,
      TaskList,
      TaskItem.configure({
        nested: true,
        onReadOnlyChecked: handleReadOnlyChecked,
      }),
      Placeholder.configure({ placeholder: 'Type something...' }),
    ],
    content,
    editable: isEditing,
    onUpdate: ({ editor: e }) => onUpdate(e.getHTML()),
    onFocus: () => onFocus(),
    onBlur: () => onBlur(),
    editorProps: {
      attributes: {
        class: 'outline-none h-full text-sm text-foreground/80 leading-relaxed',
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    onEditorReady(editor);
  }, [editor, onEditorReady]);

  // Sync editable state
  useEffect(() => {
    if (editor) editor.setEditable(isEditing);
  }, [isEditing, editor]);

  // Sync external content
  useEffect(() => {
    if (editor && !editor.isFocused && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // --- Checkbox isolation: stop propagation so note doesn't drag ---
  const handleCheckboxCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest('label')?.querySelector('input[type="checkbox"]')
    ) {
      e.stopPropagation();
    }
  }, []);

  // --- Scroll isolation: when focused & scrollable, trap wheel events ---
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!isFocused || !containerRef.current) return;

    const el = containerRef.current;
    const hasOverflow = el.scrollHeight > el.clientHeight + 1;
    if (!hasOverflow) return;

    // Trap the scroll — don't let it reach the canvas zoom handler
    e.stopPropagation();

    // Apply scroll manually
    const multiplier = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
    el.scrollTop += e.deltaY * multiplier;
    if (e.deltaX !== 0) {
      el.scrollLeft += e.deltaX * multiplier;
    }
  }, [isFocused]);

  return (
    <div
      ref={containerRef}
      data-note-editor-scroll="true"
      className={`w-full h-full ${isEditing ? 'cursor-text' : 'cursor-grab'}`}
      style={{
        overflowX: 'hidden',
        overflowY: isFocused ? 'auto' : 'hidden',
        overscrollBehavior: isFocused ? 'contain' : 'auto',
      }}
      onMouseDownCapture={handleCheckboxCapture}
      onClickCapture={handleCheckboxCapture}
      onWheelCapture={handleWheel}
    >
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};
