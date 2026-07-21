import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

// Inline Avatar implementation to avoid extra dependencies
function Avatar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-950 ${className || ""}`}
    >
      {children}
    </div>
  );
}

function AvatarImage({ src, alt }: { src: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="aspect-square h-full w-full object-cover"
    />
  );
}

function AvatarFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-zinc-100">
      {children}
    </div>
  );
}

const proof = [
  {
    initials: "JD",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&facepad=2&w=80&h=80&q=80",
  },
  {
    initials: "MK",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&facepad=2&w=80&h=80&q=80",
  },
  {
    initials: "AR",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&facepad=2&w=80&h=80&q=80",
  },
];

export function AuthCard({ neonAuthUrl }: { neonAuthUrl?: string }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const syncGuestPostsBeforeRedirect = async () => {
    try {
      const guestPostsRaw = localStorage.getItem("smooth_guest_posts");
      if (guestPostsRaw) {
        const posts = JSON.parse(guestPostsRaw);
        if (Array.isArray(posts) && posts.length > 0) {
          const response = await fetch("/api/posts/sync-local", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ posts })
          });
          if (response.ok) {
            localStorage.removeItem("smooth_guest_posts");
            // Clean up guest drafts
            const guestDraftId = localStorage.getItem("smooth_draft_id_guest");
            if (guestDraftId) {
              localStorage.removeItem(`smooth_draft_content_guest`);
              localStorage.removeItem("smooth_draft_id_guest");
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync guest posts:", e);
    }
  };

  const syncSocialSession = async (user: { id: string; email: string }) => {
    const syncResponse = await fetch("/api/auth/login-social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: user.email,
        id: user.id,
      }),
    });

    if (!syncResponse.ok) {
      const syncData = await syncResponse.json().catch(() => ({}));
      throw new Error(syncData.error || "Failed to sync social login session.");
    }

    await syncGuestPostsBeforeRedirect();
    window.location.href = "/";
  };

  useEffect(() => {
    const checkNeonSession = async () => {
      if (!neonAuthUrl) return;

      // Surface OAuth errors returned by Neon Auth on the callback URL
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error") || params.get("error_description");
      if (oauthError) {
        setError(decodeURIComponent(oauthError));
        sessionStorage.removeItem("neon_oauth_pending");
        return;
      }

      const oauthPending = sessionStorage.getItem("neon_oauth_pending") === "1";
      const hasVerifier = params.has("neon_auth_session_verifier");

      // Important: only auto-complete sign-in when we're returning from an OAuth attempt.
      // Otherwise, visiting /auth after logout would immediately sign users back in.
      if (!oauthPending && !hasVerifier) {
        return;
      }

      try {
        // Neon Auth (Better Auth) exposes get-session — not /session.
        // IMPORTANT: After OAuth redirect, Neon provides a verifier in the callback URL.
        // We must forward it to /get-session so Neon can resolve the user session.
        const params = new URLSearchParams(window.location.search);
        const verifier = params.get("neon_auth_session_verifier");

        const sessionUrl = new URL(`${neonAuthUrl}/get-session`);
        if (verifier) {
          sessionUrl.searchParams.set("neon_auth_session_verifier", verifier);
        }

        const response = await fetch(sessionUrl.toString(), {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (oauthPending) {
            sessionStorage.removeItem("neon_oauth_pending");
            setError("Google sign-in could not be verified. Please try again.");
          }
          return;
        }

        const data = await response.json();
        // Better Auth returns { user, session } or null
        const user = data?.user ?? data?.data?.user;
        if (!user?.email || !user?.id) {
          if (oauthPending) {
            sessionStorage.removeItem("neon_oauth_pending");
            setError(
              "Google sign-in did not establish a session. Allow third-party cookies for this site, or try again.",
            );
          }
          return;
        }

        sessionStorage.removeItem("neon_oauth_pending");
        setLoading(true);
        await syncSocialSession({ id: user.id, email: user.email });
      } catch (err: any) {
        console.error("Error checking Neon Auth session on mount:", err);
        sessionStorage.removeItem("neon_oauth_pending");
        setError(err.message || "Failed to complete Google sign-in.");
        setLoading(false);
      }
    };

    checkNeonSession();
  }, [neonAuthUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isSignUp ? "/api/auth/register" : "/api/auth/login";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      await syncGuestPostsBeforeRedirect();
      window.location.href = "/";
    } catch (err: any) {
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
      // Callback must land on /auth so we can read the Neon session and create a local app cookie
      const callbackURL = `${window.location.origin}/auth`;

      const response = await fetch(`${neonAuthUrl}/sign-in/social`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          provider: "google",
          callbackURL,
        }),
      });

      const data = await response.json();

      if (data?.url) {
        sessionStorage.setItem("neon_oauth_pending", "1");
        window.location.href = data.url;
        return;
      }

      throw new Error(
        data?.message || data?.error || "Failed to initialize Google login",
      );
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed");
      setLoading(false);
    }
  };

  return (
    <div className="grid w-full max-w-5xl min-h-[580px] gap-0 p-0 md:grid-cols-2 overflow-hidden bg-white dark:bg-[#171717] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-200">
      {/* Brand Left Panel (md and up) - Premium Dark Contrast Panel always */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 p-12 md:p-14 md:flex border-r border-zinc-900">
        <div className="bg-zinc-800/20 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="bg-zinc-900 ring-zinc-800/50 flex size-9 items-center justify-center rounded-lg ring-1">
            <div className="bg-zinc-200 size-3.5 rotate-45 rounded-[3px]" />
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-100">
            unmindful
          </span>
        </div>

        <h2 className="relative mt-auto max-w-[15ch] text-3xl lg:text-4xl leading-[1.15] font-semibold tracking-tight text-zinc-100 font-serif italic">
          Where random thoughts find their home.
        </h2>

        <div className="relative mt-12 flex items-center gap-3.5">
          <div className="flex -space-x-2.5">
            {proof.map((p) => (
              <Avatar key={p.initials}>
                <AvatarImage src={p.src} alt="" />
                <AvatarFallback>{p.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-zinc-400 text-sm">
            Join 4,000+ thinkers on unmindful
          </span>
        </div>
      </div>

      {/* Forms Panel (Right) - Light/Dark Adaptive */}
      <div className="flex flex-col justify-center gap-6 p-12 md:p-14 bg-zinc-50/50 dark:bg-[#171717]">
        <div className="flex flex-col gap-1.5">
          <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {isSignUp ? "Create an account" : "Welcome back"}
          </span>
          <span className="text-zinc-550 dark:text-zinc-500 text-sm">
            {isSignUp
              ? "Register a new account to start writing."
              : "Sign in to your unmindful workspace."}
          </span>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-xl border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-medium text-center shadow-sm"
          >
            {error}
          </motion.div>
        )}

        <button
          className="w-full h-11 flex items-center justify-center gap-2 border border-zinc-200 dark:border-[#2e2e33] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-[#202024] text-sm rounded-xl font-medium transition-all cursor-pointer"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <div className="flex items-center gap-3">
          <span className="bg-zinc-200 dark:bg-zinc-850 h-px flex-1" />
          <span className="text-zinc-450 dark:text-zinc-650 text-[11px] uppercase tracking-wider font-semibold">
            or
          </span>
          <span className="bg-zinc-200 dark:bg-zinc-850 h-px flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="ss-email"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Email
            </label>
            <input
              id="ss-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-3 w-full bg-white dark:bg-[#202024] border border-zinc-200 dark:border-[#2e2e33] text-zinc-900 dark:text-zinc-200 placeholder-zinc-450 dark:placeholder-zinc-500 rounded-xl outline-none focus:ring-2 focus:ring-zinc-500/30 dark:focus:ring-zinc-400/20 transition-all text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="ss-password"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Password
              </label>
              {!isSignUp && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Reset password features coming soon!");
                  }}
                  className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs"
                >
                  Forgot?
                </a>
              )}
            </div>
            <input
              id="ss-password"
              type="password"
              placeholder="••••••••"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 px-3 w-full bg-white dark:bg-[#202024] border border-zinc-200 dark:border-[#2e2e33] text-zinc-900 dark:text-zinc-200 placeholder-zinc-450 dark:placeholder-zinc-500 rounded-xl outline-none focus:ring-2 focus:ring-zinc-500/30 dark:focus:ring-zinc-400/20 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors text-sm rounded-xl font-medium shadow-md flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              "Sign up"
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-zinc-550 dark:text-zinc-500 text-center text-xs mt-2">
          {isSignUp ? "Already have an account? " : "No account? "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-zinc-800 dark:text-zinc-300 font-medium hover:underline bg-transparent border-0 p-0 cursor-pointer"
          >
            {isSignUp ? "Sign in" : "Start sharing thoughts"}
          </button>
        </p>
      </div>
    </div>
  );
}
