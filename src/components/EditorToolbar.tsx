import { useState, useEffect, memo } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Undo,
  Redo,
  Minus,
  Plus,
  ChevronDown,
  Copy,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  SquareSlash,
  Code,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { Toolbar, type ToolbarItem } from "./kokonutui/toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "./ui/dropdown-menu";

interface EditorToolbarProps {
  editor: Editor | null;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  onNewPost: () => void;
  onDeletePost?: () => void;
}

export const EditorToolbar = memo(function EditorToolbar({
  editor,
  fontSize,
  setFontSize,
  onNewPost,
  onDeletePost,
}: EditorToolbarProps) {
  const [isDark, setIsDark] = useState(true);
  const [isFormatOpen, setIsFormatOpen] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!editor) return null;

  const toolbarItems: ToolbarItem[] = [
    {
      id: "bold",
      title: "Bold",
      icon: Bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      id: "italic",
      title: "Italic",
      icon: Italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      id: "undo",
      title: "Undo",
      icon: Undo,
      onClick: () => editor.chain().focus().undo().run(),
    },
    {
      id: "redo",
      title: "Redo",
      icon: Redo,
      onClick: () => editor.chain().focus().redo().run(),
    },
    {
      id: "format",
      title: "Format",
      icon: Type,
      customElement: (
        <div
          key="format-dropdown-wrapper"
          onMouseEnter={() => setIsFormatOpen(true)}
          onMouseLeave={() => setIsFormatOpen(false)}
        >
          <DropdownMenu open={isFormatOpen} onOpenChange={setIsFormatOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex items-center gap-1 rounded-none px-2.5 py-2 font-medium text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors duration-300 cursor-pointer outline-none select-none"
              >
                <Type className="size-4 shrink-0 text-zinc-400" />
                <ChevronDown className="size-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-[#09090b] border-zinc-800/80 shadow-2xl text-zinc-300 rounded-xl p-1"
              align="center"
              sideOffset={12}
            >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-zinc-500 font-medium text-xs px-2 py-1.5">
                Block Style
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() => editor.chain().focus().setParagraph().run()}
              >
                <Type className="size-4 mr-2" /> Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                <Heading1 className="size-4 mr-2" /> Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                <Heading2 className="size-4 mr-2" /> Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              >
                <Heading3 className="size-4 mr-2" /> Heading 3
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-zinc-800/60 mx-1" />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-zinc-500 font-medium text-xs px-2 py-1.5">
                Lists
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="size-4 mr-2" /> Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
              >
                <ListOrdered className="size-4 mr-2" /> Numbered List
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-zinc-800/60 mx-1" />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-zinc-500 font-medium text-xs px-2 py-1.5">
                Insert
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="size-4 mr-2" /> Blockquote
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <Code className="size-4 mr-2" /> Code Block
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50"
                onClick={() =>
                  editor.chain().focus().setHorizontalRule().run()
                }
              >
                <SquareSlash className="size-4 mr-2" /> Divider
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      ),
    },
    {
      id: "font-size-dec",
      title: "Decrease Font Size",
      icon: Minus,
      onClick: () => setFontSize((prev) => Math.max(12, prev - 1)),
    },
    {
      id: "font-size-inc",
      title: "Increase Font Size",
      icon: Plus,
      onClick: () => setFontSize((prev) => Math.min(24, prev + 1)),
    },
    {
      id: "new-post",
      title: "New Post",
      icon: Plus,
      onClick: onNewPost,
    },
    {
      id: "copy-markdown",
      title: "Copy Markdown",
      icon: Copy,
      onClick: () => {
        // @ts-ignore
        const md = editor.storage.markdown.getMarkdown();
        navigator.clipboard.writeText(md);
      },
    },
    ...(onDeletePost
      ? [
          {
            id: "delete-post",
            title: "Delete Post",
            icon: Trash2,
            iconClassName: "text-red-400",
            onClick: onDeletePost,
          },
        ]
      : []),
  ];

  return (
    <div className="dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-none">
      <Toolbar
        items={toolbarItems}
        toggleButton={{
          iconOn: Sun,
          iconOff: Moon,
          labelOn: "Light",
          labelOff: "Dark",
          isToggled: !isDark,
          onToggle: toggleTheme,
        }}
      />
    </div>
  );
});
