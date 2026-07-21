import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, g as addAttribute, i as renderComponent, m as maybeRenderHead, u as renderTemplate, x as unescapeHTML } from "./server_B3ajq7C2.mjs";
import { t as createComponent } from "./compiler_Cph2OPRR.mjs";
import { t as getSessionUser } from "./auth_ksKHsCDa.mjs";
import { t as $$Layout } from "./Layout_yyyhhAcd.mjs";
import { a as TooltipContent, c as Separator, i as Tooltip, l as Dock, n as DropdownMenuContent, o as TooltipProvider, r as DropdownMenuTrigger, s as TooltipTrigger, t as DropdownMenu, u as DockIcon } from "./dropdown-menu_l_xb4JV9.mjs";
import { useEffect, useState } from "react";
import { neon } from "@neondatabase/serverless";
import { Home, LayoutGrid, LogIn, LogOut, Moon, Plus, Sliders, Sun, Type } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
import { marked } from "marked";
//#region src/components/HomeToolbar.tsx
function HomeToolbar() {
	const [isDark, setIsDark] = useState(true);
	const [fontFamily, setFontFamily] = useState("sans");
	const [fontSize, setFontSize] = useState(15);
	const [readingWidth, setReadingWidth] = useState(37);
	const [user, setUser] = useState(null);
	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"));
		const savedFont = localStorage.getItem("reader_font") || "sans";
		const savedSize = localStorage.getItem("reader_size") || "15";
		const savedWidth = localStorage.getItem("reader_width") || "37";
		setFontFamily(savedFont);
		setFontSize(parseInt(savedSize));
		setReadingWidth(parseInt(savedWidth));
		applySettings(savedFont, parseInt(savedSize), parseInt(savedWidth));
		fetch("/api/auth/session").then((res) => res.json()).then((data) => {
			if (data.user) setUser(data.user);
		}).catch(console.error);
	}, []);
	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			setUser(null);
			window.location.reload();
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
	const applySettings = (font, size, width) => {
		const root = document.documentElement;
		root.style.setProperty("--font-choice", font === "sans" ? "'Geist Variable', sans-serif" : "Georgia, Cambria, 'Times New Roman', serif");
		root.style.setProperty("--global-typeset-size", `${size}px`);
		root.style.setProperty("--reading-width", `${width}em`);
	};
	const handleFontChange = (font) => {
		setFontFamily(font);
		localStorage.setItem("reader_font", font);
		applySettings(font, fontSize, readingWidth);
	};
	const handleSizeChange = (size) => {
		setFontSize(size);
		localStorage.setItem("reader_size", size.toString());
		applySettings(fontFamily, size, readingWidth);
	};
	const handleWidthChange = (width) => {
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
	return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx("div", {
		className: "dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto",
		children: /* @__PURE__ */ jsxs(Dock, {
			className: `bg-[#09090b]/96 border border-zinc-800/80 rounded-full px-3 py-2 flex items-center gap-1.5 ring-1 ring-white/10 ${isDark ? "shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "shadow-none"}`,
			iconSize: 40,
			iconMagnification: 58,
			children: [
				/* @__PURE__ */ jsx(DockIcon, {
					className: "text-zinc-400 hover:text-zinc-100 transition-colors",
					onClick: () => window.location.href = "/",
					children: /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsx(Home, { className: "size-full" })
					}), /* @__PURE__ */ jsx(TooltipContent, {
						className: "bg-zinc-900 text-zinc-50 border-zinc-800",
						sideOffset: 12,
						children: /* @__PURE__ */ jsx("p", { children: "Go Home" })
					})] })
				}),
				/* @__PURE__ */ jsx(Separator, {
					orientation: "vertical",
					className: "mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
				}),
				/* @__PURE__ */ jsx(DockIcon, {
					className: "text-zinc-400 hover:text-zinc-100 transition-colors",
					onClick: () => window.location.href = "/create?new=true",
					children: /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsx(Plus, { className: "size-full" })
					}), /* @__PURE__ */ jsx(TooltipContent, {
						className: "bg-zinc-900 text-zinc-50 border-zinc-800",
						sideOffset: 12,
						children: /* @__PURE__ */ jsx("p", { children: "New Post" })
					})] })
				}),
				/* @__PURE__ */ jsx(Separator, {
					orientation: "vertical",
					className: "mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
				}),
				/* @__PURE__ */ jsx(DockIcon, {
					className: "text-zinc-400 hover:text-zinc-100 transition-colors",
					children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsx(DropdownMenuTrigger, {
							asChild: true,
							children: /* @__PURE__ */ jsx(Sliders, { className: "size-full" })
						})
					}), /* @__PURE__ */ jsx(TooltipContent, {
						className: "bg-zinc-900 text-zinc-50 border-zinc-800",
						sideOffset: 12,
						children: /* @__PURE__ */ jsx("p", { children: "Reader Settings" })
					})] }), /* @__PURE__ */ jsxs(DropdownMenuContent, {
						className: "w-64 bg-[#09090b] border border-zinc-800/80 shadow-2xl text-zinc-300 rounded-2xl p-4 flex flex-col gap-4",
						align: "center",
						sideOffset: 12,
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-[10px] text-zinc-500 font-semibold uppercase tracking-wider",
									children: "Font Family"
								}), /* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-2 gap-1 bg-zinc-900/50 p-0.5 rounded-lg border border-zinc-800/40",
									children: [/* @__PURE__ */ jsx("button", {
										onClick: () => handleFontChange("sans"),
										className: `py-1 px-3 rounded-md text-xs font-medium transition-all ${fontFamily === "sans" ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`,
										children: "Sans-Serif"
									}), /* @__PURE__ */ jsx("button", {
										onClick: () => handleFontChange("serif"),
										className: `py-1 px-3 rounded-md text-xs font-medium transition-all ${fontFamily === "serif" ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`,
										children: "Serif"
									})]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between items-center",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-[10px] text-zinc-500 font-semibold uppercase tracking-wider",
										children: "Font Size"
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-[11px] font-mono text-zinc-400",
										children: [fontSize, "px"]
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ jsx(Type, { className: "w-3.5 h-3.5 text-zinc-600" }),
										/* @__PURE__ */ jsx("input", {
											type: "range",
											min: "13",
											max: "22",
											value: fontSize,
											onChange: (e) => handleSizeChange(parseInt(e.target.value)),
											className: "flex-1 accent-zinc-200 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
										}),
										/* @__PURE__ */ jsx(Type, { className: "w-4.5 h-4.5 text-zinc-400" })
									]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between items-center",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-[10px] text-zinc-500 font-semibold uppercase tracking-wider",
										children: "Reading Measure"
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-[11px] font-mono text-zinc-400",
										children: [readingWidth, "em"]
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ jsx(LayoutGrid, { className: "w-3.5 h-3.5 text-zinc-600" }),
										/* @__PURE__ */ jsx("input", {
											type: "range",
											min: "28",
											max: "46",
											value: readingWidth,
											onChange: (e) => handleWidthChange(parseInt(e.target.value)),
											className: "flex-1 accent-zinc-200 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
										}),
										/* @__PURE__ */ jsx(LayoutGrid, { className: "w-4.5 h-4.5 text-zinc-400" })
									]
								})]
							}),
							/* @__PURE__ */ jsx(Separator, { className: "bg-zinc-800/40" }),
							/* @__PURE__ */ jsx("button", {
								onClick: handleReset,
								className: "w-full py-1.5 px-3 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 transition-all border border-zinc-800/40 text-center",
								children: "Reset to Defaults"
							})
						]
					})] })
				}),
				/* @__PURE__ */ jsx(Separator, {
					orientation: "vertical",
					className: "mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
				}),
				/* @__PURE__ */ jsx(DockIcon, {
					className: "text-zinc-400 hover:text-zinc-100 transition-colors",
					onClick: toggleTheme,
					children: /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: isDark ? /* @__PURE__ */ jsx(Sun, { className: "size-full" }) : /* @__PURE__ */ jsx(Moon, { className: "size-full" })
					}), /* @__PURE__ */ jsx(TooltipContent, {
						className: "bg-zinc-900 text-zinc-50 border-zinc-800",
						sideOffset: 12,
						children: /* @__PURE__ */ jsx("p", { children: "Toggle Theme" })
					})] })
				}),
				/* @__PURE__ */ jsx(Separator, {
					orientation: "vertical",
					className: "mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
				}),
				/* @__PURE__ */ jsx(DockIcon, {
					className: "text-zinc-400 hover:text-zinc-100 transition-colors",
					onClick: user ? handleLogout : () => window.location.href = "/auth",
					children: /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
						asChild: true,
						children: user ? /* @__PURE__ */ jsx(LogOut, { className: "size-full text-red-400/80 hover:text-red-400" }) : /* @__PURE__ */ jsx(LogIn, { className: "size-full" })
					}), /* @__PURE__ */ jsx(TooltipContent, {
						className: "bg-zinc-900 text-zinc-50 border-zinc-800",
						sideOffset: 12,
						children: /* @__PURE__ */ jsx("p", { children: user ? `Sign Out (${user.email})` : "Sign In" })
					})] })
				})
			]
		})
	}) });
}
//#endregion
//#region src/pages/posts/[id].astro
var _id__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Id,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Id = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$props, $$slots);
	Astro2.self = $$Id;
	const user = await getSessionUser(Astro2.request.headers.get("Cookie"));
	if (!user) return Astro2.redirect("/auth");
	const { id } = Astro2.params;
	const post = (await neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require")`
  SELECT * FROM posts 
  WHERE id = ${id} AND user_id = ${user.id} 
  LIMIT 1;
`)[0];
	if (!post) return Astro2.redirect("/");
	const htmlContent = marked(post.content);
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate`${maybeRenderHead($$result2)}<main class="max-w-[37em]" style="margin: 6rem auto; padding: 2rem 1.25rem;"><div style="margin-bottom: 2rem; display: flex; justify-content: space-between;"><a href="/" style="text-decoration: none; padding: 0.5rem 0; color: var(--color-muted-foreground); font-family: var(--font-geist); font-size: 0.85rem; font-weight: 500; display: flex; align-items: center;">&larr; Back home</a><a${addAttribute(`/create?id=${id}`, "href")} style="text-decoration: none; padding: 0.5rem 1rem; background-color: var(--color-foreground); color: var(--color-background); border-radius: 9999px; font-size: 0.85rem; font-weight: 500; transition: opacity 0.2s; font-family: var(--font-geist);" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">Edit</a></div><div class="typeset typeset-article max-w-[37em]">${unescapeHTML(htmlContent)}</div></main>${renderComponent($$result2, "HomeToolbar", HomeToolbar, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/sahilcodex/Documents/smooth/src/components/HomeToolbar.tsx",
		"client:component-export": "HomeToolbar"
	})}` })}`;
}, "/home/sahilcodex/Documents/smooth/src/pages/posts/[id].astro", void 0);
var $$file = "/home/sahilcodex/Documents/smooth/src/pages/posts/[id].astro";
var $$url = "/posts/[id]";
//#endregion
//#region \0virtual:astro:page:src/pages/posts/[id]@_@astro
var page = () => _id__exports;
//#endregion
export { page };
