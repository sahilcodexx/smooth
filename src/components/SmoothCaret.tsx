import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

interface SmoothCaretProps {
  editor: Editor | null;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export function SmoothCaret({ editor, wrapperRef }: SmoothCaretProps) {
  const [caretPos, setCaretPos] = useState({ x: 0, y: 0, height: 24 });
  const [isVisible, setIsVisible] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  const lastPosRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor || !wrapperRef.current) return;

    const updateCaret = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

      rafIdRef.current = requestAnimationFrame(() => {
        if (!editor || editor.isDestroyed || !wrapperRef.current) return;

        const { view, isFocused } = editor;
        const { selection } = editor.state;

        // Hide caret if editor is not focused or user selected a range of text
        if (!isFocused || !selection.empty) {
          setIsVisible(false);
          return;
        }

        try {
          const coords = view.coordsAtPos(selection.from);
          if (!coords || !isFinite(coords.left) || !isFinite(coords.top)) {
            setIsVisible(false);
            return;
          }

          const wrapperRect = wrapperRef.current.getBoundingClientRect();
          const x = coords.left - wrapperRect.left;
          const y = coords.top - wrapperRect.top;
          const height = Math.max(18, coords.bottom - coords.top);

          // Calculate distance to detect large cursor jumps (e.g. line jumps or far clicks)
          const dx = x - lastPosRef.current.x;
          const dy = y - lastPosRef.current.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 220) {
            setIsJumping(true);
            window.setTimeout(() => setIsJumping(false), 60);
          } else {
            setIsJumping(false);
          }

          lastPosRef.current = { x, y };
          setCaretPos({ x, y, height });
          setIsVisible(true);
        } catch {
          setIsVisible(false);
        }
      });
    };

    const handleBlur = () => {
      setIsVisible(false);
    };

    editor.on("selectionUpdate", updateCaret);
    editor.on("update", updateCaret);
    editor.on("focus", updateCaret);
    editor.on("blur", handleBlur);
    editor.on("transaction", updateCaret);

    window.addEventListener("resize", updateCaret, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (wrapperRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateCaret();
      });
      resizeObserver.observe(wrapperRef.current);
    }

    // Initial position update
    updateCaret();

    return () => {
      editor.off("selectionUpdate", updateCaret);
      editor.off("update", updateCaret);
      editor.off("focus", updateCaret);
      editor.off("blur", handleBlur);
      editor.off("transaction", updateCaret);

      window.removeEventListener("resize", updateCaret);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [editor, wrapperRef]);

  if (!editor) return null;

  return (
    <div
      className={`smooth-caret-bar ${isJumping ? "smooth-caret-jumping" : ""}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "2px",
        backgroundColor: "var(--color-foreground, currentColor)",
        transform: `translate3d(${caretPos.x}px, ${caretPos.y}px, 0)`,
        height: `${caretPos.height}px`,
        opacity: isVisible ? 1 : 0,
        pointerEvents: "none",
        zIndex: 30,
        willChange: "transform, height, opacity",
      }}
    />
  );
}
