// Vercel "Ignored Build Step" script.
// Exit 0  -> skip the Vercel build (commit only touched smooth-desktop/)
// Exit 1  -> proceed with the normal Vercel build (site sources changed)
import { execSync } from "node:child_process";

// Vercel gives us the commit being built and the commit it compares against.
const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
const prev = process.env.VERCEL_GIT_PREVIOUS_SHA ?? "";

if (!sha) {
  // Local/manual run without Vercel env — don't skip.
  process.exit(1);
}

const range = prev ? `${prev}..${sha}` : `${sha}^ ${sha}`;
let touched;
try {
  touched = execSync(`git diff --name-only ${range}`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
} catch {
  process.exit(1);
}

const files = touched.split("\n").filter(Boolean);
const onlyDesktop =
  files.length > 0 && files.every((f) => f.startsWith("smooth-desktop/"));

console.log(
  `[vercel-ignore] changed files: ${files.length}; onlyDesktop=${onlyDesktop}`,
);
process.exit(onlyDesktop ? 0 : 1);
