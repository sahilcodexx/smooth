import { useState, useEffect, useRef } from "react";
import { memo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { EditorToolbar } from "./EditorToolbar";
import { SmoothCaret } from "./SmoothCaret";

interface EditorProps {
  userId: string;
}

export default function Editor({ userId }: EditorProps) {
  const [status, setStatus] = useState("Saved");
  const [fontSize, setFontSize] = useState(15);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const postId = useRef("draft");
  const contentRef = useRef("");
  const saveTimerRef = useRef<number | null>(null);
  const lastWordTickRef = useRef(0);
  const draftIdKey = `smooth_draft_id_${userId}`;
  const draftContentKey = `smooth_draft_content_${userId}`;

  const savePost = async () => {
    const content = contentRef.current;
    if (!content) return;
    setStatus("Saving...");

    if (userId === "guest") {
      localStorage.setItem(draftContentKey, content);
      localStorage.setItem(draftIdKey, postId.current);
    }

    // Use first line as title, fallback to ID
    const lines = content.split("\n");
    let title = `Note ${postId.current}`;
    const firstLine = lines.find((l) => l.trim() !== "");
    if (firstLine) {
      title = firstLine.replace(/^#+\s*/, "").trim();
    }

    try {
      if (userId === "guest") {
        const guestPosts = JSON.parse(localStorage.getItem("smooth_guest_posts") || "[]");
        const idx = guestPosts.findIndex((p: any) => p.id === postId.current);

        if (idx >= 0) {
          guestPosts[idx].title = title;
          guestPosts[idx].content = content;
          guestPosts[idx].updated_at = new Date().toISOString();
          guestPosts[idx].last_active_at = new Date().toISOString();
        } else {
          if (guestPosts.length >= 10) {
            setStatus("Limit reached. Sign in to save!");
            setError("Guest limit reached! You can write up to 10 local posts. Please sign in to sync your posts, unlock unlimited writing, and keep them safe forever.");
            return;
          }
          guestPosts.push({
            id: postId.current,
            title,
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_active_at: new Date().toISOString()
          });
        }

        localStorage.setItem("smooth_guest_posts", JSON.stringify(guestPosts));
        setStatus("Saved locally");
        setError("");
      } else {
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
      }
    } catch (error) {
      console.error(error);
      setStatus("Error saving");
    }
  };

  const scheduleSave = () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void savePost();
    }, 1000);
  };

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
      typeof window !== "undefined" && userId === "guest"
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
      contentRef.current = editor.storage.markdown.getMarkdown();
      scheduleSave();
      const now = Date.now();
      if (now - lastWordTickRef.current > 300) {
        lastWordTickRef.current = now;
        const words = (editor.getText().trim().match(/\S+/g) || []).length;
        setWordCount(words);
      }
    },
  });

  // MoneyType-style smooth caret-follow scrolling
  useEffect(() => {
    if (!editor) return;
    const { view } = editor;
    let rafId = 0;
    let scrollTarget: number | null = null;
    let lastCaretY = -1;
    let idleFrames = 0;

    const ease = () => {
      rafId = 0;
      if (scrollTarget === null) return;
      const current = window.scrollY;
      const delta = scrollTarget - current;
      if (Math.abs(delta) < 0.5) {
        window.scrollTo(0, scrollTarget);
        scrollTarget = null;
        return;
      }
      const speed = Math.min(0.18, Math.abs(delta) / 5000 + 0.09);
      window.scrollTo(0, current + delta * speed);
      rafId = window.requestAnimationFrame(ease);
    };

    const follow = () => {
      if (!editor.isFocused || !editor.isEditable) {
        scrollTarget = null;
        return;
      }
      try {
        const vh = window.innerHeight;
        const coords = view.coordsAtPos(editor.state.selection.from);
        if (!coords || !isFinite(coords.top)) return;
        const scrollY = window.scrollY;
        const caretTop = coords.top + scrollY;
        const caretBottom = caretTop + coords.height;
        if (Math.abs(caretTop - lastCaretY) < 1.5) return;
        lastCaretY = caretTop;

        const topBand = vh * 0.18;
        const bottomBand = vh * 0.52;
        let target: number | null = null;
        if (caretTop < scrollY + topBand) {
          target = caretTop - topBand;
        } else if (caretBottom > scrollY + bottomBand) {
          target = caretBottom - bottomBand;
        }
        if (target === null) {
          idleFrames++;
          if (idleFrames > 10) scrollTarget = null;
          return;
        }
        idleFrames = 0;
        const max = document.documentElement.scrollHeight - vh;
        target = Math.max(0, Math.min(target, max));
        if (scrollTarget !== null && Math.abs(target - scrollTarget) < 2) return;
        scrollTarget = target;
        if (!rafId) rafId = window.requestAnimationFrame(ease);
      } catch {
        /* coords can throw for hidden nodes */
      }
    };

    const cancel = () => {
      scrollTarget = null;
    };

    editor.on("selectionUpdate", follow);
    editor.on("update", follow);
    editor.on("blur", cancel);
    window.addEventListener("wheel", cancel, { passive: true });
    return () => {
      editor.off("selectionUpdate", follow);
      editor.off("update", follow);
      editor.off("blur", cancel);
      window.removeEventListener("wheel", cancel);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [editor]);

  // Load draft or start a new post based on query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isNew = urlParams.get("new") === "true";
    const editId = urlParams.get("id");

    if (editId) {
      setStatus("Loading post...");
      if (userId === "guest") {
        try {
          const guestPosts = JSON.parse(localStorage.getItem("smooth_guest_posts") || "[]");
          const found = guestPosts.find((p: any) => p.id === editId);
          if (found) {
            postId.current = editId;
            localStorage.setItem(draftIdKey, editId);
            localStorage.setItem(draftContentKey, found.content);
            contentRef.current = found.content;
            if (editor) {
              editor.commands.setContent(found.content);
            }
            setStatus("Saved locally");
          } else {
            setStatus("Error loading post");
          }
        } catch (e) {
          console.error(e);
          setStatus("Error loading post");
        }
      } else {
        fetch(`/api/posts?id=${editId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.post) {
              postId.current = editId;
              contentRef.current = data.post.content;
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
      }
      // Remove query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isNew) {
      const newId = Date.now().toString();
      postId.current = newId;
      if (userId === "guest") {
        localStorage.setItem(draftIdKey, newId);
        localStorage.removeItem(draftContentKey);
      }
      contentRef.current = "";
      if (editor) {
        editor.commands.setContent("");
      }
      // Remove query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      if (userId === "guest") {
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
          contentRef.current = savedContent;
          if (editor) {
            editor.commands.setContent(savedContent);
          }
        }
      } else {
        postId.current = Date.now().toString();
      }
    }
  }, [editor, draftIdKey, draftContentKey, userId]);

  // Clear any pending save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleNewPost = () => {
    if (userId === "guest") {
      try {
        const guestPosts = JSON.parse(localStorage.getItem("smooth_guest_posts") || "[]");
        if (guestPosts.length >= 10) {
          setError("Guest limit reached! You can write up to 10 local posts. Please sign in to sync your posts, unlock unlimited writing, and keep them safe forever.");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const newId = Date.now().toString();
    postId.current = newId;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    if (userId === "guest") {
      localStorage.setItem(draftIdKey, newId);
      localStorage.removeItem(draftContentKey);
    }
    editor?.commands.setContent("");
    contentRef.current = "";
    setWordCount(0);
    setStatus("New post started");
    setError("");
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    if (userId === "guest") {
      try {
        setStatus("Deleting...");
        const guestPosts = JSON.parse(localStorage.getItem("smooth_guest_posts") || "[]");
        const updated = guestPosts.filter((p: any) => p.id !== postId.current);
        localStorage.setItem("smooth_guest_posts", JSON.stringify(updated));
        
        localStorage.removeItem(draftContentKey);
        localStorage.removeItem(draftIdKey);
        window.location.href = "/";
      } catch (e) {
        console.error(e);
        setStatus("Error deleting locally");
      }
      return;
    }

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
      {error && (
        <div className="bg-orange-950/30 border border-orange-900/50 text-orange-200 p-4 rounded-2xl text-xs font-sans mb-6 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <span style={{ lineHeight: "1.4" }}>{error}</span>
          <button 
            onClick={() => window.location.href = '/auth'} 
            className="bg-zinc-100 text-zinc-950 px-3.5 py-2 rounded-xl font-medium hover:bg-zinc-200 transition-colors shrink-0 font-sans ml-4 text-[11px] uppercase tracking-wider"
          >
            Sign In / Sign Up
          </button>
        </div>
      )}
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
        <div className="flex items-center gap-2.5 text-xs text-zinc-500 font-mono">
          <span>{status}</span>
          {wordCount > 0 && (
            <>
              <span className="text-zinc-700 dark:text-zinc-800">•</span>
              <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
              <span className="text-zinc-700 dark:text-zinc-800">•</span>
              <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
            </>
          )}
        </div>
      </div>
      <div
        ref={editorWrapperRef}
        className="relative typeset typeset-article w-full pb-24"
        style={{ "--typeset-size": `${fontSize}px` } as React.CSSProperties}
      >
        <EditorContent editor={editor} />
        <SmoothCaret editor={editor} wrapperRef={editorWrapperRef} />
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
