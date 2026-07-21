import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { neon } from "@neondatabase/serverless";
//#region src/pages/api/auth/logout.ts
var logout_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	const headers = new Headers();
	headers.append("Content-Type", "application/json");
	headers.append("Set-Cookie", "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure");
	headers.append("Set-Cookie", "better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure");
	try {
		const cookieHeader = request.headers.get("Cookie");
		if (cookieHeader) {
			if (cookieHeader.includes("better-auth.session_token")) {
				const authUrl = "https://ep-late-violet-azfo9j5h.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth";
				try {
					await fetch(`${authUrl}/sign-out`, {
						method: "POST",
						headers: { "Cookie": cookieHeader }
					});
				} catch (err) {
					console.error("Error signing out from Neon Auth:", err);
				}
			}
			const token = Object.fromEntries(cookieHeader.split(";").map((c) => c.trim().split("=")))["session_token"];
			if (token) await neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require")`
            DELETE FROM sessions WHERE token = ${token};
          `;
		}
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers
		});
	} catch (error) {
		console.error("Error during logout:", error);
		return new Response(JSON.stringify({ error: "Logout failed" }), {
			status: 500,
			headers
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/logout@_@ts
var page = () => logout_exports;
//#endregion
export { page };
