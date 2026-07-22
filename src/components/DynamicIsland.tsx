import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MoreHorizontal, X, Search, Trash2 } from 'lucide-react';

const initialNotifications = [
  {
    id: 1,
    initials: 'P',
    color: '#34C759',
    name: 'Priya',
    message: 'Lunch tomorrow? That new ramen place near the office',
    time: 'now',
  },
  {
    id: 2,
    initials: 'AM',
    color: '#AF52DE',
    name: 'Arjun Mehta',
    message: 'Sent the deck: take a look before the sync',
    time: '4m',
  },
  {
    id: 3,
    initials: 'MC',
    color: '#007AFF',
    name: 'Maya Chen',
    message: "Can you review the PR when you're free?",
    time: '12m',
  },
  {
    id: 4,
    initials: 'RK',
    color: '#FF9500',
    name: 'Ravi Kumar',
    message: 'Deployed v2.3 to staging, looks good so far',
    time: '18m',
  },
  {
    id: 5,
    initials: 'SS',
    color: '#FF2D55',
    name: 'Sara Singh',
    message: 'The figma file has been updated with the new flows',
    time: '25m',
  },
  {
    id: 6,
    initials: 'DG',
    color: '#5856D6',
    name: 'Dev Gupta',
    message: 'Can we push the standup to 11:30 today?',
    time: '32m',
  },
  {
    id: 7,
    initials: 'NK',
    color: '#30B0C7',
    name: 'Neha Kapoor',
    message: 'Merged the auth PR, ready for review on prod',
    time: '45m',
  },
];

function SwipeableNotification({ n, onDelete }: { n: any; onDelete: () => void }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative w-full"
    >
      {/* Background delete button */}
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
        className="flex gap-3 items-start py-2.5 px-0.5 relative z-10 w-full cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: "var(--dynamic-island-bg)" }}
      >
        <div 
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[11px] relative shrink-0 text-white"
          style={{ backgroundColor: n.color }}
        >
          {n.initials}
          <div 
            className="absolute -bottom-[1px] -right-[1px] w-[12px] h-[12px] rounded-full border-[2px] border-black flex items-center justify-center"
            style={{ backgroundColor: n.color }}
          >
            <MessageCircle className="w-[6px] h-[6px] text-white fill-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-semibold text-[13px] text-white leading-none">{n.name}</h4>
            <span className="text-[10px] text-zinc-500 ml-2 shrink-0">{n.time}</span>
          </div>
          <p className="text-[11.5px] text-zinc-400 leading-snug">{n.message}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DynamicIsland() {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);

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

  const filteredNotifications = notifs.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const baseHeight = 125; // top spacer, search bar, and padding
  const notificationHeight = filteredNotifications.length > 0 
    ? Math.min(3, filteredNotifications.length) * 62 
    : 80; // height for empty state
  const targetHeight = expanded ? baseHeight + notificationHeight : BEZEL_H + NOTCH_H;

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
                <span className="text-[10px] font-bold text-[#FF9500]">2</span>
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
                  {/* Top row: three-dot menu */}
                  <div className="flex justify-end items-center mb-2 pr-0.5">
                    <button className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Notifications */}
                  <div className="flex flex-col gap-0 flex-1 overflow-y-auto scrollbar-none scroll-mask py-1">
                    <AnimatePresence>
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((n) => (
                          <SwipeableNotification 
                            key={n.id} 
                            n={n} 
                            onDelete={() => setNotifs(prev => prev.filter(item => item.id !== n.id))} 
                          />
                        ))
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="flex flex-col items-center justify-center flex-1 text-zinc-500 text-[11.5px] py-8"
                        >
                          No results found
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
                        placeholder="Search notifications..." 
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
