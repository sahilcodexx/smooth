import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_B3ajq7C2.mjs";
import { t as createComponent } from "./compiler_Cph2OPRR.mjs";
import { t as getSessionUser } from "./auth_ksKHsCDa.mjs";
import { t as $$Layout } from "./Layout_yyyhhAcd.mjs";
import { a as TooltipContent, c as Separator, i as Tooltip, l as Dock, n as DropdownMenuContent, o as TooltipProvider, r as DropdownMenuTrigger, s as TooltipTrigger, t as DropdownMenu, u as DockIcon } from "./dropdown-menu_l_xb4JV9.mjs";
import { useEffect, useState } from "react";
import { neon } from "@neondatabase/serverless";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, LogIn, LogOut, Moon, Plus, Sliders, Sun, Trash2, Type, X } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/PostFeed.tsx
function PostFeed({ initialPosts }) {
	const [posts, setPosts] = useState(initialPosts);
	const [isDeleteMode, setIsDeleteMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
	const [user, setUser] = useState(null);
	const [isDark, setIsDark] = useState(true);
	const [fontFamily, setFontFamily] = useState("sans");
	const [fontSize, setFontSize] = useState(15);
	const [readingWidth, setReadingWidth] = useState(37);
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
	const toggleSelect = (id) => {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		setSelectedIds(next);
	};
	const handleBatchDelete = async () => {
		if (selectedIds.size === 0) return;
		if (!confirm(`Are you sure you want to delete the ${selectedIds.size} selected post(s)?`)) return;
		try {
			const idsArray = Array.from(selectedIds);
			if ((await fetch("/api/posts", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: idsArray })
			})).ok) {
				setPosts(posts.filter((p) => !selectedIds.has(p.id)));
				setSelectedIds(/* @__PURE__ */ new Set());
				setIsDeleteMode(false);
			} else alert("Failed to delete posts");
		} catch (err) {
			console.error(err);
			alert("Error deleting posts");
		}
	};
	const formatDate = (dateStr) => {
		if (!dateStr) return "";
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		});
	};
	const truncateTitle = (title) => {
		if (!title) return "Untitled Note";
		const words = title.split(/\s+/);
		if (words.length <= 6) return title;
		return words.slice(0, 6).join(" ") + "...";
	};
	const handleItemClick = (e, postId) => {
		if (isDeleteMode) {
			e.preventDefault();
			toggleSelect(postId);
		}
	};
	return /* @__PURE__ */ jsxs(TooltipProvider, { children: [/* @__PURE__ */ jsxs("main", {
		className: "max-w-[37em]",
		style: {
			margin: "6rem auto",
			padding: "2rem 1.25rem",
			fontFamily: "var(--font-choice, var(--font-geist))"
		},
		children: [/* @__PURE__ */ jsxs("div", {
			style: {
				marginBottom: "2rem",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center"
			},
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				style: {
					margin: 0,
					fontSize: "2.2rem",
					fontWeight: 400,
					fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
					fontStyle: "italic",
					letterSpacing: "-0.01em",
					color: "var(--color-foreground)"
				},
				children: "unmindful"
			}), user ? /* @__PURE__ */ jsxs("p", {
				style: {
					margin: "0.3rem 0 0 0",
					fontSize: "0.85rem",
					color: "var(--color-muted-foreground)"
				},
				children: ["logged in as ", /* @__PURE__ */ jsx("span", {
					className: "font-mono text-zinc-300 font-semibold",
					children: user.email
				})]
			}) : /* @__PURE__ */ jsx("p", {
				style: {
					margin: "0.3rem 0 0 0",
					fontSize: "0.85rem",
					color: "var(--color-muted-foreground)"
				},
				children: "write your random thought"
			})] }), /* @__PURE__ */ jsx("a", {
				href: "/create?new=true",
				style: {
					textDecoration: "none",
					padding: "0.5rem 1rem",
					backgroundColor: "var(--color-foreground)",
					color: "var(--color-background)",
					borderRadius: "9999px",
					fontSize: "0.85rem",
					fontWeight: 500,
					transition: "opacity 0.2s"
				},
				children: "New post"
			})]
		}), /* @__PURE__ */ jsx("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 0,
				marginTop: "1rem"
			},
			children: posts.length > 0 ? posts.map((post) => /* @__PURE__ */ jsx("a", {
				href: `/posts/${post.id}`,
				onClick: (e) => handleItemClick(e, post.id),
				style: {
					textDecoration: "none",
					display: "block",
					padding: "0.75rem 0",
					borderBottom: "1px solid var(--color-border)",
					transition: "border-color 0.2s"
				},
				className: "post-item",
				children: /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: "0.5rem"
					},
					children: [/* @__PURE__ */ jsx(motion.div, {
						initial: false,
						animate: {
							width: isDeleteMode ? 28 : 0,
							opacity: isDeleteMode ? 1 : 0
						},
						transition: {
							type: "spring",
							stiffness: 400,
							damping: 30
						},
						className: "overflow-hidden flex items-center shrink-0",
						onClick: (e) => e.stopPropagation(),
						children: /* @__PURE__ */ jsx("input", {
							type: "checkbox",
							checked: selectedIds.has(post.id),
							onChange: () => toggleSelect(post.id),
							className: "w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500 accent-[#FF9500] cursor-pointer"
						})
					}), /* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "baseline",
							gap: "1rem",
							flex: 1,
							minWidth: 0
						},
						children: [/* @__PURE__ */ jsx("h2", {
							style: {
								margin: 0,
								fontSize: "1.05rem",
								fontWeight: 400,
								color: "var(--color-foreground)",
								transition: "color 0.2s"
							},
							className: "post-title-link",
							children: truncateTitle(post.title)
						}), /* @__PURE__ */ jsx("span", {
							style: {
								fontSize: "0.8rem",
								color: "var(--color-muted-foreground)",
								fontFamily: "var(--font-geist-mono)",
								flexShrink: 0
							},
							children: formatDate(post.created_at)
						})]
					})]
				})
			}, post.id)) : /* @__PURE__ */ jsxs("div", {
				style: {
					textAlign: "center",
					padding: "4rem 1rem",
					border: "1px dashed var(--color-border)",
					borderRadius: "0.75rem"
				},
				children: [/* @__PURE__ */ jsx("p", {
					style: {
						color: "var(--color-muted-foreground)",
						marginBottom: "1.5rem",
						fontSize: "0.95rem"
					},
					children: "No posts yet. Start sharing your thoughts."
				}), /* @__PURE__ */ jsx("a", {
					href: "/create?new=true",
					style: {
						textDecoration: "none",
						padding: "0.6rem 1.25rem",
						backgroundColor: "var(--color-foreground)",
						color: "var(--color-background)",
						borderRadius: "9999px",
						fontSize: "0.85rem",
						fontWeight: 500
					},
					children: "Write your first post"
				})]
			})
		})]
	}), /* @__PURE__ */ jsx("div", {
		className: "dark fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto",
		children: /* @__PURE__ */ jsx(AnimatePresence, {
			mode: "wait",
			children: !isDeleteMode ? /* @__PURE__ */ jsx(motion.div, {
				initial: {
					opacity: 0,
					y: 15
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: {
					opacity: 0,
					y: 15
				},
				transition: { duration: .2 },
				children: /* @__PURE__ */ jsxs(Dock, {
					className: `bg-[#09090b]/96 border border-zinc-800/80 rounded-full px-3 py-2 flex items-center gap-1.5 ring-1 ring-white/10 mx-auto ${isDark ? "shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "shadow-none"}`,
					iconSize: 40,
					iconMagnification: 58,
					children: [
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
							className: "text-zinc-400 hover:text-red-400 transition-colors",
							onClick: () => setIsDeleteMode(true),
							children: /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
								asChild: true,
								children: /* @__PURE__ */ jsx(Trash2, { className: "size-full" })
							}), /* @__PURE__ */ jsx(TooltipContent, {
								className: "bg-zinc-900 text-zinc-50 border-zinc-800",
								sideOffset: 12,
								children: /* @__PURE__ */ jsx("p", { children: "Delete Posts" })
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
			}, "normal-dock") : /* @__PURE__ */ jsx(motion.div, {
				initial: {
					opacity: 0,
					y: 15
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: {
					opacity: 0,
					y: 15
				},
				transition: { duration: .2 },
				children: /* @__PURE__ */ jsxs(Dock, {
					className: `bg-[#09090b]/96 border border-zinc-800/80 ring-1 ring-white/10 mx-auto ${isDark ? "shadow-[0_12px_40px_rgba(0,0,0,0.6)]" : "shadow-none"}`,
					iconSize: 40,
					iconMagnification: 58,
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "flex items-center px-2 shrink-0",
							children: /* @__PURE__ */ jsxs("span", {
								className: "text-[11px] font-medium font-mono text-red-400 select-none",
								children: [selectedIds.size, " Selected"]
							})
						}),
						/* @__PURE__ */ jsx(Separator, {
							orientation: "vertical",
							className: "mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
						}),
						/* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
							asChild: true,
							children: /* @__PURE__ */ jsx(DockIcon, {
								className: `text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors ${selectedIds.size === 0 ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`,
								onClick: handleBatchDelete,
								children: /* @__PURE__ */ jsx(Trash2, { className: "size-full" })
							})
						}), /* @__PURE__ */ jsx(TooltipContent, {
							className: "bg-zinc-900 text-red-200 border-zinc-800",
							sideOffset: 12,
							children: /* @__PURE__ */ jsx("p", { children: "Delete Selected" })
						})] }),
						/* @__PURE__ */ jsx(Separator, {
							orientation: "vertical",
							className: "mx-0.5 h-6 bg-zinc-800/50 self-center shrink-0"
						}),
						/* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
							asChild: true,
							children: /* @__PURE__ */ jsx(DockIcon, {
								className: "text-zinc-400 hover:text-zinc-100 transition-colors",
								onClick: () => {
									setIsDeleteMode(false);
									setSelectedIds(/* @__PURE__ */ new Set());
								},
								children: /* @__PURE__ */ jsx(X, { className: "size-full" })
							})
						}), /* @__PURE__ */ jsx(TooltipContent, {
							className: "bg-zinc-900 text-zinc-50 border-zinc-800",
							sideOffset: 12,
							children: /* @__PURE__ */ jsx("p", { children: "Cancel" })
						})] })
					]
				})
			}, "delete-dock")
		})
	})] });
}
//#endregion
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => ""
});
createAstro("https://astro.build");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$props, $$slots);
	Astro2.self = $$Index;
	const user = await getSessionUser(Astro2.request.headers.get("Cookie"));
	if (!user) return Astro2.redirect("/auth");
	let posts = [];
	let error = null;
	try {
		posts = await neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require")`
    SELECT id, title, created_at 
    FROM posts 
    WHERE user_id = ${user.id} 
    ORDER BY created_at DESC;
  `;
	} catch (err) {
		console.error("Failed to fetch user posts:", err);
		error = "Could not load posts. Make sure DATABASE_URL is configured.";
	}
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate`${error && renderTemplate`${maybeRenderHead($$result2)}<div style="max-width: 37em; margin: 6rem auto 0 auto; padding: 1rem; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 0.5rem; color: #ef4444; font-size: 0.9rem; font-family: var(--font-geist);">${error}</div>`}${renderComponent($$result2, "PostFeed", PostFeed, {
		"initialPosts": posts,
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/sahilcodex/Documents/smooth/src/components/PostFeed.tsx",
		"client:component-export": "PostFeed"
	})}` })}`;
}, "/home/sahilcodex/Documents/smooth/src/pages/index.astro", void 0);
var $$file = "/home/sahilcodex/Documents/smooth/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
