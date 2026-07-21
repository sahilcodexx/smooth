import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_B3ajq7C2.mjs";
import { t as createComponent } from "./compiler_Cph2OPRR.mjs";
import { t as $$Layout } from "./Layout_yyyhhAcd.mjs";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
//#region src/components/AuthCard.tsx
function GoogleIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 24",
		className: "size-4",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", {
				fill: "#4285F4",
				d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#34A853",
				d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#FBBC05",
				d: "M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#EA4335",
				d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
			})
		]
	});
}
function Avatar({ className, children }) {
	return /* @__PURE__ */ jsx("div", {
		className: `relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-950 ${className || ""}`,
		children
	});
}
function AvatarImage({ src, alt }) {
	return /* @__PURE__ */ jsx("img", {
		src,
		alt,
		className: "aspect-square h-full w-full object-cover"
	});
}
function AvatarFallback({ children }) {
	return /* @__PURE__ */ jsx("div", {
		className: "flex h-full w-full items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-zinc-100",
		children
	});
}
var proof = [
	{
		initials: "JD",
		src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&facepad=2&w=80&h=80&q=80"
	},
	{
		initials: "MK",
		src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&facepad=2&w=80&h=80&q=80"
	},
	{
		initials: "AR",
		src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&facepad=2&w=80&h=80&q=80"
	}
];
function AuthCard({ neonAuthUrl }) {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		const url = isSignUp ? "/api/auth/register" : "/api/auth/login";
		try {
			const response = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Something went wrong");
			window.location.href = "/";
		} catch (err) {
			setError(err.message || "Authentication failed");
		} finally {
			setLoading(false);
		}
	};
	const handleGoogleSignIn = async () => {
		if (!neonAuthUrl) {
			setError("Google Authentication is not configured on this server.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			const data = await (await fetch(`${neonAuthUrl}/sign-in/social`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: "google",
					callbackURL: window.location.origin + "/"
				})
			})).json();
			if (data && data.url) window.location.href = data.url;
			else throw new Error(data.error || "Failed to initialize Google login");
		} catch (err) {
			setError(err.message || "Google Sign-In failed");
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "grid w-full max-w-5xl min-h-[580px] gap-0 p-0 md:grid-cols-2 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-200",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 p-12 md:p-14 md:flex border-r border-zinc-900",
			children: [
				/* @__PURE__ */ jsx("div", { className: "bg-zinc-800/20 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl" }),
				/* @__PURE__ */ jsxs("div", {
					className: "relative flex items-center gap-2.5",
					children: [/* @__PURE__ */ jsx("div", {
						className: "bg-zinc-900 ring-zinc-800/50 flex size-9 items-center justify-center rounded-lg ring-1",
						children: /* @__PURE__ */ jsx("div", { className: "bg-zinc-200 size-3.5 rotate-45 rounded-[3px]" })
					}), /* @__PURE__ */ jsx("span", {
						className: "text-base font-semibold tracking-tight text-zinc-100",
						children: "unmindful"
					})]
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "relative mt-auto max-w-[15ch] text-3xl lg:text-4xl leading-[1.15] font-semibold tracking-tight text-zinc-100 font-serif italic",
					children: "Where random thoughts find their home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative mt-12 flex items-center gap-3.5",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex -space-x-2.5",
						children: proof.map((p) => /* @__PURE__ */ jsxs(Avatar, { children: [/* @__PURE__ */ jsx(AvatarImage, {
							src: p.src,
							alt: ""
						}), /* @__PURE__ */ jsx(AvatarFallback, { children: p.initials })] }, p.initials))
					}), /* @__PURE__ */ jsx("span", {
						className: "text-zinc-400 text-sm",
						children: "Join 4,000+ thinkers on unmindful"
					})]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col justify-center gap-6 p-12 md:p-14 bg-zinc-50/50 dark:bg-zinc-950/40",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-1.5",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100",
						children: isSignUp ? "Create an account" : "Welcome back"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-zinc-550 dark:text-zinc-500 text-sm",
						children: isSignUp ? "Register a new account to start writing." : "Sign in to your unmindful workspace."
					})]
				}),
				error && /* @__PURE__ */ jsx(motion.div, {
					initial: {
						opacity: 0,
						scale: .95
					},
					animate: {
						opacity: 1,
						scale: 1
					},
					className: "p-3.5 rounded-xl border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium text-center shadow-sm",
					children: error
				}),
				/* @__PURE__ */ jsx("button", {
					className: "w-full h-11 flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 text-sm rounded-xl font-medium transition-all cursor-pointer",
					type: "button",
					onClick: handleGoogleSignIn,
					disabled: loading,
					children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-zinc-400" }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(GoogleIcon, {}), "Continue with Google"] })
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ jsx("span", { className: "bg-zinc-200 dark:bg-zinc-850 h-px flex-1" }),
						/* @__PURE__ */ jsx("span", {
							className: "text-zinc-450 dark:text-zinc-650 text-[11px] uppercase tracking-wider font-semibold",
							children: "or"
						}),
						/* @__PURE__ */ jsx("span", { className: "bg-zinc-200 dark:bg-zinc-850 h-px flex-1" })
					]
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSubmit,
					className: "flex flex-col gap-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ jsx("label", {
								htmlFor: "ss-email",
								className: "text-xs font-medium text-zinc-600 dark:text-zinc-400",
								children: "Email"
							}), /* @__PURE__ */ jsx("input", {
								id: "ss-email",
								type: "email",
								placeholder: "you@example.com",
								autoComplete: "email",
								required: true,
								value: email,
								onChange: (e) => setEmail(e.target.value),
								className: "h-11 px-3 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-900 dark:text-zinc-200 placeholder-zinc-450 dark:placeholder-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-zinc-500/30 dark:focus:ring-zinc-400/20 transition-all text-sm"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col gap-1.5",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("label", {
									htmlFor: "ss-password",
									className: "text-xs font-medium text-zinc-600 dark:text-zinc-400",
									children: "Password"
								}), !isSignUp && /* @__PURE__ */ jsx("a", {
									href: "#",
									onClick: (e) => {
										e.preventDefault();
										alert("Reset password features coming soon!");
									},
									className: "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs",
									children: "Forgot?"
								})]
							}), /* @__PURE__ */ jsx("input", {
								id: "ss-password",
								type: "password",
								placeholder: "••••••••",
								autoComplete: isSignUp ? "new-password" : "current-password",
								required: true,
								value: password,
								onChange: (e) => setPassword(e.target.value),
								className: "h-11 px-3 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-900 dark:text-zinc-200 placeholder-zinc-450 dark:placeholder-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-zinc-500/30 dark:focus:ring-zinc-400/20 transition-all text-sm"
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: loading,
							className: "w-full h-11 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors text-sm rounded-xl font-medium shadow-md flex items-center justify-center cursor-pointer",
							children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : isSignUp ? "Sign up" : "Sign in"
						})
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-zinc-550 dark:text-zinc-500 text-center text-xs mt-2",
					children: [isSignUp ? "Already have an account? " : "No account? ", /* @__PURE__ */ jsx("button", {
						onClick: () => {
							setIsSignUp(!isSignUp);
							setError("");
						},
						className: "text-zinc-800 dark:text-zinc-300 font-medium hover:underline bg-transparent border-0 p-0 cursor-pointer",
						children: isSignUp ? "Sign in" : "Start sharing thoughts"
					})]
				})
			]
		})]
	});
}
//#endregion
//#region src/pages/auth.astro
var auth_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Auth,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Auth = createComponent(($$result, $$props, $$slots) => {
	const neonAuthUrl = "https://ep-late-violet-azfo9j5h.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth";
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-nas6o2lc": true }, { "default": ($$result2) => renderTemplate`${maybeRenderHead($$result2)}<div class="auth-page flex flex-col justify-center items-center min-h-[100vh] px-4 py-12 md:py-16" data-astro-cid-nas6o2lc>${renderComponent($$result2, "AuthCard", AuthCard, {
		"client:load": true,
		"neonAuthUrl": neonAuthUrl,
		"data-astro-cid-nas6o2lc": true,
		"client:component-hydration": "load",
		"client:component-path": "/home/sahilcodex/Documents/smooth/src/components/AuthCard.tsx",
		"client:component-export": "AuthCard"
	})}</div>` })}`;
}, "/home/sahilcodex/Documents/smooth/src/pages/auth.astro", void 0);
var $$file = "/home/sahilcodex/Documents/smooth/src/pages/auth.astro";
var $$url = "/auth";
//#endregion
//#region \0virtual:astro:page:src/pages/auth@_@astro
var page = () => auth_exports;
//#endregion
export { page };
