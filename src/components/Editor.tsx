import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { EditorToolbar } from './EditorToolbar';

export default function Editor() {
  const [status, setStatus] = useState('Saved');
  const [content, setContent] = useState('');
  
  // Keep the same ID for this session so we overwrite the same file
  const postId = useRef(Date.now().toString());

  // Debounced autosave
  useEffect(() => {
    if (!content) return;
    setStatus('Saving...');
    
    // Use first line as title, fallback to ID
    const lines = content.split('\n');
    let title = `Note ${postId.current}`;
    const firstLine = lines.find(l => l.trim() !== '');
    if (firstLine) {
        title = firstLine.replace(/^#+\s*/, '').trim();
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: postId.current, title, content }),
        });
        
        if (response.ok) {
          setStatus('Saved');
        } else {
          setStatus('Failed to save');
        }
      } catch (error) {
        console.error(error);
        setStatus('Error saving');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[80vh]',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.storage.markdown.getMarkdown());
    },
  });

  return (
    <div className="relative">
      <div className="absolute -top-12 right-0 text-sm text-zinc-500 font-mono transition-opacity">
        {status}
      </div>
      <div className="typeset typeset-article w-full pb-24">
        <EditorContent editor={editor} />
      </div>
      <EditorToolbar editor={editor} />
    </div>
  );
}
