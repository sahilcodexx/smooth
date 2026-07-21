import { C as createAstro, g as addAttribute, h as renderHead, i as renderComponent, s as renderSlot, u as renderTemplate } from "./server_B3ajq7C2.mjs";
import { t as createComponent } from "./compiler_Cph2OPRR.mjs";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, MoreHorizontal, Search, X } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/DynamicIsland.tsx
var notifications = [
	{
		initials: "P",
		color: "#34C759",
		name: "Priya",
		message: "Lunch tomorrow? That new ramen place near the office",
		time: "now"
	},
	{
		initials: "AM",
		color: "#AF52DE",
		name: "Arjun Mehta",
		message: "Sent the deck: take a look before the sync",
		time: "4m"
	},
	{
		initials: "MC",
		color: "#007AFF",
		name: "Maya Chen",
		message: "Can you review the PR when you're free?",
		time: "12m"
	},
	{
		initials: "RK",
		color: "#FF9500",
		name: "Ravi Kumar",
		message: "Deployed v2.3 to staging, looks good so far",
		time: "18m"
	},
	{
		initials: "SS",
		color: "#FF2D55",
		name: "Sara Singh",
		message: "The figma file has been updated with the new flows",
		time: "25m"
	},
	{
		initials: "DG",
		color: "#5856D6",
		name: "Dev Gupta",
		message: "Can we push the standup to 11:30 today?",
		time: "32m"
	},
	{
		initials: "NK",
		color: "#30B0C7",
		name: "Neha Kapoor",
		message: "Merged the auth PR, ready for review on prod",
		time: "45m"
	}
];
function DynamicIsland() {
	const [expanded, setExpanded] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const islandRef = useRef(null);
	useEffect(() => {
		if (!expanded) return;
		const handleClick = (e) => {
			if (islandRef.current && !islandRef.current.contains(e.target)) setExpanded(false);
		};
		document.addEventListener("mousedown", handleClick);
		return () => {
			document.removeEventListener("mousedown", handleClick);
			setSearchQuery("");
		};
	}, [expanded]);
	const BEZEL_H = 6;
	const NOTCH_W = 180;
	const R = 16;
	const EXP_W = 380;
	const filteredNotifications = notifications.filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.message.toLowerCase().includes(searchQuery.toLowerCase()));
	const baseHeight = 125;
	const notificationHeight = filteredNotifications.length > 0 ? Math.min(3, filteredNotifications.length) * 62 : 80;
	const targetHeight = expanded ? baseHeight + notificationHeight : 38;
	return /* @__PURE__ */ jsxs("div", {
		className: "fixed top-0 left-0 right-0 z-[100] pointer-events-none",
		children: [/* @__PURE__ */ jsx("div", {
			className: "absolute top-0 left-0 right-0 bg-black z-10",
			style: { height: BEZEL_H }
		}), /* @__PURE__ */ jsx("div", {
			className: "relative flex justify-center",
			children: /* @__PURE__ */ jsxs(motion.div, {
				ref: islandRef,
				className: "relative origin-top",
				initial: false,
				animate: {
					width: expanded ? EXP_W : NOTCH_W,
					height: targetHeight
				},
				style: {
					width: expanded ? EXP_W : NOTCH_W,
					height: targetHeight
				},
				transition: {
					type: "spring",
					stiffness: 400,
					damping: 30
				},
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "absolute pointer-events-none z-20",
						style: {
							top: BEZEL_H,
							right: "calc(100% - 1px)",
							width: R,
							height: R,
							background: `radial-gradient(circle at 0% 100%, transparent ${R}px, black ${R}px)`
						}
					}),
					/* @__PURE__ */ jsx("div", {
						className: "absolute pointer-events-none z-20",
						style: {
							top: BEZEL_H,
							left: "calc(100% - 1px)",
							width: R,
							height: R,
							background: `radial-gradient(circle at 100% 100%, transparent ${R}px, black ${R}px)`
						}
					}),
					/* @__PURE__ */ jsxs(motion.div, {
						onMouseEnter: () => !expanded && setExpanded(true),
						onMouseLeave: () => expanded && setExpanded(false),
						onClick: () => !expanded && setExpanded(true),
						className: "w-full h-full bg-black text-white overflow-hidden flex flex-col items-center justify-start relative pointer-events-auto",
						style: { cursor: expanded ? "default" : "pointer" },
						animate: { borderRadius: expanded ? "0 0 36px 36px" : "0 0 14px 14px" },
						transition: {
							type: "spring",
							stiffness: 400,
							damping: 30
						},
						children: [/* @__PURE__ */ jsxs(motion.div, {
							className: "absolute inset-0 flex items-center justify-between px-3 z-10",
							style: { paddingTop: BEZEL_H },
							animate: { opacity: expanded ? 0 : 1 },
							transition: { duration: .12 },
							children: [/* @__PURE__ */ jsx("div", {
								className: "w-[18px] h-[18px] rounded-full bg-zinc-700 overflow-hidden flex-shrink-0",
								children: /* @__PURE__ */ jsx("img", {
									src: "https://pbs.twimg.com/profile_images/2078590852268732416/iAHBhHRM_400x400.jpg",
									alt: "",
									className: "w-full h-full object-cover"
								})
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-1.5 flex-shrink-0",
								children: [/* @__PURE__ */ jsx("img", {
									src: "https://eshop.macsales.com/blog/wp-content/uploads/2020/12/Notes-Icon-Big-Sur.png",
									alt: "",
									className: "w-[18px] h-[18px] object-contain flex-shrink-0"
								}), /* @__PURE__ */ jsx("span", {
									className: "text-[10px] font-bold text-[#FF9500]",
									children: "2"
								})]
							})]
						}), /* @__PURE__ */ jsx(AnimatePresence, { children: expanded && /* @__PURE__ */ jsxs(motion.div, {
							className: "absolute inset-0 pt-7 px-5 pb-6 flex flex-col w-full h-full z-10",
							onClick: (e) => {
								if (e.target === e.currentTarget) setExpanded(false);
							},
							initial: { opacity: 0 },
							animate: { opacity: 1 },
							exit: { opacity: 0 },
							transition: {
								duration: .2,
								delay: .08
							},
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "flex justify-end items-center mb-2 pr-0.5",
									children: /* @__PURE__ */ jsx("button", {
										className: "p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors",
										children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "w-4 h-4" })
									})
								}),
								/* @__PURE__ */ jsx("div", {
									className: "flex flex-col gap-0 flex-1 overflow-y-auto scrollbar-none scroll-mask py-1",
									children: filteredNotifications.length > 0 ? filteredNotifications.map((n, i) => /* @__PURE__ */ jsxs("div", {
										className: "flex gap-3 items-start py-2.5 px-0.5",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[11px] relative shrink-0 text-white",
											style: { backgroundColor: n.color },
											children: [n.initials, /* @__PURE__ */ jsx("div", {
												className: "absolute -bottom-[1px] -right-[1px] w-[12px] h-[12px] rounded-full border-[2px] border-black flex items-center justify-center",
												style: { backgroundColor: n.color },
												children: /* @__PURE__ */ jsx(MessageCircle, { className: "w-[6px] h-[6px] text-white fill-white" })
											})]
										}), /* @__PURE__ */ jsxs("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "flex justify-between items-baseline mb-0.5",
												children: [/* @__PURE__ */ jsx("h4", {
													className: "font-semibold text-[13px] text-white leading-none",
													children: n.name
												}), /* @__PURE__ */ jsx("span", {
													className: "text-[10px] text-zinc-500 ml-2 shrink-0",
													children: n.time
												})]
											}), /* @__PURE__ */ jsx("p", {
												className: "text-[11.5px] text-zinc-400 leading-snug",
												children: n.message
											})]
										})]
									}, i)) : /* @__PURE__ */ jsx("div", {
										className: "flex flex-col items-center justify-center flex-1 text-zinc-500 text-[11.5px] py-8",
										children: "No results found"
									})
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-2.5 flex items-center gap-2",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "relative flex-1",
										children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" }), /* @__PURE__ */ jsx("input", {
											type: "text",
											value: searchQuery,
											onChange: (e) => setSearchQuery(e.target.value),
											placeholder: "Search notifications...",
											className: "w-full bg-[#1c1c1e] border border-[#333] rounded-full py-[7px] pl-9 pr-4 text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
										})]
									}), /* @__PURE__ */ jsx("button", {
										onClick: (e) => {
											e.stopPropagation();
											if (searchQuery) setSearchQuery("");
											else setExpanded(false);
										},
										className: "w-7 h-7 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-zinc-600 transition-colors shrink-0",
										children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5 text-zinc-400" })
									})]
								})
							]
						}) })]
					})
				]
			})
		})]
	});
}
//#endregion
//#region src/layouts/Layout.astro
createAstro("https://astro.build");
var $$Layout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	return renderTemplate`<html lang="en" class="dark" data-astro-cid-ju4pidww><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/favicon.ico"><meta name="generator"${addAttribute(Astro.generator, "content")}><title>Astro Basics</title><script>
			const theme = localStorage.getItem('theme') || 'dark';
			if (theme === 'light') {
				document.documentElement.classList.remove('dark');
			} else {
				document.documentElement.classList.add('dark');
			}
		<\/script>${renderHead($$result)}</head><body data-astro-cid-ju4pidww>${renderComponent($$result, "DynamicIsland", DynamicIsland, {
		"client:load": true,
		"data-astro-cid-ju4pidww": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/sahilcodex/Documents/smooth/src/components/DynamicIsland.tsx",
		"client:component-export": "DynamicIsland"
	})}${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "/home/sahilcodex/Documents/smooth/src/layouts/Layout.astro", void 0);
//#endregion
export { $$Layout as t };
