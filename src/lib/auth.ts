import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Lazy initialization of tables
let isInitialized = false;

export async function initAuthTables() {
  if (isInitialized) return;
  const dbUrl = import.meta.env.DATABASE_URL;
  if (!dbUrl) return;

  const sql = neon(dbUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Helpful indexes for snappy auth/post queries at scale
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token_expires ON sessions (token, expires_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_user_created_at ON posts (user_id, created_at DESC);`;

  // Self-creating user_id relation on the posts table
  try {
    await sql`
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    `;
  } catch (err) {
    console.error("Error adding user_id relation to posts table:", err);
  }

  isInitialized = true;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function wantsSecureCookie(requestUrl?: string): boolean {
  if (requestUrl) {
    try {
      return new URL(requestUrl).protocol === "https:";
    } catch {
      return import.meta.env.PROD;
    }
  }
  return import.meta.env.PROD;
}

/** Build a session cookie; only mark Secure on HTTPS so local http://localhost works. */
export function buildSessionCookie(
  token: string,
  maxAgeSeconds: number,
  requestUrl?: string,
): string {
  const parts = [
    `session_token=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (wantsSecureCookie(requestUrl)) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(
  name = "session_token",
  requestUrl?: string,
): string {
  const parts = [`${name}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (wantsSecureCookie(requestUrl)) parts.push("Secure");
  return parts.join("; ");
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const checkHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");
    return hash === checkHash;
  } catch (err) {
    return false;
  }
}

export async function getSessionUser(
  cookieHeader: string | null,
): Promise<User | null> {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("=")),
  );

  // 1) Fast path: prefer our local app session (no cross-origin network call)
  const token = cookies["session_token"];

  if (token) {
    await initAuthTables();

    const dbUrl = import.meta.env.DATABASE_URL;
    if (!dbUrl) return null;

    const sql = neon(dbUrl);

    const result = await sql`
      SELECT u.id, u.email, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > CURRENT_TIMESTAMP
      LIMIT 1;
    `;

    if (result.length > 0) return result[0] as User;
  }

  // 2) Fallback: check Neon Auth session when local session is missing/expired
  if (cookieHeader.includes("better-auth.session_token")) {
    const authUrl =
      import.meta.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_BASE_URL;
    if (authUrl) {
      try {
        const res = await fetch(`${authUrl}/get-session`, {
          headers: {
            Cookie: cookieHeader,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              created_at: data.user.createdAt || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.error("Error verifying Neon Auth session:", err);
      }
    }
  }

  return null;
}
