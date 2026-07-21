import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { EditorToolbar } from "./EditorToolbar";

interface EditorProps {
  userId: string;
}

export default function Editor({ userId }: EditorProps) {
  const [status, setStatus] = useState("Saved");
  const [content, setContent] = useState("");
  const [fontSize, setFontSize] = useState(15);
  const postId = useRef("draft");
  const draftIdKey = `smooth_draft_id_${userId}`;
  const draftContentKey = `smooth_draft_content_${userId}`;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Image.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content:
      typeof window !== "undefined"
        ? localStorage.getItem(draftContentKey) || ""
        : "",
    editorProps: {
      attributes: {
        class: "outline-none focus:outline-none min-h-[500px]",
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(
          (item) => item.type.indexOf("image") === 0,
        );

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src }),
                ),
              );
            };
            reader.readAsDataURL(file);
            return true; // handled
          }
        }
        return false; // let default paste handle it
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.storage.markdown.getMarkdown());
    },
  });

  // Load draft or start a new post based on query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isNew = urlParams.get("new") === "true";
    const editId = urlParams.get("id");

    if (editId) {
      setStatus("Loading post...");
      fetch(`/api/posts?id=${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.post) {
            postId.current = editId;
            localStorage.setItem(draftIdKey, editId);
            localStorage.setItem(draftContentKey, data.post.content);
            setContent(data.post.content);
            if (editor) {
              editor.commands.setContent(data.post.content);
            }
            setStatus("Saved");
          } else {
            setStatus("Error loading post");
          }
        })
        .catch((err) => {
          console.error(err);
          setStatus("Error loading post");
        });
      // Remove query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isNew) {
      const newId = Date.now().toString();
      postId.current = newId;
      localStorage.setItem(draftIdKey, newId);
      localStorage.removeItem(draftContentKey);
      setContent("");
      if (editor) {
        editor.commands.setContent("");
      }
      // Remove query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedId = localStorage.getItem(draftIdKey);
      const savedContent = localStorage.getItem(draftContentKey) || "";

      if (savedId) {
        postId.current = savedId;
      } else {
        const newId = Date.now().toString();
        postId.current = newId;
        localStorage.setItem(draftIdKey, newId);
      }

      if (savedContent) {
        setContent(savedContent);
        if (editor) {
          editor.commands.setContent(savedContent);
        }
      }
    }
  }, [editor, draftIdKey, draftContentKey]);

  // Debounced autosave
  useEffect(() => {
    if (!content) return;
    setStatus("Saving...");

    localStorage.setItem(draftContentKey, content);
    localStorage.setItem(draftIdKey, postId.current);

    // Use first line as title, fallback to ID
    const lines = content.split("\n");
    let title = `Note ${postId.current}`;
    const firstLine = lines.find((l) => l.trim() !== "");
    if (firstLine) {
      title = firstLine.replace(/^#+\s*/, "").trim();
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: postId.current, title, content }),
        });

        if (response.ok) {
          setStatus("Saved");
        } else {
          setStatus("Failed to save");
        }
      } catch (error) {
        console.error(error);
        setStatus("Error saving");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, draftIdKey, draftContentKey]);

  const handleNewPost = () => {
    const newId = Date.now().toString();
    postId.current = newId;
    localStorage.setItem(draftIdKey, newId);
    localStorage.removeItem(draftContentKey);
    editor?.commands.setContent("");
    setContent("");
    setStatus("New post started");
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      setStatus("Deleting...");
      const response = await fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: postId.current }),
      });

      if (response.ok) {
        localStorage.removeItem(draftContentKey);
        localStorage.removeItem(draftIdKey);
        window.location.href = "/";
      } else {
        setStatus("Failed to delete");
      }
    } catch (error) {
      console.error(error);
      setStatus("Error deleting");
    }
  };

  return (
    <div className="relative">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            padding: "0.5rem 0",
            color: "var(--color-muted-foreground)",
            fontFamily: "var(--font-geist)",
            fontSize: "0.85rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
          }}
        >
          &larr; Back home
        </a>
        <div className="text-sm text-zinc-500 font-mono">{status}</div>
      </div>
      <div
        className="typeset typeset-article w-full pb-24"
        style={{ "--typeset-size": `${fontSize}px` } as React.CSSProperties}
      >
        <EditorContent editor={editor} />
      </div>
      <EditorToolbar
        editor={editor}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onNewPost={handleNewPost}
        onDeletePost={handleDeletePost}
      />
    </div>
  );
}
