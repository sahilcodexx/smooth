import { useState, useEffect } from 'react';
import { Plus, Sliders, Sun, Moon, Type, LayoutGrid, LogIn, Home } from 'lucide-react';
import { Dock, DockIcon } from './ui/dock';
import { Separator } from './ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function HomeToolbar() {
  const [isDark, setIsDark] = useState(true);
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontSize, setFontSize] = useState(15);
  const [readingWidth, setReadingWidth] = useState(37);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const savedFont = localStorage.getItem('reader_font') || 'sans';
    const savedSize = localStorage.getItem('reader_size') || '15';
    const savedWidth = localStorage.getItem('reader_width') || '37';

    setFontFamily(savedFont);
    setFontSize(parseInt(savedSize));
    setReadingWidth(parseInt(savedWidth));

    applySettings(savedFont, parseInt(savedSize), parseInt(savedWidth));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const applySettings = (font: string, size: number, width: number) => {
    const root = document.documentElement;
    root.style.setProperty('--font-choice', font === 'sans' ? "'Geist Variable', sans-serif" : "Georgia, Cambria, 'Times New Roman', serif");
    root.style.setProperty('--global-typeset-size', `${size}px`);
    root.style.setProperty('--reading-width', `${width}em`);
  };

  const handleFontChange = (font: string) => {
    setFontFamily(font);
    localStorage.setItem('reader_font', font);
    applySettings(font, fontSize, readingWidth);
  };

  const handleSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('reader_size', size.toString());
    applySettings(fontFamily, size, readingWidth);
  };

  const handleWidthChange = (width: number) => {
    setReadingWidth(width);
    localStorage.setItem('reader_width', width.toString());
    applySettings(fontFamily, fontSize, width);
  };

  const handleReset = () => {
    setFontFamily('sans');
    setFontSize(15);
    setReadingWidth(37);
    localStorage.removeItem('reader_font');
    localStorage.removeItem('reader_size');
    localStorage.removeItem('reader_width');
    applySettings('sans', 15, 37);
  };

  return (
    <TooltipProvider>
      <div className="dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <Dock className={`bg-[#09090b]/96 border border-zinc-800/80 rounded-full px-3 py-2 flex items-center gap-1.5 ring-1 ring-white/10 ${isDark ? 'shadow-[0_12px_40px_rgba(0,0,0,0.6)]' : 'shadow-none'}`} iconSize={40} iconMagnification={58}>
          
          {/* Home Link */}
          <DockIcon 
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            onClick={() => window.location.href = '/'}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Home className="size-full" />
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Go Home</p></TooltipContent>
            </Tooltip>
          </DockIcon>

          <Separator orientation="vertical" className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0" />

          {/* Create Post */}
          <DockIcon 
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            onClick={() => window.location.href = '/create?new=true'}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Plus className="size-full" />
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>New Post</p></TooltipContent>
            </Tooltip>
          </DockIcon>

          <Separator orientation="vertical" className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0" />

          {/* Reader Settings */}
          <DockIcon className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Sliders className="size-full" />
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Reader Settings</p></TooltipContent>
              </Tooltip>
              <DropdownMenuContent className="w-64 bg-[#09090b] border border-zinc-800/80 shadow-2xl text-zinc-300 rounded-2xl p-4 flex flex-col gap-4" align="center" sideOffset={12}>
                
                {/* Font family selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Font Family</span>
                  <div className="grid grid-cols-2 gap-1 bg-zinc-900/50 p-0.5 rounded-lg border border-zinc-800/40">
                    <button 
                      onClick={() => handleFontChange('sans')}
                      className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${fontFamily === 'sans' ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Sans-Serif
                    </button>
                    <button 
                      onClick={() => handleFontChange('serif')}
                      className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${fontFamily === 'serif' ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Serif
                    </button>
                  </div>
                </div>

                {/* Font Size slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Font Size</span>
                    <span className="text-[11px] font-mono text-zinc-400">{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-zinc-600" />
                    <input 
                      type="range" 
                      min="13" 
                      max="22" 
                      value={fontSize}
                      onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                      className="flex-1 accent-zinc-200 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer" 
                    />
                    <Type className="w-4.5 h-4.5 text-zinc-400" />
                  </div>
                </div>

                {/* Reading Width slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Reading Measure</span>
                    <span className="text-[11px] font-mono text-zinc-400">{readingWidth}em</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-zinc-600" />
                    <input 
                      type="range" 
                      min="28" 
                      max="46" 
                      value={readingWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                      className="flex-1 accent-zinc-200 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer" 
                    />
                    <LayoutGrid className="w-4.5 h-4.5 text-zinc-400" />
                  </div>
                </div>

                <Separator className="bg-zinc-800/40" />

                <button 
                  onClick={handleReset}
                  className="w-full py-1.5 px-3 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 transition-all border border-zinc-800/40 text-center"
                >
                  Reset to Defaults
                </button>
              </DropdownMenuContent>
            </DropdownMenu>
          </DockIcon>

          <Separator orientation="vertical" className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0" />

          {/* Theme Toggle */}
          <DockIcon 
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            onClick={toggleTheme}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                {isDark ? <Sun className="size-full" /> : <Moon className="size-full" />}
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Toggle Theme</p></TooltipContent>
            </Tooltip>
          </DockIcon>

          <Separator orientation="vertical" className="mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0" />

          {/* Sign In */}
          <DockIcon 
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            onClick={() => alert('Sign in feature coming soon!')}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <LogIn className="size-full" />
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Sign In</p></TooltipContent>
            </Tooltip>
          </DockIcon>

        </Dock>
      </div>
    </TooltipProvider>
  );
}
