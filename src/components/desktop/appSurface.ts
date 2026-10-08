/** The shell portals into document.body itself; React just needs one host. */
function host(): HTMLElement {
  let el = document.getElementById("smooth-desktop-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "smooth-desktop-root";
    el.style.display = "contents";
    document.body.appendChild(el);
  }
  return el;
}

let root: Root | null = null;

function mount(): void {
  if (root) {
    root.unmount();
    root = null;
  }
  const Surface: ComponentType = isCapture() ? QuickCapture : DesktopShell;
  root = createRoot(host());
  root.render(createElement(Surface));
}

function start(): void {
  if (!window.__UNMINDFUL_DESKTOP__) return;
  mount();
  document.addEventListener("astro:after-swap", () => {
    requestAnimationFrame(mount);
  });
  new MutationObserver(() => {
    const el = document.getElementById("smooth-desktop-root");
    if (!el || !el.isConnected) mount();
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("astro:after-swap", () => requestAnimationFrame(applyZOrder));
  applyZOrder();
}

start();
