import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as getSessionUser } from "./auth_ksKHsCDa.mjs";
//#region src/pages/api/auth/session.ts
var session_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const user = await getSessionUser(request.headers.get("Cookie"));
		return new Response(JSON.stringify({ user }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/session@_@ts
var page = () => session_exports;
//#endregion
export { page };
