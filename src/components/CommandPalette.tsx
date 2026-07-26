import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  FileText,
  Plus,
  ArrowRight,
  Upload,
} from "lucide-react";
import type { Post } from "./DynamicIsland";
import { ImportExportModal } from "./ImportExportModal";

export function CommandPalette({ posts }: { posts?: Post[] | null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const safePosts = posts || [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredPosts = safePosts.filter((p) =>
    (p.title || "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <div key="cmd-palette-wrapper">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[100] bg-zinc-950/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-full max-w-xl bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 pointer-events-auto"
              >
                {/* Search Input */}
                <div className="flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800/50">
                  <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type a command or search..."
                    className="w-full bg-transparent border-none py-4 pl-3 pr-4 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <kbd className="px-2 py-1 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md border border-zinc-200 dark:border-zinc-700">
                      ESC
                    </kbd>
                  </div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none">
                  {/* Actions */}
                  {!query && (
                    <div className="mb-4 flex flex-col gap-1">
                      <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500">
                        Quick Actions
                      </div>
                      <a
                        href="/create"
                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                            <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                          </div>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            Create New Post
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>

                      <button
                        onClick={() => {
                          setOpen(false);
                          setShowImportModal(true);
                        }}
                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer text-left border-0 bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                            <Upload className="w-4 h-4 text-amber-500" />
                          </div>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            Import / Export Data
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  )}

                  {/* Posts */}
                  {filteredPosts.length > 0 ? (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500">
                        Your Posts
                      </div>
                      {filteredPosts.map((post) => (
                        <a
                          key={post.id}
                          href={`/posts/${post.id}`}
                          className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors shrink-0">
                              <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                {post.title || "Untitled Draft"}
                              </span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    query && (
                      <div className="py-12 text-center text-sm text-zinc-500">
                        No results found for "{query}"
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
      <ImportExportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        posts={safePosts}
      />
    </>
  );
}
