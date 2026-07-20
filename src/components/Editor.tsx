import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import { EditorToolbar } from './EditorToolbar';

export default function Editor() {
  const [status, setStatus] = useState('Saved');
  const [content, setContent] = useState('');
  
  // Keep the same ID for this session so we overwrite the same file
  const postId = useRef('draft');

  // Load initial draft from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem('smooth_draft_id');
    const savedContent = localStorage.getItem('smooth_draft_content') || '';
    
    if (savedId) {
      postId.current = savedId;
    } else {
      const newId = Date.now().toString();
      postId.current = newId;
      localStorage.setItem('smooth_draft_id', newId);
    }
    
    if (savedContent) {
      setContent(savedContent);
    }
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (!content) return;
    setStatus('Saving...');
    
    localStorage.setItem('smooth_draft_content', content);
    localStorage.setItem('smooth_draft_id', postId.current);
    
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

  const [fontSize, setFontSize] = useState(15);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Image.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: typeof window !== 'undefined' ? localStorage.getItem('smooth_draft_content') || '' : '',
    editorProps: {
      attributes: {
        class: 'outline-none focus:outline-none min-h-[500px]',
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.indexOf('image') === 0);
        
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src })
                )
              );
            };
            reader.readAsDataURL(file);
            return true; // handled
          }
        }
        return false; // let default paste handle it
      }
    },
    onUpdate: ({ editor }) => {
      setContent(editor.storage.markdown.getMarkdown());
    },
  });

  const handleNewPost = () => {
    const newId = Date.now().toString();
    postId.current = newId;
    localStorage.setItem('smooth_draft_id', newId);
    localStorage.removeItem('smooth_draft_content');
    editor?.commands.setContent('');
    setContent('');
    setStatus('New post started');
  };

  return (
    <div className="relative">
      <div className="absolute -top-12 right-0 text-sm text-zinc-500 font-mono transition-opacity">
        {status}
      </div>
      <div className="typeset typeset-article w-full pb-24" style={{ '--typeset-size': `${fontSize}px` } as React.CSSProperties}>
        <EditorContent editor={editor} />
      </div>
      <EditorToolbar editor={editor} fontSize={fontSize} setFontSize={setFontSize} onNewPost={handleNewPost} />
    </div>
  );
}
