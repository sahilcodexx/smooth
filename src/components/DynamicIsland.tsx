import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MoreHorizontal, X, CornerDownLeft } from 'lucide-react';

const notifications = [
  {
    initials: 'P',
    color: '#34C759',
    name: 'Priya',
    message: 'Lunch tomorrow? That new ramen place near the office',
    time: 'now',
  },
  {
    initials: 'AM',
    color: '#AF52DE',
    name: 'Arjun Mehta',
    message: 'Sent the deck: take a look before the sync',
    time: '4m',
  },
  {
    initials: 'MC',
    color: '#007AFF',
    name: 'Maya Chen',
    message: "Can you review the PR when you're free?",
    time: '12m',
  },
];

export function DynamicIsland() {
  const [expanded, setExpanded] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

  const BEZEL_H = 6;
  const NOTCH_H = 28;
  const NOTCH_W = 180;
  const R = 16; // fillet radius

  const EXP_W = 380;
  const EXP_H = 310;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      {/* Full-width thin bezel bar — always visible */}
      <div className="absolute top-0 left-0 right-0 bg-black z-10" style={{ height: BEZEL_H }} />

      {/* Notch + fillets, centered */}
      <div className="relative flex justify-center">
        <motion.div
          ref={islandRef}
          layout
          className="relative origin-top"
          initial={false}
          animate={{
            width: expanded ? EXP_W : NOTCH_W,
            height: expanded ? EXP_H : BEZEL_H + NOTCH_H,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Left fillet — concave curve connecting bezel bottom to notch left side */}
          <div
            className="absolute pointer-events-none z-20"
            style={{ 
              top: BEZEL_H, 
              right: '100%', 
              width: R, 
              height: R,
              background: `radial-gradient(circle at 0% 100%, transparent ${R}px, black ${R}px)`,
            }}
          />
          {/* Right fillet */}
          <div
            className="absolute pointer-events-none z-20"
            style={{ 
              top: BEZEL_H, 
              left: '100%', 
              width: R, 
              height: R,
              background: `radial-gradient(circle at 100% 100%, transparent ${R}px, black ${R}px)`,
            }}
          />

          {/* The actual notch body */}
          <motion.div
            layout
            onClick={() => !expanded && setExpanded(true)}
            className="w-full h-full bg-black text-white overflow-hidden flex flex-col items-center justify-start relative pointer-events-auto"
            style={{ cursor: expanded ? 'default' : 'pointer' }}
            animate={{
              borderRadius: expanded ? '0 0 22px 22px' : '0 0 14px 14px',
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >

            {/* === Collapsed State === */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-between px-3 z-10"
              style={{ paddingTop: BEZEL_H }}
              animate={{ opacity: expanded ? 0 : 1 }}
              transition={{ duration: 0.12 }}
            >
              <div className="w-[18px] h-[18px] rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-[18px] h-[18px] rounded-[5px] bg-[#34C759] flex items-center justify-center shadow-[0_0_6px_rgba(52,199,89,0.4)]">
                  <MessageCircle className="w-[10px] h-[10px] text-white fill-white" />
                </div>
                <span className="text-[10px] font-bold text-[#34C759]">2</span>
              </div>
            </motion.div>

            {/* === Expanded State === */}
            <AnimatePresence>
              {expanded && (
                <motion.div 
                  className="absolute inset-0 pt-7 px-4 pb-3.5 flex flex-col w-full h-full z-10"
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
                  <div className="flex flex-col gap-0 flex-1 overflow-y-auto">
                    {notifications.map((n, i) => (
                      <div key={i} className="flex gap-3 items-start py-2.5 px-0.5">
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
                      </div>
                    ))}
                  </div>

                  {/* Reply bar */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="relative flex-1">
                      <CornerDownLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Reply to Priya..." 
                        className="w-full bg-[#1c1c1e] border border-[#333] rounded-full py-[7px] pl-8 pr-4 text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors" 
                      />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
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
