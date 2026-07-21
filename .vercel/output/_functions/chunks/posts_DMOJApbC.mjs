import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as getSessionUser } from "./auth_ksKHsCDa.mjs";
import { neon } from "@neondatabase/serverless";
//#region src/pages/api/posts.ts
var posts_exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const user = await getSessionUser(request.headers.get("Cookie"));
		if (!user) return new Response(JSON.stringify({ error: "Unauthorized. Please sign in." }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const { id, title, content } = await request.json();
		if (!id || !content) return new Response(JSON.stringify({ error: "ID and content are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require");
		const existing = await sql`SELECT user_id FROM posts WHERE id = ${id} LIMIT 1;`;
		if (existing.length > 0) {
			const ownerId = existing[0].user_id;
			if (ownerId && ownerId !== user.id) return new Response(JSON.stringify({ error: "Forbidden. You do not own this post." }), {
				status: 403,
				headers: { "Content-Type": "application/json" }
			});
		}
		await sql`
      INSERT INTO posts (id, title, content, user_id, updated_at)
      VALUES (${id}, ${title}, ${content}, ${user.id}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        title = EXCLUDED.title, 
        content = EXCLUDED.content, 
        updated_at = CURRENT_TIMESTAMP;
    `;
		return new Response(JSON.stringify({
			success: true,
			id
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Error saving post to DB:", error);
		return new Response(JSON.stringify({ error: "Failed to save post" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var DELETE = async ({ request }) => {
	try {
		const user = await getSessionUser(request.headers.get("Cookie"));
		if (!user) return new Response(JSON.stringify({ error: "Unauthorized. Please sign in." }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const { id, ids } = await request.json();
		if (!id && (!ids || ids.length === 0)) return new Response(JSON.stringify({ error: "ID or IDs array is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require");
		if (ids && Array.isArray(ids)) await sql`DELETE FROM posts WHERE id = ANY(${ids}) AND user_id = ${user.id}`;
		else if (id) await sql`DELETE FROM posts WHERE id = ${id} AND user_id = ${user.id}`;
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Error deleting posts:", error);
		return new Response(JSON.stringify({ error: "Failed to delete posts" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var GET = async ({ request }) => {
	try {
		const user = await getSessionUser(request.headers.get("Cookie"));
		if (!user) return new Response(JSON.stringify({ error: "Unauthorized. Please sign in." }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const id = new URL(request.url).searchParams.get("id");
		if (!id) return new Response(JSON.stringify({ error: "ID is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const post = (await neon("postgresql://neondb_owner:npg_SZ4AxpMFrPJ5@ep-late-violet-azfo9j5h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require")`SELECT * FROM posts WHERE id = ${id} AND user_id = ${user.id}`)[0];
		if (!post) return new Response(JSON.stringify({ error: "Post not found or unauthorized" }), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		return new Response(JSON.stringify({ post }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Error fetching post:", error);
		return new Response(JSON.stringify({ error: "Failed to fetch post" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/posts@_@ts
var page = () => posts_exports;
//#endregion
export { page };
