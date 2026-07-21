import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, i as renderComponent, m as maybeRenderHead, u as renderTemplate } from "./server_B3ajq7C2.mjs";
import { t as createComponent } from "./compiler_Cph2OPRR.mjs";
import { t as getSessionUser } from "./auth_ksKHsCDa.mjs";
import { t as $$Layout } from "./Layout_yyyhhAcd.mjs";
//#region src/pages/create.astro
var create_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Create,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Create = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Create;
	if (!await getSessionUser(Astro.request.headers.get("Cookie"))) return Astro.redirect("/auth");
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<main class="max-w-[37em]" style="margin: 6rem auto; padding: 2rem 1.25rem;">${renderComponent($$result, "Editor", null, {
		"client:only": "react",
		"client:component-hydration": "only",
		"client:component-path": "/home/sahilcodex/Documents/smooth/src/components/Editor.tsx",
		"client:component-export": "default"
	})}</main>` })}`;
}, "/home/sahilcodex/Documents/smooth/src/pages/create.astro", void 0);
var $$file = "/home/sahilcodex/Documents/smooth/src/pages/create.astro";
var $$url = "/create";
//#endregion
//#region \0virtual:astro:page:src/pages/create@_@astro
var page = () => create_exports;
//#endregion
export { page };
