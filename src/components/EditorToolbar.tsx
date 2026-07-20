import { useState, useEffect } from 'react';
import { type Editor } from '@tiptap/react';
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
  Sun
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from './ui/dropdown-menu';

interface EditorToolbarProps {
  editor: Editor | null;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  onNewPost: () => void;
}

export function EditorToolbar({ editor, fontSize, setFontSize, onNewPost }: EditorToolbarProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!editor) return null;

  return (
    <TooltipProvider>
      <div className={`dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 bg-[#09090b]/96 backdrop-blur-xl border border-zinc-800/80 rounded-full max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-none ring-1 ring-white/10 ${isDark ? 'shadow-[0_12px_40px_rgba(0,0,0,0.6)]' : 'shadow-none'}`}>
        {/* Bold */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full transition-colors ${editor.isActive('bold') ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100'}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Bold</p></TooltipContent>
        </Tooltip>

        {/* Italic */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full transition-colors ${editor.isActive('italic') ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-100'}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Italic</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Undo</p></TooltipContent>
        </Tooltip>

        {/* Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Redo</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100"
            onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="px-2 py-1 bg-zinc-800/50 rounded-md text-xs font-mono text-zinc-400 select-none w-10 text-center">
            {fontSize}PX
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100"
            onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Format Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 rounded-full gap-1 text-zinc-300 hover:text-zinc-100 font-normal px-4 hover:bg-zinc-800">
              Format <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#18181b] border-zinc-800/60 shadow-xl text-zinc-300 rounded-xl p-1" align="end" sideOffset={12}>
            
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-zinc-500 font-medium text-xs px-2 py-1.5">Block Style</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().setParagraph().run()}>
                <Type /> Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 /> Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 /> Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 /> Heading 3
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-zinc-800/60 mx-1" />
            
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-zinc-500 font-medium text-xs px-2 py-1.5">Lists</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List /> Bullet List
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered /> Numbered List
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-zinc-800/60 mx-1" />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-zinc-500 font-medium text-xs px-2 py-1.5">Insert</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote /> Blockquote
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code /> Code Block
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-50" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <SquareSlash /> Divider
              </DropdownMenuItem>
            </DropdownMenuGroup>

          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Create Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
              onClick={onNewPost}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Start a new post</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Copy Markdown */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-zinc-800/60 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-50 gap-2 px-4 shadow-sm transition-colors"
              onClick={() => {
                // @ts-ignore
                const md = editor.storage.markdown.getMarkdown();
                navigator.clipboard.writeText(md);
              }}
            >
              <Copy className="h-3.5 w-3.5 opacity-70" /> 
              <span className="font-medium text-xs tracking-wide">Markdown</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Copy Markdown</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Toggle Theme</p></TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  );
}
