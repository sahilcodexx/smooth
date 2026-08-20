"use client";

/**
 * @author: @dorianbaffier
 * @description: Kokonut UI Toolbar
 * @version: 1.0.0
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToolbarItem {
  id: string;
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
  iconClassName?: string;
  showLabelAlways?: boolean;
  customElement?: React.ReactNode;
}

interface ToolbarProps {
  items: ToolbarItem[];
  defaultSelected?: string;
  className?: string;
  activeColor?: string;
  onSelect?: (itemId: string) => void;
  toggleButton?: {
    iconOn: LucideIcon;
    iconOff: LucideIcon;
    labelOn: string;
    labelOff: string;
    isToggled: boolean;
    onToggle: () => void;
  };
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "0.85rem" : ".5rem",
    paddingRight: isSelected ? "0.85rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { type: "spring", bounce: 0, duration: 0.35 };

export function Toolbar({
  items,
  defaultSelected,
  className,
  onSelect,
  toggleButton,
}: ToolbarProps) {
  const [selected, setSelected] = React.useState<string | null>(
    defaultSelected ?? null
  );
  const [hovered, setHovered] = React.useState<string | null>(null);

  const handleItemHover = (item: ToolbarItem) => {
    setHovered(item.id);
  };

  const handleItemLeave = () => {
    setHovered(null);
  };

  const handleItemClick = (item: ToolbarItem) => {
    setSelected(selected === item.id ? null : item.id);
    item.onClick?.();
    onSelect?.(item.id);
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex items-center gap-3 p-2",
          "bg-zinc-950/95 dark:bg-[#09090b]/95 border border-zinc-800/80 shadow-2xl backdrop-blur-md",
          "rounded-xl border",
          "transition-all duration-200 ring-1 ring-white/10",
          className
        )}
      >
        <div className="flex items-center gap-2">
          {items.map((item) => {
            const isSelected = selected === item.id || hovered === item.id;
            const shouldShowLabel = isSelected || !!item.showLabelAlways;

            if (item.customElement) {
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => handleItemHover(item)}
                  onMouseLeave={handleItemLeave}
                >
                  {item.customElement}
                </div>
              );
            }
            return (
              <motion.button
                animate="animate"
                className={cn(
                  "relative flex items-center rounded-none px-3 py-2 cursor-pointer outline-none select-none",
                  "font-medium text-sm transition-colors duration-300",
                  isSelected
                    ? "rounded-lg bg-[#1F9CFE] text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                )}
                custom={shouldShowLabel}
                initial={false}
                key={item.id}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => handleItemHover(item)}
                onMouseLeave={handleItemLeave}
                transition={transition as any}
                variants={buttonVariants as any}
              >
                <item.icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    item.iconClassName,
                    isSelected && "text-white"
                  )}
                />
                <AnimatePresence initial={false}>
                  {shouldShowLabel && (
                    <motion.span
                      animate="animate"
                      className="overflow-hidden whitespace-nowrap font-medium text-xs ml-1"
                      exit="exit"
                      initial="initial"
                      transition={transition as any}
                      variants={spanVariants as any}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}

          {toggleButton && (
            <motion.button
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none select-none",
                "rounded-lg border shadow-sm transition-all duration-200",
                "hover:shadow-md active:border-[#1F9CFE]/50",
                toggleButton.isToggled
                  ? [
                      "bg-[#1F9CFE] text-white",
                      "border-[#1F9CFE]/30",
                      "hover:bg-[#1F9CFE]/90",
                      "hover:border-[#1F9CFE]/40",
                    ]
                  : [
                      "bg-zinc-900 text-zinc-400",
                      "border-zinc-800/80",
                      "hover:bg-zinc-800",
                      "hover:text-zinc-100",
                      "hover:border-zinc-700",
                    ]
              )}
              onClick={toggleButton.onToggle}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {toggleButton.isToggled ? (
                <toggleButton.iconOn className="h-3.5 w-3.5" />
              ) : (
                <toggleButton.iconOff className="h-3.5 w-3.5" />
              )}
              <span className="font-medium text-xs">
                {toggleButton.isToggled
                  ? toggleButton.labelOn
                  : toggleButton.labelOff}
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
