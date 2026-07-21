import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as hashPassword, r as initAuthTables } from "./auth_ksKHsCDa.mjs";
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
//#region src/pages/api/auth/register.ts
var register_exports = /* @__PURE__ */ __exportAll({
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
		if (password.length < 6) return new Response(JSON.stringify({ error: "Password must be at least 6 characters long" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await initAuthTables();
		const sql = neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require");
		if ((await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1;
    `).length > 0) return new Response(JSON.stringify({ error: "A user with this email already exists" }), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		const userId = crypto.randomUUID();
		const passwordHash = hashPassword(password);
		await sql`
      INSERT INTO users (id, email, password_hash)
      VALUES (${userId}, ${email.toLowerCase().trim()}, ${passwordHash});
    `;
		const token = crypto.randomBytes(32).toString("hex");
		await sql`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${token}, ${new Date(Date.now() + 720 * 60 * 60 * 1e3)});
    `;
		return new Response(JSON.stringify({
			success: true,
			user: {
				id: userId,
				email
			}
		}), {
			status: 201,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${720 * 60 * 60}; Secure`
			}
		});
	} catch (error) {
		console.error("Error during registration:", error);
		return new Response(JSON.stringify({ error: "Registration failed" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/register@_@ts
var page = () => register_exports;
//#endregion
export { page };
