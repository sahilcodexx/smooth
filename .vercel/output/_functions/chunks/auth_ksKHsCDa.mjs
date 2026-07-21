import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
//#region src/lib/auth.ts
var isInitialized = false;
async function initAuthTables() {
	if (isInitialized) return;
	const sql = neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require");
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
	try {
		await sql`
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    `;
	} catch (err) {
		console.error("Error adding user_id relation to posts table:", err);
	}
	isInitialized = true;
}
function hashPassword(password) {
	const salt = crypto.randomBytes(16).toString("hex");
	return `${salt}:${crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex")}`;
}
function verifyPassword(password, storedHash) {
	try {
		const [salt, hash] = storedHash.split(":");
		if (!salt || !hash) return false;
		return hash === crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
	} catch (err) {
		return false;
	}
}
async function getSessionUser(cookieHeader) {
	if (!cookieHeader) return null;
	if (cookieHeader.includes("better-auth.session_token")) {
		const authUrl = "https://ep-late-violet-azfo9j5h.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth";
		try {
			const res = await fetch(`${authUrl}/session`, { headers: { "Cookie": cookieHeader } });
			if (res.ok) {
				const data = await res.json();
				if (data && data.user) return {
					id: data.user.id,
					email: data.user.email,
					created_at: data.user.createdAt || (/* @__PURE__ */ new Date()).toISOString()
				};
			}
		} catch (err) {
			console.error("Error verifying Neon Auth session:", err);
		}
	}
	const token = Object.fromEntries(cookieHeader.split(";").map((c) => c.trim().split("=")))["session_token"];
	if (!token) return null;
	await initAuthTables();
	const result = await neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require")`
    SELECT u.id, u.email, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token} AND s.expires_at > CURRENT_TIMESTAMP
    LIMIT 1;
  `;
	if (result.length === 0) return null;
	return result[0];
}
//#endregion
export { verifyPassword as i, hashPassword as n, initAuthTables as r, getSessionUser as t };
