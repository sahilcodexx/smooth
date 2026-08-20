import { useState, useEffect } from "react";
import {
  Plus,
  Sliders,
  Sun,
  Moon,
  Type,
  LayoutGrid,
  LogIn,
  LogOut,
  Home,
} from "lucide-react";
import { Toolbar, type ToolbarItem } from "./kokonutui/toolbar";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function HomeToolbar({
  neonAuthUrl,
  initialUser,
}: {
  neonAuthUrl?: string;
  initialUser?: { id: string; email: string } | null;
}) {
  const [isDark, setIsDark] = useState(true);
  const [fontFamily, setFontFamily] = useState("sans");
  const [fontSize, setFontSize] = useState(15);
  const [readingWidth, setReadingWidth] = useState(37);
  const [user, setUser] = useState<{ id: string; email: string } | null>(
    initialUser ?? null
  );

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const savedFont = localStorage.getItem("reader_font") || "sans";
    const savedSize = localStorage.getItem("reader_size") || "15";
    const savedWidth = localStorage.getItem("reader_width") || "37";

    setFontFamily(savedFont);
    setFontSize(parseInt(savedSize));
    setReadingWidth(parseInt(savedWidth));

    applySettings(savedFont, parseInt(savedSize), parseInt(savedWidth));
  }, []);

  const handleLogout = async () => {
    try {
      if (neonAuthUrl) {
        await fetch(`${neonAuthUrl}/sign-out`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        }).catch(() => undefined);
      }

      await fetch("/api/auth/logout", { method: "POST" });
      sessionStorage.removeItem("neon_oauth_pending");
      setUser(null);
      window.location.href = "/auth";
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const applySettings = (font: string, size: number, width: number) => {
    const root = document.documentElement;
    root.style.setProperty(
      "--font-choice",
      font === "sans"
        ? "'Geist Variable', sans-serif"
        : "Georgia, Cambria, 'Times New Roman', serif"
    );
    root.style.setProperty("--global-typeset-size", `${size}px`);
    root.style.setProperty("--reading-width", `${width}em`);
  };

  const handleFontChange = (font: string) => {
    setFontFamily(font);
    localStorage.setItem("reader_font", font);
    applySettings(font, fontSize, readingWidth);
  };

  const handleSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem("reader_size", size.toString());
    applySettings(fontFamily, size, readingWidth);
  };

  const handleWidthChange = (width: number) => {
    setReadingWidth(width);
    localStorage.setItem("reader_width", width.toString());
    applySettings(fontFamily, fontSize, width);
  };

  const handleReset = () => {
    setFontFamily("sans");
    setFontSize(15);
    setReadingWidth(37);
    localStorage.removeItem("reader_font");
    localStorage.removeItem("reader_size");
    localStorage.removeItem("reader_width");
    applySettings("sans", 15, 37);
  };

  const toolbarItems: ToolbarItem[] = [
    {
      id: "home",
      title: "Home",
      icon: Home,
      onClick: () => {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      },
    },
    {
      id: "create",
      title: "New Post",
      icon: Plus,
      onClick: () => {
        window.location.href = "/create?new=true";
      },
    },
    {
      id: "theme",
      title: isDark ? "Light Mode" : "Dark Mode",
      icon: isDark ? Sun : Moon,
      onClick: toggleTheme,
    },
    {
      id: "auth",
      title: user ? "Sign Out" : "Sign In",
      icon: user ? LogOut : LogIn,
      showLabelAlways: true,
      iconClassName: user ? "text-red-400" : undefined,
      onClick: user ? handleLogout : () => (window.location.href = "/auth"),
    },
  ];

  return (
    <div className="dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-2">
      <Toolbar items={toolbarItems} />

      {/* Reader Settings Dropdown trigger next to toolbar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center size-10 rounded-2xl bg-[#09090b]/95 border border-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 shadow-2xl backdrop-blur-md transition-all outline-none ring-1 ring-white/10">
            <Sliders className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 bg-[#09090b] border border-zinc-800/80 shadow-2xl text-zinc-300 rounded-2xl p-4 flex flex-col gap-4"
          align="end"
          sideOffset={12}
        >
          {/* Font family selection */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Font Family
            </span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-900/50 p-0.5 rounded-lg border border-zinc-800/40">
              <button
                onClick={() => handleFontChange("sans")}
                className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${
                  fontFamily === "sans"
                    ? "bg-zinc-800 text-zinc-50 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sans-Serif
              </button>
              <button
                onClick={() => handleFontChange("serif")}
                className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${
                  fontFamily === "serif"
                    ? "bg-zinc-800 text-zinc-50 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Serif
              </button>
            </div>
          </div>

          {/* Font Size slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Font Size
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {fontSize}px
              </span>
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
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                Reading Measure
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {readingWidth}em
              </span>
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
    </div>
  );
}
