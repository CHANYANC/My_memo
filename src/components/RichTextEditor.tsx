import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Type, 
  Highlighter, 
  Underline as UnderlineIcon,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] p-3 text-sm note-editor',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const MenuButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-sm transition-colors ${
        isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-slate-800 rounded-sm overflow-hidden bg-[#1A1A1C] focus-within:border-slate-500 transition-colors">
      <div className="flex flex-wrap items-center gap-1 p-1 border-b border-slate-800 bg-[#121214]">
        <MenuButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <Italic size={16} />
        </MenuButton>
        <MenuButton
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        >
          <UnderlineIcon size={16} />
        </MenuButton>
        
        <div className="w-px h-4 bg-slate-800 mx-1" />
        
        <MenuButton
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          <List size={16} />
        </MenuButton>
        <MenuButton
          title="Ordered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          <ListOrdered size={16} />
        </MenuButton>
        <MenuButton
          title="Task List"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
        >
          <CheckSquare size={16} />
        </MenuButton>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <div className="flex items-center gap-1 px-1">
          <input
            type="color"
            onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
            className="w-5 h-5 bg-transparent border-none cursor-pointer"
            title="Text Color"
          />
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded-sm ${editor.isActive('highlight') ? 'bg-yellow-500/20 text-yellow-500' : 'text-slate-400'}`}
            title="Highlight"
          >
            <Highlighter size={16} />
          </button>
        </div>

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <select
          onChange={(e) => {
            const size = e.target.value;
            editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
          }}
          className="bg-transparent text-[10px] text-slate-400 font-mono outline-none px-1 uppercase tracking-tighter"
          title="Font Size"
        >
          <option value="12px">XS</option>
          <option value="14px" selected>SM</option>
          <option value="16px">MD</option>
          <option value="18px">LG</option>
          <option value="20px">XL</option>
        </select>
      </div>
      <EditorContent editor={editor} />
      
      <style>{`
        .note-editor ul { list-style-type: disc; padding-left: 1.5rem; }
        .note-editor ol { list-style-type: decimal; padding-left: 1.5rem; }
        .note-editor ul[data-type="taskList"] { list-style: none; padding: 0; }
        .note-editor ul[data-type="taskList"] li { display: flex; align-items: flex-start; margin-bottom: 0.25rem; }
        .note-editor ul[data-type="taskList"] label { margin-right: 0.5rem; user-select: none; }
        .note-editor ul[data-type="taskList"] input[type="checkbox"] { cursor: pointer; margin-top: 0.25rem; }
        .note-editor p { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
