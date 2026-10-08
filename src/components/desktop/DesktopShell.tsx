import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Home,
  PenLine,
  Star,
  Tag,
  X,
  Activity,
  Search,
  Trash2,
  ExternalLink,
  CloudOff,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

/* ================================================================
   Desktop shell — Tailwind utilities + the site's own CSS variables
   (--color-background / --color-foreground / --color-border /
   --color-muted-foreground), so it follows dark/light automatically.

   Layout model: #ds-root is a FIXED, non-interactive flex FRAME with
   three panes. The site keeps its normal document flow in the middle;
   the side panes are true overlays (pointer-events:auto on themselves
   only). Desktop-only site chrome (DynamicIsland / Kokonut toolbar)
   sits at z-50/z-100 and stays above this frame (z-[60] frame < 100).
   ================================================================ */

interface PostRow {
  id: string;
  title: string;
  created_at?: string | null;
  updated_at?: string | null;
  content?: string | null;
  last_active_at?: string | null;
}

const LS = {
  left: "smooth_desktop_left",
  right: "smooth_desktop_right",
  guests: "smooth_guest_posts",
  favsSignedIn: "smooth_desktop_favs",
  favsGuest: "smooth_guest_favs",
  recents: "smooth_desktop_recents",
};

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function saveLS(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

function rowDate(p: PostRow): number {
  return new Date(p.updated_at || p.created_at || 0).getTime();
}

function displayTitle(p: PostRow): string {
  const t = (p.title || "").trim();
  if (t && t !== "Untitled") return t;
  const first = (p.content || "")
    .split("\n")
    .map((l) => l.replace(/[#*`>\-]/g, "").trim())
    .find((l) => l.length > 0);
  if (first) return first.length > 48 ? `${first.slice(0, 48).trimEnd()}…` : first;
  return "Untitled";
}

/** Tags = inline #hashtags inside the note text (max 12 per note). */
function extractTags(content: string, title: string): string[] {
  const counts = new Map<string, number>();
  const text = `${title}\n${content}`;
  const pat = /(^|[\s(（"'])#([a-zA-Z][\w-]{0,23})/g;
  let m: RegExpExecArray | null;
  while ((m = pat.exec(text)) !== null && counts.size < 12) {
    const t = m[2].toLowerCase();
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  return [...counts.keys()];
}

function words(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ================================================================ */

const DesktopShell: React.FC = () => {
  /* layout (persisted) */
  const [mounted, setMounted] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [leftRail, setLeftRail] = useState(false);
  const [leftWidth, setLeftWidth] = useState(228);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightWidth, setRightWidth] = useState(292);
  const [rightTab, setRightTab] = useState<"inspector" | "activity">("inspector");

  /* data */
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<PostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offline, setOffline] = useState(false);

  /* ui */
  const [view, setView] = useState<"all" | "favorites" | "recents">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [favIds, setFavIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openContent, setOpenContent] = useState<string | null>(null);

  const richness = useRef<Record<string, string>>({});
  const [, bump] = useState(0);

  /* ---------- persistence ---------- */
  useEffect(() => {
    const l = loadLS<Record<string, unknown>>(LS.left, {});
    const r = loadLS<Record<string, unknown>>(LS.right, {});
    if (typeof l.open === "boolean") setLeftOpen(l.open);
    if (typeof l.rail === "boolean") setLeftRail(l.rail);
    if (typeof l.width === "number") setLeftWidth(Math.min(380, Math.max(180, l.width)));
    if (typeof r.open === "boolean") setRightOpen(r.open);
    if (typeof r.width === "number") setRightWidth(Math.min(460, Math.max(220, r.width)));
    setFavIds(loadLS<string[]>(LS.favsSignedIn, loadLS<string[]>(LS.favsGuest, [])));
    setRecentIds(loadLS<string[]>(LS.recents, []));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveLS(LS.left, { open: leftOpen, rail: leftRail, width: leftWidth });
    saveLS(LS.right, { open: rightOpen, width: rightWidth });
  }, [mounted, leftOpen, leftRail, leftWidth, rightOpen, rightWidth]);

  /* ---------- document-frame effect ----------
     The center column keeps its own max-width so the article stays at the
     same measure regardless of which sidebars are open. Side-panes are
     true overlays — they do not push or constrain the center content column
     at all, and they never edit the site's existing container max-widths.

     Padding is added only so scrolled content never slides under the
     active side pane. When both rails are closed the center gets zero
     extra padding and renders exactly like the plain site.        */
  useEffect(() => {
    if (!mounted) return;
    const style = document.createElement("style");
    style.setAttribute("data-ds-frame", "");
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [mounted]);

  // Kept in sync with DesktopShell so the center content column stays on
  // the same page as the sidebars move.
  const centerPadding = useMemo(() => ({
    left: leftOpen ? (leftRail ? 52 : leftWidth) + 8 : 0,
    right: rightOpen ? rightWidth + 8 : 0,
  }), [leftOpen, leftRail, leftWidth, rightOpen, rightWidth]);

  useEffect(() => {
    if (!mounted) return;
    const style = document.querySelector('style[data-ds-frame]');
    if (!style) return;
    const padL = centerPadding.left;
    const padR = centerPadding.right;
    style.textContent = `
      [data-ds-frame] { display: none; }
      @media (min-width: 980px) {
        main { padding-left: calc(1.25rem + ${padL}px) !important; padding-right: calc(1.25rem + ${padR}px) !important; }
        main[max-width], [class*="max-w-[37em]"], [class*="max-w:[37em]"], main { max-width: 37em !important; margin-inline: auto !important; }
      }
      @media (max-width: 979px) {
        main { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
      }
    `;
  }, [mounted, centerPadding]);

  /* ---------- data load (list API, guest fallback) ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/posts?limit=200", { headers: { Accept: "application/json" } });
        if (!alive) return;
        if (res.ok) {
          const data = (await res.json()) as { posts?: PostRow[]; total?: number };
          if (Array.isArray(data.posts)) {
            setRows(data.posts);
            setTotal(data.total ?? data.posts.length);
            setAuthed(true);
            return;
          }
        }
        if (!alive) return;
        setAuthed(false);
        setOffline(false);
        setRows(loadLS<PostRow[]>(LS.guests, []));
      } catch {
        if (!alive) return;
        setAuthed(false);
        setOffline(true);
        setRows(loadLS<PostRow[]>(LS.guests, []));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- favorites migration guest→account ---------- */
  useEffect(() => {
    if (authed !== true) return;
    const migrated = loadLS<string[]>(LS.favsGuest, []);
    if (migrated.length > 0) {
      setFavIds((f) => Array.from(new Set([...migrated, ...f])));
      saveLS(LS.favsGuest, []);
    }
  }, [authed]);

  const toggleFav = useCallback(
    (id: string) => {
      setFavIds((f) => {
        const next = f.includes(id) ? f.filter((x) => x !== id) : [id, ...f].slice(0, 60);
        saveLS(authed ? LS.favsSignedIn : LS.favsGuest, next);
        return next;
      });
    },
    [authed],
  );

  /* ---------- open-post tracking (view transitions + SPA) ---------- */
  useEffect(() => {
    const read = () => {
      const m = location.pathname.match(/^\/posts\/([^/?#]+)/);
      const id = m ? decodeURIComponent(m[1]) : null;
      setOpenId(id);
      if (!id) {
        setOpenContent(null);
        return;
      }
      setRecentIds((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, 30);
        saveLS(LS.recents, next);
        return next;
      });
    };
    read();
    document.addEventListener("astro:after-swap", read);
    window.addEventListener("popstate", read);
    return () => {
      document.removeEventListener("astro:after-swap", read);
      window.removeEventListener("popstate", read);
    };
  }, []);

  /* ---------- content for the open post ---------- */
  useEffect(() => {
    if (!openId) {
      setOpenContent(null);
      return;
    }
    let alive = true;
    const cacheKey = `smooth_dc_${openId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
      setOpenContent(cached);
      return;
    }
    const finish = (text: string) => {
      if (!alive) return;
      setOpenContent(text);
      try {
        sessionStorage.setItem(cacheKey, text);
      } catch {
        /* ignore */
      }
    };
    if (authed) {
      fetch(`/api/posts?id=${encodeURIComponent(openId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { post?: PostRow } | null) => finish(d?.post?.content ?? ""))
        .catch(() => alive && finish(""));
    } else {
      const local = loadLS<PostRow[]>(LS.guests, []).find((p) => p.id === openId);
      finish(local?.content ?? "");
    }
    return () => {
      alive = false;
    };
  }, [openId, authed]);

  /* ---------- lazy tag enrichment for the 30 most recent ---------- */
  useEffect(() => {
    if (authed !== true) return;
    let alive = true;
    const top = rows.slice(0, 30).filter((r) => richness.current[r.id] === undefined);
    if (top.length === 0) return;
    (async () => {
      for (const r of top) {
        if (!alive) return;
        try {
          const res = await fetch(`/api/posts?id=${encodeURIComponent(r.id)}`);
          const d = res.ok ? ((await res.json()) as { post?: PostRow }) : null;
          if (!alive) return;
          richness.current[r.id] = d?.post?.content ?? "";
        } catch {
          if (!alive) return;
          richness.current[r.id] = "";
        }
        bump((n) => n + 1);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authed, rows]);

  /* ---------- derived ---------- */
  const byId = useMemo(() => {
    const map = new Map<string, PostRow>();
    rows.forEach((r) => map.set(r.id, r));
    return map;
  }, [rows]);

  const withContent = useCallback(
    (r: PostRow): PostRow => ({ ...r, content: richness.current[r.id] ?? r.content ?? "" }),
    [],
  );

  const favorites = useMemo(
    () => favIds.map((id) => byId.get(id)).filter((r): r is PostRow => Boolean(r)),
    [favIds, byId],
  );

  const recents = useMemo(() => {
    if (recentIds.length === 0) return rows.slice(0, 8);
    const list = recentIds.map((id) => byId.get(id)).filter((r): r is PostRow => Boolean(r));
    return list.length ? list : rows.slice(0, 8);
  }, [recentIds, rows, byId]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      extractTags(withContent(r).content || "", r.title).forEach((t) =>
        counts.set(t, (counts.get(t) || 0) + 1),
      );
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows, withContent]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = view === "favorites" ? favorites : view === "recents" ? recents : rows;
    if (activeTag)
      out = out.filter((r) => extractTags(withContent(r).content || "", r.title).includes(activeTag));
    if (q)
      out = out.filter(
        (r) =>
          displayTitle(r).toLowerCase().includes(q) ||
          (r.content || "").toLowerCase().includes(q),
      );
    return [...out].sort((a, b) => rowDate(b) - rowDate(a));
  }, [view, favorites, recents, rows, activeTag, query, withContent]);

  const openRow = openId ? byId.get(openId) ?? null : null;

  /* ---------- resize ---------- */
  const drag = useRef<{ side: "L" | "R"; x: number; w: number } | null>(null);

  const onMove = useCallback((e: MouseEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (drag.current.side === "L") setLeftWidth(Math.min(380, Math.max(180, drag.current.w + dx)));
    else setRightWidth(Math.min(460, Math.max(220, drag.current.w - dx)));
  }, []);

  const onUp = useCallback(() => {
    drag.current = null;
    document.body.classList.remove("ds-resizing");
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }, [onMove]);

  const startDrag = (side: "L" | "R") => (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { side, x: e.clientX, w: side === "L" ? leftWidth : rightWidth };
    document.body.classList.add("ds-resizing");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  useEffect(
    () => () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("ds-resizing");
    },
    [onMove, onUp],
  );

  /* ---------- actions ---------- */
  const deleteOpen = useCallback(async () => {
    if (!openId || !openRow) return;
    if (!window.confirm("Delete this post?")) return;
    try {
      if (authed) {
        const res = await fetch(`/api/posts?id=${encodeURIComponent(openId)}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const current = loadLS<PostRow[]>(LS.guests, []);
        saveLS(LS.guests, current.filter((p) => p.id !== openId));
      }
      location.href = "/";
    } catch (err) {
      console.warn("[desktop-sh] delete failed", err);
    }
  }, [openId, openRow, authed]);

  /* ---------- render ---------- */
  if (!mounted) return null;

  const isHome = location.pathname === "/";
  const isEditor = location.pathname.startsWith("/create");
  const sidebarsActive = leftOpen || rightOpen;

  const navRow = (label: string, Icon: typeof Home, active: boolean, onClick: () => void, href?: string) => {
    const inner = (
      <>
        <Icon size={16} strokeWidth={1.8} className="shrink-0" />
        {!leftRail && <span className="truncate text-[13px]">{label}</span>}
      </>
    );
    const cls = cx(
      "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left transition-colors outline-none",
      "hover:bg-[var(--color-border)]/50 focus-visible:bg-[var(--color-border)]/50",
      active
        ? "bg-[var(--color-border)]/60 text-[var(--color-foreground)]"
        : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
      leftRail && "justify-center px-0 py-2",
    );
    return href ? (
      <a key={label} href={href} className={cls} title={label}>
        {inner}
      </a>
    ) : (
      <button key={label} className={cls} title={label} onClick={onClick}>
        {inner}
      </button>
    );
  };

  const rowItem = (p: PostRow) => {
    const isFav = favIds.includes(p.id);
    return (
      <a
        key={p.id}
        href={`/posts/${p.id}`}
        className={cx(
          "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
          openId === p.id
            ? "bg-[var(--color-border)]/60 text-[var(--color-foreground)]"
            : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-foreground)]",
        )}
        title={displayTitle(p)}
      >
        <Star
          size={12}
          className={cx(
            "shrink-0 cursor-pointer transition-colors",
            isFav
              ? "fill-amber-400 text-amber-400"
              : "text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-70",
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFav(p.id);
          }}
        />
        <span className="min-w-0 flex-1 truncate">{displayTitle(p)}</span>
        <span className="shrink-0 text-[10.5px] opacity-60">
          {timeAgo(p.updated_at || p.created_at)}
        </span>
      </a>
    );
  };

  return createPortal(
    <div
      id="ds-root"
      className={cx(
        "fixed inset-0 z-[60] flex",
        "!pointer-events-none",
        !sidebarsActive && "hidden",
      )}
    >
      {/* ============================== LEFT ============================== */}
      {leftOpen && (
        <aside
          id="ds-left"
          style={{ width: leftRail ? 52 : leftWidth }}
          className={cx(
            "pointer-events-auto flex h-full shrink-0 flex-col border-r border-[var(--color-border)]",
            "bg-[var(--color-background)] transition-[width] duration-150",
          )}
        >
          <div className="flex h-[52px] items-center justify-between gap-2 px-3">
            {leftRail ? (
              <a
                href="/"
                title="unmindful"
                className="mx-auto h-6 w-6 rounded-full bg-amber-500/90 shadow-sm transition-transform hover:scale-105"
              />
            ) : (
              <a href="/" className="text-[15px] font-medium tracking-tight text-[var(--color-foreground)]">
                unmindful
              </a>
            )}
            <button
              className="rounded-md p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-border)]/60 hover:text-[var(--color-foreground)]"
              title={leftRail ? "Expand sidebar" : "Collapse to icons"}
              onClick={() => setLeftRail((v) => !v)}
            >
              {leftRail ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-2">
            {navRow("All posts", Home, isHome && view === "all", () => setView("all"), "/")}
            {navRow("New post", PenLine, isEditor, () => {}, "/create")}
            {navRow("Favorites", Star, view === "favorites", () => {
              setView("favorites");
              if (!isHome) location.href = "/";
            })}
            {navRow("Recent", Activity, view === "recents", () => {
              setView("recents");
              if (!isHome) location.href = "/";
            })}
          </nav>

          {!leftRail && (
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-border)]/20 px-2 py-1.5 focus-within:border-amber-500/60">
                <Search size={12} className="shrink-0 opacity-60" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter…"
                  className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[var(--color-muted-foreground)]/70"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="opacity-50 hover:opacity-100">
                    <X size={11} />
                  </button>
                )}
              </div>

              {view === "all" ? (
                <>
                  <div className="mb-1 mt-2 flex items-center gap-1.5 px-1.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]/80">
                    <Star size={11} /> Favorites
                  </div>
                  <div className="flex flex-col">
                    {favorites.length === 0 ? (
                      <div className="px-2 py-1 text-[12px] text-[var(--color-muted-foreground)]/70">
                        Star a post to pin it
                      </div>
                    ) : (
                      favorites.map(rowItem)
                    )}
                  </div>

                  <div className="mb-1 mt-3 flex items-center gap-1.5 px-1.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]/80">
                    <Tag size={11} /> Tags
                  </div>
                  <div className="flex flex-col">
                    {tagCounts.length === 0 ? (
                      <div className="px-2 py-1 text-[12px] text-[var(--color-muted-foreground)]/70">
                        Type #tags in notes
                      </div>
                    ) : (
                      tagCounts.slice(0, 16).map(([t, n]) => (
                        <button
                          key={t}
                          onClick={() => setActiveTag((cur) => (cur === t ? null : t))}
                          className={cx(
                            "flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors",
                            activeTag === t
                              ? "bg-[var(--color-border)]/60 text-[var(--color-foreground)]"
                              : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-foreground)]",
                          )}
                        >
                          <span className="truncate">#{t}</span>
                          <span className="ml-2 shrink-0 text-[10px] opacity-60">{n}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col pt-1">
                  {(view === "favorites" ? favorites : recents).map(rowItem)}
                  {(view === "favorites" ? favorites : recents).length === 0 && (
                    <div className="px-2 py-1 text-[12px] text-[var(--color-muted-foreground)]/70">
                      Nothing here yet
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex h-9 items-center justify-between border-t border-[var(--color-border)] px-3 text-[11px] text-[var(--color-muted-foreground)]">
            {offline ? (
              <span className="flex items-center gap-1.5 opacity-80">
                <CloudOff size={11} /> offline
              </span>
            ) : authed === false ? (
              <a href="/auth" className="flex items-center gap-1.5 hover:text-[var(--color-foreground)]">
                <LogIn size={11} /> sign in
              </a>
            ) : (
              <span>{total} posts</span>
            )}
          </div>
        </aside>
      )}
      {leftOpen && (
        <div
          id="ds-handle-l"
          onMouseDown={startDrag("L")}
          className="group pointer-events-auto relative z-20 w-[5px] shrink-0 cursor-col-resize bg-transparent"
        >
          <div className="pointer-events-none absolute inset-y-0 left-[2px] w-px bg-[var(--color-border)] group-hover:bg-amber-500/70" />
        </div>
      )}

      {/* ============================== CENTER ============================== */}
      {/* Intentionally empty: the site's own document flow shows through.
          aria-hidden wrapper is non-interactive. */}
      <div className="min-w-0 flex-1" aria-hidden="true" />

      {/* ============================== RIGHT ============================== */}
      {rightOpen && (
        <>
          <div
            id="ds-handle-r"
            onMouseDown={startDrag("R")}
            className="group pointer-events-auto relative z-20 w-[5px] shrink-0 cursor-col-resize bg-transparent"
          >
            <div className="pointer-events-none absolute inset-y-0 left-[2px] w-px bg-[var(--color-border)] group-hover:bg-amber-500/70" />
          </div>
          <aside
            id="ds-right"
            style={{ width: rightWidth }}
            className="pointer-events-auto flex h-full shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-background)]"
          >
            <div className="flex h-[52px] items-center justify-between gap-2 px-3">
              <div className="flex rounded-lg bg-[var(--color-border)]/40 p-0.5">
                {(["inspector", "activity"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setRightTab(t)}
                    className={cx(
                      "rounded-md px-2.5 py-1 text-[12px] capitalize transition-colors",
                      rightTab === t
                        ? "bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm"
                        : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                className="rounded-md p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-border)]/60 hover:text-[var(--color-foreground)]"
                title="Hide panel"
                onClick={() => setRightOpen(false)}
              >
                <X size={13} />
              </button>
            </div>

            {rightTab === "inspector" ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                {!openRow && (
                  <div className="pt-2 text-[12.5px] leading-relaxed text-[var(--color-muted-foreground)]">
                    Open a post to see its details — dates, word count, and quick actions.
                  </div>
                )}
                {openRow && (
                  <>
                    <div className="mb-3 mt-1 break-words text-[14.5px] font-medium leading-snug">
                      {displayTitle(openRow)}
                    </div>
                    <div className="flex flex-col gap-1.5 text-[12.5px]">
                      <div className="flex justify-between border-b border-[var(--color-border)]/60 pb-1.5">
                        <span className="text-[var(--color-muted-foreground)]">Created</span>
                        <b className="font-medium">{timeAgo(openRow.created_at) || "—"}</b>
                      </div>
                      <div className="flex justify-between border-b border-[var(--color-border)]/60 pb-1.5">
                        <span className="text-[var(--color-muted-foreground)]">Edited</span>
                        <b className="font-medium">
                          {timeAgo(openRow.updated_at || openRow.created_at) || "—"}
                        </b>
                      </div>
                      <div className="flex justify-between border-b border-[var(--color-border)]/60 pb-1.5">
                        <span className="text-[var(--color-muted-foreground)]">Words</span>
                        <b className="font-medium">
                          {openContent !== null ? words(openContent) : "…"}
                        </b>
                      </div>
                      <div className="flex justify-between border-b border-[var(--color-border)]/60 pb-1.5">
                        <span className="text-[var(--color-muted-foreground)]">Chars</span>
                        <b className="font-medium">
                          {openContent !== null ? openContent.length : "…"}
                        </b>
                      </div>
                    </div>
                    {(openContent ? extractTags(openContent, openRow.title) : []).length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {extractTags(openContent || "", openRow.title).map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setActiveTag(t);
                              if (!isHome) location.href = "/";
                            }}
                            className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-500 transition-colors hover:bg-amber-500/20"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      <a
                        href={`/posts/${openRow.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11.5px] transition-colors hover:bg-[var(--color-border)]/40"
                      >
                        <ExternalLink size={11} /> open
                      </a>
                      <a
                        href={`/create?id=${openRow.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11.5px] transition-colors hover:bg-[var(--color-border)]/40"
                      >
                        <PenLine size={11} /> edit
                      </a>
                      <button
                        onClick={() => toggleFav(openRow.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11.5px] transition-colors hover:bg-[var(--color-border)]/40"
                      >
                        <Star size={11} className={favIds.includes(openRow.id) ? "fill-amber-400 text-amber-400" : ""} />
                        {favIds.includes(openRow.id) ? "unstar" : "star"}
                      </button>
                      <button
                        onClick={deleteOpen}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/25 px-2 py-1 text-[11.5px] text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 size={11} /> delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                {rows.length === 0 && (
                  <div className="px-1.5 pt-2 text-[12.5px] text-[var(--color-muted-foreground)]">
                    Nothing yet — write your first post.
                  </div>
                )}
                {rows.slice(0, 15).map(rowItem)}
              </div>
            )}
          </aside>
        </>
      )}
    </div>,
    document.body,
  );
};

export default DesktopShell;
