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

const getCheckboxInput = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return null;
  if (target instanceof HTMLInputElement && target.type === 'checkbox') return target;
  return target.closest('label')?.querySelector('input[type="checkbox"]') ?? null;
};

const isCheckboxInteractionTarget = (target: EventTarget | null): target is HTMLElement => (
  target instanceof HTMLElement && (
    target.closest('input[type="checkbox"]') !== null
    || Boolean(target.closest('label')?.querySelector('input[type="checkbox"]'))
  )
);

const updateTaskItemCheckedInHtml = (html: string, checkboxIndex: number, checked: boolean) => {
  if (checkboxIndex < 0) return null;

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(html, 'text/html');
  const taskItems = Array.from(documentFragment.querySelectorAll('li[data-type="taskItem"]'));
  const taskItem = taskItems[checkboxIndex];

  if (!taskItem) return null;

  taskItem.setAttribute('data-checked', checked ? 'true' : 'false');

  const checkbox = taskItem.querySelector('input[type="checkbox"]');
  if (checkbox instanceof HTMLInputElement) {
    checkbox.checked = checked;

    if (checked) checkbox.setAttribute('checked', 'checked');
    else checkbox.removeAttribute('checked');
  }

  return documentFragment.body.innerHTML;
};

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
  const lastCheckboxIndexRef = useRef<number | null>(null);

  // Allow checkbox toggling in read-only mode
  const handleReadOnlyChecked = useCallback((_node: ProseMirrorNode, checked: boolean) => {
    const currentEditor = editorRef.current;
    const checkboxIndex = lastCheckboxIndexRef.current;
    if (!currentEditor) return false;
    if (checkboxIndex === null) return false;

    const nextHtml = updateTaskItemCheckedInHtml(currentEditor.getHTML(), checkboxIndex, checked);
    if (!nextHtml) return false;

    currentEditor.commands.setContent(nextHtml, false);
    onUpdate(nextHtml);
    return true;
  }, [onUpdate]);

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

  const handleCheckboxPointerCapture = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!isCheckboxInteractionTarget(target)) return;

    const checkbox = getCheckboxInput(target);
    const container = containerRef.current;
    if (!checkbox || !container) return;

    const allCheckboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    lastCheckboxIndexRef.current = allCheckboxes.indexOf(checkbox);
    e.stopPropagation();
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
      onPointerDownCapture={handleCheckboxPointerCapture}
      onWheelCapture={handleWheel}
    >
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};
