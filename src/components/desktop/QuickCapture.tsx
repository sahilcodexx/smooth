import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Save } from "lucide-react";

/* ================================================================
   Quick capture — the small always-on-top window opened by the tray
   or `Ctrl+Shift+U`. It is a plain note composer that writes through
   the same endpoints as the rest of the app:
     • signed in  -> POST /api/posts
     • guest      -> localStorage `smooth_guest_posts` draft
   ================================================================ */

const GUEST_KEY = "smooth_guest_posts";
const GUEST_CAP = 10;

interface GuestPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; note: string } | { kind: "error"; note: string };

const QuickCapture: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (document.activeElement as HTMLElement | null)?.blur();
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  function saveGuest(): boolean {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      const list: GuestPost[] = raw ? JSON.parse(raw) : [];
      if (list.length >= GUEST_CAP) return false;
      const now = new Date().toISOString();
      list.unshift({
        id: crypto.randomUUID(),
        title: title.trim() || "Untitled",
        content,
        created_at: now,
        updated_at: now,
        last_active_at: now,
      });
      localStorage.setItem(GUEST_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }

  async function save(): Promise<void> {
    const body = content.trim();
    if (!body) {
      setStatus({ kind: "error", note: "Nothing to save yet." });
      return;
    }
    setStatus({ kind: "saving" });

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          title: title.trim() || "Untitled",
          content: body,
        }),
      });

      if (res.ok) {
        setStatus({ kind: "saved", note: "Saved to your notes." });
        setTitle("");
        setContent("");
        titleRef.current?.focus();
        return;
      }

      // Not signed in (or offline): keep it as a local guest draft.
      if (saveGuest()) {
        setStatus({ kind: "saved", note: "Saved as a local draft." });
        setTitle("");
        setContent("");
        titleRef.current?.focus();
        return;
      }
      setStatus({ kind: "error", note: "Sign in to save more than 10 drafts." });
    } catch {
      if (saveGuest()) {
        setStatus({ kind: "saved", note: "Offline — saved as a local draft." });
        setTitle("");
        setContent("");
        titleRef.current?.focus();
      } else {
        setStatus({ kind: "error", note: "Could not save. Check your connection." });
      }
    }
  }

  const field =
    "w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 py-2 text-[13px] text-[var(--color-foreground)] " +
    "placeholder:text-[var(--color-muted-foreground)] outline-none transition-colors focus:border-[var(--color-muted-foreground)]";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--color-background)] p-3.5 text-[var(--color-foreground)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
          Quick capture
        </span>
        <span className="text-[10.5px] text-[var(--color-muted-foreground)]">⌘/Ctrl + S</span>
      </div>

      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className={`${field} mb-2`}
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write it down before it slips away…"
        className={`${field} min-h-0 flex-1 resize-none leading-relaxed`}
      />

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span
          className={
            status.kind === "error"
              ? "truncate text-[11.5px] text-red-400"
              : "truncate text-[11.5px] text-[var(--color-muted-foreground)]"
          }
        >
          {status.kind === "saved" || status.kind === "error" ? status.note : ""}
        </span>
        <button
          onClick={() => void save()}
          disabled={status.kind === "saving"}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[var(--color-border)]/50 disabled:opacity-60"
        >
          {status.kind === "saving" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : status.kind === "saved" ? (
            <Check size={13} className="text-emerald-400" />
          ) : (
            <Save size={13} />
          )}
          Save
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default QuickCapture;
