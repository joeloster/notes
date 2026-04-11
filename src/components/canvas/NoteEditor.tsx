import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/react';

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
  onEditorReady: (editor: ReturnType<typeof useEditor>) => void;
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
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Type something...' }),
    ],
    content,
    editable: isEditing,
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getHTML());
    },
    onFocus: () => onFocus(),
    onBlur: () => onBlur(),
    editorProps: {
      attributes: {
        class: 'outline-none h-full text-sm text-foreground/80 leading-relaxed',
      },
    },
  });

  useEffect(() => {
    onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Sync external content changes
  useEffect(() => {
    if (editor && !editor.isFocused && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <EditorContent
      editor={editor}
      data-note-editor-scroll="true"
      className={`note-editor-scroll w-full h-full ${isEditing ? 'cursor-text' : 'cursor-grab pointer-events-none'}`}
      style={{
        overflowX: 'hidden',
        overflowY: isEditing || isFocused ? 'auto' : 'hidden',
        overscrollBehavior: isFocused ? 'contain' : 'auto',
      }}
    />
  );
};
