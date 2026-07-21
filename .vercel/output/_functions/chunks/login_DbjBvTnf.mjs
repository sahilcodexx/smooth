import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as verifyPassword, r as initAuthTables } from "./auth_ksKHsCDa.mjs";
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
//#region src/pages/api/auth/login.ts
var login_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const { email, password } = await request.json();
		if (!email || !password) return new Response(JSON.stringify({ error: "Email and password are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await initAuthTables();
		const sql = neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require");
		const users = await sql`
      SELECT id, email, password_hash FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1;
    `;
		if (users.length === 0) return new Response(JSON.stringify({ error: "Invalid email or password" }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const user = users[0];
		if (!verifyPassword(password, user.password_hash)) return new Response(JSON.stringify({ error: "Invalid email or password" }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const token = crypto.randomBytes(32).toString("hex");
		const sessionId = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 720 * 60 * 60 * 1e3);
		await sql`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt});
    `;
		return new Response(JSON.stringify({
			success: true,
			user: {
				id: user.id,
				email: user.email
			}
		}), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${720 * 60 * 60}; Secure`
			}
		});
	} catch (error) {
		console.error("Error during login:", error);
		return new Response(JSON.stringify({ error: "Login failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/login@_@ts
var page = () => login_exports;
//#endregion
export { page };
