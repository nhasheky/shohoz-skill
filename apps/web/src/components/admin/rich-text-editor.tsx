import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-4 bg-muted/30 rounded-b-xl border-x border-b border-border',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col w-full rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-xs font-bold ${editor.isActive('bold') ? 'bg-accent text-white' : 'hover:bg-muted'}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-xs italic ${editor.isActive('italic') ? 'bg-accent text-white' : 'hover:bg-muted'}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-xs font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-accent text-white' : 'hover:bg-muted'}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-xs font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-accent text-white' : 'hover:bg-muted'}`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-xs ${editor.isActive('bulletList') ? 'bg-accent text-white' : 'hover:bg-muted'}`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-xs ${editor.isActive('orderedList') ? 'bg-accent text-white' : 'hover:bg-muted'}`}
        >
          Ordered List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
