import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Sliders,
  Sun,
  Moon,
  Type,
  LayoutGrid,
  LogIn,
  LogOut,
  Trash2,
  X,
} from "lucide-react";
import { Dock, DockIcon } from "./ui/dock";
import { Separator } from "./ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Post {
  id: string;
  title: string;
  created_at: string;
}

interface PostFeedProps {
  initialPosts: Post[];
  neonAuthUrl?: string;
  initialUser?: { id: string; email: string } | null;
}

export function PostFeed({
  initialPosts,
  neonAuthUrl,
  initialUser = null,
}: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<{ id: string; email: string } | null>(
    initialUser,
  );

  // Settings states
  const [isDark, setIsDark] = useState(true);
  const [fontFamily, setFontFamily] = useState("sans");
  const [fontSize, setFontSize] = useState(15);
  const [readingWidth, setReadingWidth] = useState(37);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const savedFont = localStorage.getItem("reader_font") || "sans";
    const savedSize = localStorage.getItem("reader_size") || "15";
    const savedWidth = localStorage.getItem("reader_width") || "37";

    setFontFamily(savedFont);
    setFontSize(parseInt(savedSize));
    setReadingWidth(parseInt(savedWidth));

    applySettings(savedFont, parseInt(savedSize), parseInt(savedWidth));

    if (!user) {
      const guestPostsRaw = localStorage.getItem("smooth_guest_posts") || "[]";
      try {
        let guestPosts = JSON.parse(guestPostsRaw);
        
        // Filter out posts that haven't been active in 30 days
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        guestPosts = guestPosts.filter((p: any) => {
          const lastActive = p.last_active_at ? new Date(p.last_active_at).getTime() : new Date(p.created_at || now).getTime();
          return now - lastActive < thirtyDaysMs;
        });
        
        localStorage.setItem("smooth_guest_posts", JSON.stringify(guestPosts));
        setPosts(guestPosts);
      } catch (e) {
        console.error("Error parsing guest posts:", e);
      }
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      if (neonAuthUrl) {
        await fetch(`${neonAuthUrl}/sign-out`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        }).catch(() => undefined);
      }

      await fetch("/api/auth/logout", { method: "POST" });
      sessionStorage.removeItem("neon_oauth_pending");
      setUser(null);
      window.location.href = "/auth";
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const applySettings = (font: string, size: number, width: number) => {
    const root = document.documentElement;
    root.style.setProperty(
      "--font-choice",
      font === "sans"
        ? "'Geist Variable', sans-serif"
        : "Georgia, Cambria, 'Times New Roman', serif",
    );
    root.style.setProperty("--global-typeset-size", `${size}px`);
    root.style.setProperty("--reading-width", `${width}em`);
  };

  const handleFontChange = (font: string) => {
    setFontFamily(font);
    localStorage.setItem("reader_font", font);
    applySettings(font, fontSize, readingWidth);
  };

  const handleSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem("reader_size", size.toString());
    applySettings(fontFamily, size, readingWidth);
  };

  const handleWidthChange = (width: number) => {
    setReadingWidth(width);
    localStorage.setItem("reader_width", width.toString());
    applySettings(fontFamily, fontSize, width);
  };

  const handleReset = () => {
    setFontFamily("sans");
    setFontSize(15);
    setReadingWidth(37);
    localStorage.removeItem("reader_font");
    localStorage.removeItem("reader_size");
    localStorage.removeItem("reader_width");
    applySettings("sans", 15, 37);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete the ${selectedIds.size} selected post(s)?`,
      )
    )
      return;

    if (!user) {
      try {
        const guestPostsRaw = localStorage.getItem("smooth_guest_posts") || "[]";
        const guestPosts = JSON.parse(guestPostsRaw);
        const updated = guestPosts.filter((p: any) => !selectedIds.has(p.id));
        localStorage.setItem("smooth_guest_posts", JSON.stringify(updated));
        setPosts(updated);
        setSelectedIds(new Set());
        setIsDeleteMode(false);
      } catch (e) {
        console.error(e);
        alert("Error deleting guest posts");
      }
      return;
    }

    try {
      const idsArray = Array.from(selectedIds);
      const response = await fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: idsArray }),
      });

      if (response.ok) {
        setPosts(posts.filter((p) => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
        setIsDeleteMode(false);
      } else {
        alert("Failed to delete posts");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting posts");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateTitle = (title: string) => {
    if (!title) return "Untitled Note";
    const words = title.split(/\s+/);
    if (words.length <= 6) return title;
    return words.slice(0, 6).join(" ") + "...";
  };

  const handleItemClick = (e: React.MouseEvent, postId: string) => {
    if (isDeleteMode) {
      e.preventDefault();
      toggleSelect(postId);
    } else if (!user) {
      e.preventDefault();
      window.location.href = `/create?id=${postId}`;
    }
  };

  return (
    <TooltipProvider>
      <main
        className="max-w-[37em]"
        style={{
          margin: "0 auto",
          padding: "6rem 1.25rem 6rem 1.25rem",
          fontFamily: "var(--font-choice, var(--font-geist))",
          minHeight: "100vh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2.2rem",
                fontWeight: 400,
                fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
                fontStyle: "italic",
                letterSpacing: "-0.01em",
                color: "var(--color-foreground)",
              }}
            >
              unmindful
            </h1>
            {user ? (
              <p
                style={{
                  margin: "0.3rem 0 0 0",
                  fontSize: "0.85rem",
                  color: "var(--color-muted-foreground)",
                }}
              >
                Welcome back,{" "}
                <span className="font-mono text-zinc-300 font-semibold">
                  {user.email.split('@')[0]}
                </span>
              </p>
            ) : (
              <p
                style={{
                  margin: "0.3rem 0 0 0",
                  fontSize: "0.85rem",
                  color: "var(--color-muted-foreground)",
                }}
              >
                write your random thought
              </p>
            )}
          </div>
          <a
            href="/create?new=true"
            style={{
              textDecoration: "none",
              padding: "0.5rem 1rem",
              backgroundColor: "var(--color-foreground)",
              color: "var(--color-background)",
              borderRadius: "9999px",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "opacity 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            New post
          </a>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            marginTop: "1rem",
          }}
        >
          {posts.length > 0 ? (
            posts.map((post) => (
              <a
                key={post.id}
                href={`/posts/${post.id}`}
                onClick={(e) => handleItemClick(e, post.id)}
                style={{
                  textDecoration: "none",
                  display: "block",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid var(--color-border)",
                  transition: "border-color 0.2s",
                }}
                className="post-item"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {/* Sliding checkbox */}
                  <motion.div
                    initial={false}
                    animate={{
                      width: isDeleteMode ? 28 : 0,
                      opacity: isDeleteMode ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="overflow-hidden flex items-center shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500 accent-[#FF9500] cursor-pointer"
                    />
                  </motion.div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "1rem",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontWeight: 400,
                        color: "var(--color-foreground)",
                        transition: "color 0.2s",
                      }}
                      className="post-title-link"
                    >
                      {truncateTitle(post.title)}
                    </h2>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-muted-foreground)",
                        fontFamily: "var(--font-geist-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 1rem",
                border: "1px dashed var(--color-border)",
                borderRadius: "0.75rem",
              }}
            >
              <p
                style={{
                  color: "var(--color-muted-foreground)",
                  marginBottom: "1.5rem",
                  fontSize: "0.95rem",
                }}
              >
                No posts yet. Start sharing your thoughts.
              </p>
              <a
                href="/create?new=true"
                style={{
                  textDecoration: "none",
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "var(--color-foreground)",
                  color: "var(--color-background)",
                  borderRadius: "9999px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Write your first post
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Shared bottom Dock with Delete / Batch Delete logic */}
      <div className="dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <AnimatePresence mode="wait">
          {!isDeleteMode ? (
            <motion.div
              key="normal-dock"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <Dock
                className={`bg-[#09090b]/96 border border-zinc-800/80 rounded-full px-3 py-2 flex items-center gap-1.5 ring-1 ring-white/10 mx-auto ${isDark ? "shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "shadow-none"}`}
                iconSize={40}
                iconMagnification={58}
              >
                {/* Create Post */}
                <DockIcon
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                  onClick={() => (window.location.href = "/create?new=true")}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="size-full p-0 bg-transparent border-0 flex items-center justify-center cursor-pointer outline-none text-current">
                        <Plus className="size-full" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-zinc-900 text-zinc-50 border-zinc-800"
                      sideOffset={12}
                    >
                      <p>New Post</p>
                    </TooltipContent>
                  </Tooltip>
                </DockIcon>

                <Separator
                  orientation="vertical"
                  className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
                />

                {/* Reader Settings */}
                <DockIcon className="text-zinc-400 hover:text-zinc-100 transition-colors">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <span className="size-full p-0 bg-transparent border-0 flex items-center justify-center cursor-pointer outline-none text-current">
                        <Sliders className="size-full" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-64 bg-[#09090b] border border-zinc-800/80 shadow-2xl text-zinc-300 rounded-2xl p-4 flex flex-col gap-4"
                      align="center"
                      sideOffset={12}
                    >
                      {/* Font family selection */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                          Font Family
                        </span>
                        <div className="grid grid-cols-2 gap-1 bg-zinc-900/50 p-0.5 rounded-lg border border-zinc-800/40">
                          <button
                            onClick={() => handleFontChange("sans")}
                            className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${fontFamily === "sans" ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                          >
                            Sans-Serif
                          </button>
                          <button
                            onClick={() => handleFontChange("serif")}
                            className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${fontFamily === "serif" ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                          >
                            Serif
                          </button>
                        </div>
                      </div>

                      {/* Font Size slider */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                            Font Size
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {fontSize}px
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Type className="w-3.5 h-3.5 text-zinc-600" />
                          <input
                            type="range"
                            min="13"
                            max="22"
                            value={fontSize}
                            onChange={(e) =>
                              handleSizeChange(parseInt(e.target.value))
                            }
                            className="flex-1 accent-zinc-200 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                          />
                          <Type className="w-4.5 h-4.5 text-zinc-400" />
                        </div>
                      </div>

                      {/* Reading Width slider */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                            Reading Measure
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {readingWidth}em
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-3.5 h-3.5 text-zinc-600" />
                          <input
                            type="range"
                            min="28"
                            max="46"
                            value={readingWidth}
                            onChange={(e) =>
                              handleWidthChange(parseInt(e.target.value))
                            }
                            className="flex-1 accent-zinc-200 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                          />
                          <LayoutGrid className="w-4.5 h-4.5 text-zinc-400" />
                        </div>
                      </div>

                      <Separator className="bg-zinc-800/40" />

                      <button
                        onClick={handleReset}
                        className="w-full py-1.5 px-3 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 transition-all border border-zinc-800/40 text-center"
                      >
                        Reset to Defaults
                      </button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DockIcon>

                <Separator
                  orientation="vertical"
                  className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
                />

                {/* Enter Delete Mode */}
                <DockIcon
                  className="text-zinc-400 hover:text-red-400 transition-colors"
                  onClick={() => setIsDeleteMode(true)}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="size-full p-0 bg-transparent border-0 flex items-center justify-center cursor-pointer outline-none text-current">
                        <Trash2 className="size-full" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-zinc-900 text-zinc-50 border-zinc-800"
                      sideOffset={12}
                    >
                      <p>Delete Posts</p>
                    </TooltipContent>
                  </Tooltip>
                </DockIcon>

                <Separator
                  orientation="vertical"
                  className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
                />

                {/* Theme Toggle */}
                <DockIcon
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                  onClick={toggleTheme}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="size-full p-0 bg-transparent border-0 flex items-center justify-center cursor-pointer outline-none text-current">
                        {isDark ? (
                          <Sun className="size-full" />
                        ) : (
                          <Moon className="size-full" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-zinc-900 text-zinc-50 border-zinc-800"
                      sideOffset={12}
                    >
                      <p>Toggle Theme</p>
                    </TooltipContent>
                  </Tooltip>
                </DockIcon>

                <Separator
                  orientation="vertical"
                  className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
                />

                {/* Sign In / Sign Out */}
                <DockIcon
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                  onClick={
                    user ? handleLogout : () => (window.location.href = "/auth")
                  }
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="size-full p-0 bg-transparent border-0 flex items-center justify-center cursor-pointer outline-none text-current">
                        {user ? (
                          <LogOut className="size-full text-red-400/80 hover:text-red-400" />
                        ) : (
                          <LogIn className="size-full" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-zinc-900 text-zinc-50 border-zinc-800"
                      sideOffset={12}
                    >
                      <p>{user ? `Sign Out (${user.email})` : "Sign In"}</p>
                    </TooltipContent>
                  </Tooltip>
                </DockIcon>
              </Dock>
            </motion.div>
          ) : (
            <motion.div
              key="delete-dock"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <Dock
                className={`bg-[#09090b]/96 border border-zinc-800/80 ring-1 ring-white/10 mx-auto ${isDark ? "shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "shadow-none"}`}
                iconSize={40}
                iconMagnification={58}
              >
                <div className="flex items-center px-2 shrink-0">
                  <span className="text-[11px] font-medium font-mono text-red-400 select-none">
                    {selectedIds.size} Selected
                  </span>
                </div>

                <Separator
                  orientation="vertical"
                  className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
                />

                {/* Batch Delete Confirm */}
                <DockIcon
                  className={`text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors ${selectedIds.size === 0 ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
                  onClick={handleBatchDelete}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span
                        className="size-full p-0 bg-transparent border-0 flex items-center justify-center cursor-pointer outline-none text-current"
                        aria-disabled={selectedIds.size === 0}
                      >
                        <Trash2 className="size-full" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-zinc-900 text-red-200 border-zinc-800"
                      sideOffset={12}
                    >
                      <p>Delete Selected</p>
                    </TooltipContent>
                  </Tooltip>
                </DockIcon>

                <Separator
                  orientation="vertical"
                  className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
                />

                {/* Cancel Delete Mode */}
                <DockIcon
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                  onClick={() => {
                    setIsDeleteMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="size-full p-0 bg-transparent border-0 flex items-center justify-center cursor-pointer outline-none text-current">
                        <X className="size-full" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-zinc-900 text-zinc-50 border-zinc-800"
                      sideOffset={12}
                    >
                      <p>Cancel</p>
                    </TooltipContent>
                  </Tooltip>
                </DockIcon>
              </Dock>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
