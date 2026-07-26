import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Upload, FileText, Check, AlertCircle } from "lucide-react";
import type { Post } from "./DynamicIsland";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  userId?: string;
  onImportSuccess?: () => void;
}

export function ImportExportModal({
  isOpen,
  onClose,
  posts,
  userId = "guest",
  onImportSuccess,
}: ImportExportModalProps) {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export all posts as JSON backup
  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(posts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `unmindful-backup-${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export single post or all as Markdown text file
  const handleExportMarkdownAll = () => {
    const combinedMarkdown = posts
      .map(
        (p) =>
          `# ${p.title || "Untitled"}\n*Date: ${new Date(p.created_at).toLocaleDateString()}*\n\n${p.content || ""}\n\n---`,
      )
      .join("\n\n");

    const blob = new Blob([combinedMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unmindful-posts-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle importing .md or .json files
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setImportStatus(null);
    let importedCount = 0;

    try {
      const guestKey = `smooth_guest_posts`;
      const existingGuestPosts: Post[] = JSON.parse(
        localStorage.getItem(guestKey) || "[]",
      );

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();

        if (file.name.endsWith(".json")) {
          // Parse JSON backup
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              parsed.forEach((p: any) => {
                if (p.content || p.title) {
                  existingGuestPosts.unshift({
                    id: p.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: p.title || "Imported Note",
                    content: p.content || "",
                    created_at: p.created_at || new Date().toISOString(),
                    last_active_at: new Date().toISOString(),
                  });
                  importedCount++;
                }
              });
            }
          } catch (err) {
            console.error("Invalid JSON format", err);
          }
        } else {
          // Parse .md Markdown file
          let title = file.name.replace(/\.[^/.]+$/, "");
          let content = text;

          // Extract title if file starts with # Title
          const titleMatch = text.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            title = titleMatch[1].trim();
            content = text.replace(/^#\s+.+$/m, "").trim();
          }

          existingGuestPosts.unshift({
            id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            content,
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          });
          importedCount++;
        }
      }

      // Save to localStorage
      localStorage.setItem(guestKey, JSON.stringify(existingGuestPosts));

      // If logged in, also sync to cloud endpoint
      if (userId !== "guest") {
        await fetch("/api/posts/sync-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ posts: existingGuestPosts }),
        });
      }

      setImportStatus(`Successfully imported ${importedCount} post(s)!`);
      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error(err);
      setImportStatus("Failed to import files. Please check file format.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-base font-sans">
                Import & Export Data
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Import Section */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Import Posts
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".md,.markdown,.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 text-zinc-200 rounded-xl transition-all cursor-pointer font-sans text-xs font-medium group"
            >
              <Upload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              {isProcessing
                ? "Importing files..."
                : "Upload Markdown (.md) or JSON Backup"}
            </button>
            <p className="text-[11px] text-zinc-500 font-sans">
              Supports `.md` articles or `.json` backups exported from unmindful.
            </p>
          </div>

          {/* Export Section */}
          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Export Data ({posts.length} {posts.length === 1 ? "post" : "posts"})
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleExportMarkdownAll}
                disabled={posts.length === 0}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-200 rounded-xl transition-colors font-sans text-xs font-medium disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                Export as .MD
              </button>
              <button
                onClick={handleExportJSON}
                disabled={posts.length === 0}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl transition-colors font-sans text-xs font-medium disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Status Message */}
          {importStatus && (
            <div className="p-3 bg-zinc-800/90 border border-zinc-700 rounded-xl text-xs flex items-center gap-2 text-zinc-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
