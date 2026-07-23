import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MoreHorizontal, X, Search, Trash2, FileText, Plus, Cloud, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';


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

const QUOTES = [
  "The only way to do great work is to love what you do.",
  "Design is not just what it looks like and feels like. Design is how it works.",
  "Simplicity is the ultimate sophistication.",
  "Stay hungry, stay foolish.",
  "Innovation distinguishes between a leader and a follower.",
  "Quality is more important than quantity. One home run is much better than two doubles.",
  "It's not about money. It's about the people you have, how you're led, and how much you get it.",
  "Your time is limited, so don't waste it living someone else's life.",
  "Sometimes life is going to hit you in the head with a brick. Don't lose faith.",
  "Have the courage to follow your heart and intuition.",
  "Details matter, it's worth waiting to get it right.",
  "Great things in business are never done by one person.",
  "I'm as proud of many of the things we haven't done as the things we have done.",
  "We're here to put a dent in the universe.",
  "Let's go invent tomorrow instead of worrying about what happened yesterday.",
  "Things don't have to change the world to be important.",
  "You can't connect the dots looking forward; you can only connect them looking backwards.",
  "Being the richest man in the cemetery doesn't matter to me.",
  "If you haven't found it yet, keep looking. Don't settle.",
  "My favorite things in life don't cost any money."
];

