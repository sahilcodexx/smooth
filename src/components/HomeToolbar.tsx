import { useState, useEffect } from 'react';
import { Plus, UserPlus, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from './ui/tooltip';

export function HomeToolbar() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
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

  return (
    <TooltipProvider>
      <div className={`dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 bg-[#09090b]/96 backdrop-blur-xl border border-zinc-800/80 rounded-full max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-none ring-1 ring-white/10 ${isDark ? 'shadow-[0_12px_40px_rgba(0,0,0,0.6)]' : 'shadow-none'}`}>
        
        {/* Create Post */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
              onClick={() => window.location.href = '/create'}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>New Post</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Sign Up (Placeholder) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
              onClick={() => alert('Sign up feature coming soon!')}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-50 border-zinc-800"><p>Sign Up (Coming Soon)</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-800/50" />

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
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
