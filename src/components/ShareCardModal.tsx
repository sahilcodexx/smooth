import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Copy, Check, Sparkles } from "lucide-react";
import { toPng } from "html-to-image";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  author?: string;
}

export function ShareCardModal({
  isOpen,
  onClose,
  title,
  content,
  author = "unmindful writer",
}: ShareCardModalProps) {
  const [theme, setTheme] = useState<"dark" | "sepia" | "light" | "midnight">(
    "dark",
  );
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Clean markdown tags & excess HTML
  const cleanBody = content
    .replace(/<[^>]*>?/gm, "")
    .replace(/[#*`_]/g, "")
    .trim();

  // Determine primary display text (prefer body if available, fallback to title)
  const isTitleOnly = !cleanBody || cleanBody === title;
  const displayTitle = title.trim();
  const displayExcerpt = isTitleOnly
    ? ""
    : cleanBody.length > 220
      ? cleanBody.slice(0, 220) + "..."
      : cleanBody;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const link = document.createElement("a");
      link.download = `${(title || "post").toLowerCase().replace(/\s+/g, "-")}-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const themeStyles = {
    dark: {
      bg: "bg-[#09090b]",
      border: "border-zinc-800/80",
      text: "text-zinc-100",
      muted: "text-zinc-400",
      radial: "from-amber-500/15 via-transparent to-transparent",
      quoteMark: "text-amber-500/20",
      authorBg: "bg-zinc-900 border-zinc-800 text-zinc-300",
    },
    sepia: {
      bg: "bg-[#141210]",
      border: "border-[#2b2520]",
      text: "text-[#ede5dd]",
      muted: "text-[#aa9e93]",
      radial: "from-orange-500/15 via-transparent to-transparent",
      quoteMark: "text-orange-500/20",
      authorBg: "bg-[#211d19] border-[#362f28] text-[#d4c8bd]",
    },
    light: {
      bg: "bg-[#faf8f5]",
      border: "border-zinc-200/90",
      text: "text-zinc-900",
      muted: "text-zinc-600",
      radial: "from-amber-300/30 via-transparent to-transparent",
      quoteMark: "text-amber-600/15",
      authorBg: "bg-white border-zinc-200 text-zinc-700 shadow-sm",
    },
    midnight: {
      bg: "bg-[#060913]",
      border: "border-blue-900/40",
      text: "text-blue-50",
      muted: "text-blue-300/70",
      radial: "from-indigo-500/20 via-transparent to-transparent",
      quoteMark: "text-indigo-400/20",
      authorBg: "bg-blue-950/60 border-blue-900/60 text-blue-200",
    },
  };

  const currentTheme = themeStyles[theme];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-zinc-900/95 border border-zinc-800 text-zinc-100 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm font-sans tracking-wide">
                Export Share Card
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-sans mr-1">Theme:</span>
            {(["dark", "sepia", "light", "midnight"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1 text-xs rounded-full capitalize border transition-all ${
                  theme === t
                    ? "bg-zinc-100 text-zinc-950 font-medium border-zinc-100 shadow-sm"
                    : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Card Preview Container */}
          <div className="flex justify-center my-1 overflow-x-auto p-1">
            <div
              ref={cardRef}
              className={`w-[420px] min-h-[260px] p-8 rounded-3xl border shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${currentTheme.bg} ${currentTheme.border} ${currentTheme.text}`}
            >
              {/* Radial Ambient Glow */}
              <div
                className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${currentTheme.radial} pointer-events-none`}
              />

              {/* Decorative Giant Quote Mark */}
              <div
                className={`absolute -top-4 -right-2 text-7xl font-serif select-none pointer-events-none font-bold ${currentTheme.quoteMark}`}
              >
                “
              </div>

              {/* Card Body */}
              <div className="relative z-10 flex flex-col gap-3 my-auto">
                {displayTitle && (
                  <h4 className="text-xl font-serif font-semibold tracking-tight leading-snug">
                    {displayTitle}
                  </h4>
                )}

                {displayExcerpt && (
                  <p
                    className={`text-sm leading-relaxed font-sans italic ${currentTheme.muted}`}
                  >
                    "{displayExcerpt}"
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="relative z-10 flex items-center justify-between pt-6 border-t border-current/10 mt-6">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border font-sans ${currentTheme.authorBg}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                  <span className="font-medium tracking-tight">{author}</span>
                </div>
                <span className="text-[10px] tracking-[0.25em] uppercase font-mono font-bold opacity-40">
                  unmindful
                </span>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleCopyImage}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Image
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-4.5 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl transition-colors font-sans shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "Rendering PNG..." : "Download PNG"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