export function DynamicIsland({ initialPosts = null }: { initialPosts?: Post[] | null }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'time' | 'quote'>('posts');
  const [activeQuote, setActiveQuote] = useState(QUOTES[0]);
  const [direction, setDirection] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const islandRef = useRef<HTMLDivElement>(null);
  const lastScrollRef = useRef<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    
    // Pick a random quote every time it opens
    setActiveQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

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

  const EXP_W = activeTab === 'time' ? 440 : (activeTab === 'quote' ? 380 : 380);
  const EXP_H = 330;

  const filteredPosts = posts.filter(p => 
    (p.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const baseHeight = 125; // top spacer, search bar, and padding
  const listHeight = activeTab === 'time'
    ? 220
    : activeTab === 'quote' ? 120
    : (filteredPosts.length > 0 ? Math.min(3, filteredPosts.length) * 54 : 100);
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
            onClick={() => setExpanded(!expanded)}
            className="w-full h-full text-white overflow-hidden flex flex-col items-center justify-start relative pointer-events-auto border border-t-0 border-transparent dark:border-zinc-800/80 shadow-none dark:shadow-[0_8px_30px_rgba(0,0,0,0.85)]"
            style={{ backgroundColor: "var(--dynamic-island-bg)", cursor: expanded ? 'default' : 'pointer' }}
            animate={{
              borderRadius: expanded ? '0 0 36px 36px' : '0 0 14px 14px',
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >

            {/* === Collapsed State === */}
            <motion.div 
              className="absolute inset-x-0 bottom-0 top-[6px] flex items-center justify-center z-10"
              animate={{ opacity: expanded ? 0 : 1 }}
              transition={{ duration: 0.12 }}
            >
              <AnimatePresence mode="wait">
                {activeTab !== 'posts' && !expanded ? (
                  <motion.div
                    key="tab-preview"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center text-[#FF9500] font-medium text-[13px] tracking-wide"
                  >
                    {activeTab === 'time' 
                      ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : "Daily Quote"
                    }
                  </motion.div>
                ) : (
                  <motion.div
                    key="icons"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between px-3.5 w-full h-full"
                  >
                    <div className="w-[19px] h-[19px] rounded-full overflow-hidden flex-shrink-0 ring-1 ring-zinc-500/20 dark:ring-zinc-800/50 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                      <img src="https://pbs.twimg.com/profile_images/2078590852268732416/iAHBhHRM_400x400.jpg" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <img src="https://eshop.macsales.com/blog/wp-content/uploads/2020/12/Notes-Icon-Big-Sur.png" alt="" className="w-[19px] h-[19px] object-contain flex-shrink-0 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.2))] dark:[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.3))]" />
                      {posts.length > 0 && <span className="text-[10px] font-bold text-[#FF9500]">{posts.length}</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* === Expanded State === */}
            <AnimatePresence>
              {expanded && (
                <motion.div 
                  className="absolute inset-0 flex flex-col w-full h-full z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.08 }}
                >
                  {/* Top Drag/Scroll Area (The "Red Area") */}
                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, info) => {
                      const tabs = ['posts', 'time', 'quote'] as const;
                      if (info.offset.x > 30) {
                        setDirection(-1);
                        setActiveTab(prev => {
                          const idx = tabs.indexOf(prev);
                          return tabs[(idx - 1 + tabs.length) % tabs.length];
                        });
                      } else if (info.offset.x < -30) {
                        setDirection(1);
                        setActiveTab(prev => {
                          const idx = tabs.indexOf(prev);
                          return tabs[(idx + 1) % tabs.length];
                        });
                      }
                    }}
                    onWheel={(e) => {
                      const now = Date.now();
                      if (now - lastScrollRef.current < 400) return;
                      const tabs = ['posts', 'time', 'quote'] as const;

                      
                      if (e.deltaY > 10 || e.deltaX > 20) {
                        setDirection(1);
                        setActiveTab(prev => {
                          const idx = tabs.indexOf(prev);
                          return tabs[(idx + 1) % tabs.length];
                        });
                        lastScrollRef.current = now;
                      } else if (e.deltaY < -10 || e.deltaX < -20) {
                        setDirection(-1);
                        setActiveTab(prev => {
                          const idx = tabs.indexOf(prev);
                          return tabs[(idx - 1 + tabs.length) % tabs.length];
                        });
                        lastScrollRef.current = now;
                      }
                    }}
                    className="w-full h-8 shrink-0 flex items-center justify-center pt-2"
                  >
                  </motion.div>
                  
                  {/* Content Area (The "Blue Area") */}
                  <div className="flex-1 w-full px-5 pb-6 overflow-hidden relative">
                    <AnimatePresence mode="wait" custom={direction}>
                      {activeTab === 'posts' ? (
                        <motion.div 
                          key="posts"
                          custom={direction}
                          variants={{
                            enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
                            center: { x: 0, opacity: 1 },
                            exit: (dir: number) => ({ x: dir < 0 ? 20 : -20, opacity: 0 })
                          }}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.2 }}
                          className="flex flex-col h-full w-full absolute inset-0 px-5 pb-6"
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
                  <div className="mt-2.5 flex items-center gap-2 shrink-0">
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
                      ) : activeTab === 'time' ? (
                        <motion.div 
                          key="time"
                          custom={direction}
                          variants={{
                            enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
                            center: { x: 0, opacity: 1 },
                            exit: (dir: number) => ({ x: dir < 0 ? 20 : -20, opacity: 0 })
                          }}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center gap-8 h-full w-full absolute inset-0 px-6 pb-2 pt-6"
                        >
                          {/* Left Side: Time (Vertical) */}
                          <div className="flex flex-col items-start justify-center h-full pt-1">
                            <span className="text-zinc-500 text-[11px] font-semibold tracking-wider mb-3 uppercase">Good Morning</span>
                            
                            <div className="flex flex-col leading-[0.85] font-light text-white tabular-nums relative mb-4">
                              <span className="text-[68px] tracking-tight">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0].split(':')[0]}
                              </span>
                              <span className="text-[68px] tracking-tight text-zinc-400">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0].split(':')[1]}
                              </span>
                              <span className="absolute -right-8 bottom-1 text-sm font-semibold text-zinc-500 tracking-widest">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-auto text-zinc-400 text-[11px] font-semibold">
                              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              <span className="flex items-center gap-1"><Cloud className="w-3 h-3"/> 26°</span>
                            </div>
                          </div>
                          
                          {/* Right Side: Calendar */}
                          <div className="flex flex-col items-end justify-center h-full border-l border-zinc-800/50 pl-8">
                             <div className="dark">
                               <Calendar 
                                 mode="single" 
                                 selected={currentTime}
                                 className="p-0 border-none" 
                               />
                             </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="quote"
                          custom={direction}
                          variants={{
                            enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
                            center: { x: 0, opacity: 1 },
                            exit: (dir: number) => ({ x: dir < 0 ? 20 : -20, opacity: 0 })
                          }}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center justify-center h-full w-full absolute inset-0 px-8 py-6 text-center"
                        >
                          <span className="text-zinc-500 text-[11px] font-semibold tracking-wider mb-4 uppercase">Daily Quote</span>
                          <p className="text-[15px] font-medium leading-relaxed text-zinc-100 italic">
                            "{activeQuote}"
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
