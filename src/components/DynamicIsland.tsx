import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MoreHorizontal, X, Search, Trash2, FileText, Plus } from 'lucide-react';

export interface Post {
  id: string;
  title: string;
  created_at: string;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "Draft";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function SwipeablePost({ p, onDelete }: { p: Post; onDelete: (e: React.MouseEvent) => void }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative w-full"
    >
      <div className="absolute right-0 top-0 bottom-0 w-[60px] flex items-center justify-center bg-red-500 rounded-lg">
        <button 
          onClick={onDelete} 
          className="w-full h-full flex items-center justify-center text-white outline-none cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -60, right: 0 }}
        dragElastic={0.1}
        className="flex gap-3 items-center py-2.5 px-2 relative z-10 w-full cursor-pointer active:cursor-grabbing rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        style={{ backgroundColor: "var(--dynamic-island-bg)" }}
        onClick={() => { window.location.href = `/posts/${p.id}`; }}
      >
        <div className="w-[32px] h-[32px] rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center text-zinc-300 dark:bg-zinc-700 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 pr-2 text-left">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-semibold text-[13px] text-white leading-none truncate max-w-[180px]">{p.title || "Untitled Thought"}</h4>
            <span className="text-[10px] text-zinc-500 shrink-0 ml-2">{formatDate(p.created_at)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DynamicIsland({ initialPosts = null }: { initialPosts?: Post[] | null }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPosts === null) {
      const guestPostsRaw = localStorage.getItem("smooth_guest_posts") || "[]";
      try {
        const guestPosts = JSON.parse(guestPostsRaw);
        setPosts(guestPosts);
      } catch (e) {
        console.error("Error parsing guest posts:", e);
      }
    } else {
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      setSearchQuery(''); // reset search when closing
    };
  }, [expanded]);

  const BEZEL_H = 6;
  const NOTCH_H = 32;
  const NOTCH_W = 180;
  const R = 16; // fillet radius

  const EXP_W = 380;
  const EXP_H = 330;

  const filteredPosts = posts.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const baseHeight = 125; // top spacer, search bar, and padding
  const listHeight = filteredPosts.length > 0 
    ? Math.min(3, filteredPosts.length) * 54 
    : 100; // height for empty state with button
  const targetHeight = expanded ? baseHeight + listHeight : BEZEL_H + NOTCH_H;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = posts.filter(item => item.id !== id);
    setPosts(updated);
    if (initialPosts === null) {
      localStorage.setItem("smooth_guest_posts", JSON.stringify(updated));
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      {/* Full-width thin bezel bar — always visible */}
      <div className="absolute top-0 left-0 right-0 z-10" style={{ height: BEZEL_H, backgroundColor: "var(--dynamic-island-bg)" }} />

      {/* Notch + fillets, centered */}
      <div className="relative flex justify-center">
        <motion.div
          ref={islandRef}
          className="relative origin-top"
          initial={false}
          animate={{
            width: expanded ? EXP_W : NOTCH_W,
            height: targetHeight,
          }}
          style={{
            width: expanded ? EXP_W : NOTCH_W,
            height: targetHeight,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Left fillet — concave curve connecting bezel bottom to notch left side */}
          <div
            className="absolute pointer-events-none z-20"
            style={{ 
              top: BEZEL_H, 
              right: 'calc(100% - 1.5px)', 
              width: R, 
              height: R,
              background: `radial-gradient(circle at 0% 100%, transparent ${R - 0.5}px, var(--dynamic-island-bg) ${R + 0.5}px)`,
            }}
          />
          {/* Right fillet */}
          <div
            className="absolute pointer-events-none z-20"
            style={{ 
              top: BEZEL_H, 
              left: 'calc(100% - 1.5px)', 
              width: R, 
              height: R,
              background: `radial-gradient(circle at 100% 100%, transparent ${R - 0.5}px, var(--dynamic-island-bg) ${R + 0.5}px)`,
            }}
          />

          {/* The actual notch body */}
          <motion.div
            onMouseEnter={() => !expanded && setExpanded(true)}
            onMouseLeave={() => expanded && !isFocused && setExpanded(false)}
            onClick={() => !expanded && setExpanded(true)}
            className="w-full h-full text-white overflow-hidden flex flex-col items-center justify-start relative pointer-events-auto border border-t-0 border-transparent dark:border-zinc-800/80 shadow-none dark:shadow-[0_8px_30px_rgba(0,0,0,0.85)]"
            style={{ backgroundColor: "var(--dynamic-island-bg)", cursor: expanded ? 'default' : 'pointer' }}
            animate={{
              borderRadius: expanded ? '0 0 36px 36px' : '0 0 14px 14px',
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >

            {/* === Collapsed State === */}
            <motion.div 
              className="absolute inset-x-0 bottom-0 top-[6px] flex items-center justify-between px-3.5 z-10"
              animate={{ opacity: expanded ? 0 : 1 }}
              transition={{ duration: 0.12 }}
            >
              <div className="w-[19px] h-[19px] rounded-full overflow-hidden flex-shrink-0 ring-1 ring-zinc-500/20 dark:ring-zinc-800/50 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                <img src="https://pbs.twimg.com/profile_images/2078590852268732416/iAHBhHRM_400x400.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <img src="https://eshop.macsales.com/blog/wp-content/uploads/2020/12/Notes-Icon-Big-Sur.png" alt="" className="w-[19px] h-[19px] object-contain flex-shrink-0 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.2))] dark:[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.3))]" />
                {posts.length > 0 && <span className="text-[10px] font-bold text-[#FF9500]">{posts.length}</span>}
              </div>
            </motion.div>

            {/* === Expanded State === */}
            <AnimatePresence>
              {expanded && (
                <motion.div 
                  className="absolute inset-0 pt-7 px-5 pb-6 flex flex-col w-full h-full z-10"
                  onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.08 }}
                >
                  {/* Top row: Header */}
                  <div className="flex justify-between items-center mb-3 pr-0.5">
                    <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Recent Posts</span>
                    <button className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Posts List */}
                  <div className="flex flex-col gap-0 flex-1 overflow-y-auto scrollbar-none scroll-mask py-1">
                    <AnimatePresence>
                      {filteredPosts.length > 0 ? (
                        filteredPosts.map((p) => (
                          <SwipeablePost 
                            key={p.id} 
                            p={p} 
                            onDelete={(e) => handleDelete(e, p.id)} 
                          />
                        ))
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="flex flex-col items-center justify-center flex-1 text-zinc-500 text-[11.5px] py-4"
                        >
                          <p className="mb-3">No posts found.</p>
                          <a 
                            href="/create?new=true"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create post
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Search Bar */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Search posts..." 
                        className="w-full bg-[#1c1c1e] border border-[#333] rounded-full py-[7px] pl-9 pr-4 text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors" 
                      />
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (searchQuery) {
                          setSearchQuery('');
                        } else {
                          setExpanded(false);
                        }
                      }}
                      className="w-7 h-7 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-zinc-600 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
