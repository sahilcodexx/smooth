use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    webview::WebviewWindowBuilder,
    Manager, WebviewUrl,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const DEFAULT_SITE_URL: &str = "https://unmindful.vercel.app";
const CAPTURE_LABEL: &str = "quick-capture";

/// The app is a thin shell over a deployed unmindful instance, so the target
/// is configurable: point it at any deployment (or a local `astro dev` on
/// http://localhost:3000) with `UNMINDFUL_SITE_URL`.
fn site_url() -> String {
    std::env::var("UNMINDFUL_SITE_URL")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .map(|s| s.trim_end_matches('/').to_string())
        .unwrap_or_else(|| DEFAULT_SITE_URL.to_string())
}

/// Runs in EVERY webview (main, quick-capture) before any page script:
/// flips the bootstrap gate so the desktop shell mounts. Browsers never
/// run this, so the plain site is unaffected.
const GATE_INIT_SCRIPT: &str = "window.__UNMINDFUL_DESKTOP__ = true;";

fn main_window(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    app.get_webview_window("main")
}

/* ---------------------------------------------------------------
   Remote URL handling.
   The app is a shell over the live site (frontendDist is a URL), so the
   window simply loads the site root. Desktop-only chrome is injected by
   the shared layout, which dynamic-imports the shell whenever the gate
   script below has set `window.__UNMINDFUL_DESKTOP__`. Nothing has to be
   deployed separately and every route (home, editor, post, auth) gets
   the shell automatically.
   --------------------------------------------------------------- */

fn toggle_capture(app: &tauri::AppHandle) {
    match app.get_webview_window(CAPTURE_LABEL) {
        Some(window) => {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        None => {
            // Anchor to the bottom-right of the monitor the main window is on.
            let origin = main_window(app)
                .as_ref()
                .and_then(|w| w.current_monitor().ok().flatten())
                .map(|m| *m.size())
                .unwrap_or(tauri::PhysicalSize::new(1920, 1080));
            let x = origin.width.saturating_sub(460) as i32;
            let y = origin.height.saturating_sub(360) as i32;

            let url = format!("{}/?capture=1", site_url())
                .parse()
                .expect("capture url");
            let _ = tauri::WebviewWindowBuilder::new(
                app,
                CAPTURE_LABEL,
                WebviewUrl::External(url),
            )
            .title("unmindful — quick capture")
            .inner_size(430.0, 320.0)
            .position(x as f64, y as f64)
            .initialization_script(GATE_INIT_SCRIPT)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .focused(true)
            .build();
        }
    }
}

fn show_main(app: &tauri::AppHandle) {
    match main_window(app) {
        Some(window) => {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
        }
        None => {
            let url = site_url().parse().expect("main url");
            let _ = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(url),
            )
            .title("unmindful")
            .inner_size(1180.0, 760.0)
            .min_inner_size(880.0, 600.0)
            .initialization_script(GATE_INIT_SCRIPT)
            .center()
            .build();
        }
    }
}

fn check_for_updates(app: tauri::AppHandle) {
    use tauri_plugin_updater::UpdaterExt;
    tauri::async_runtime::spawn(async move {
        let updater = match app.updater() {
            Ok(u) => u,
            Err(err) => {
                eprintln!("[unmindful] updater unavailable: {err}");
                return;
            }
        };
        match updater.check().await {
            Ok(None) => println!("[unmindful] already on the latest version"),
            Ok(Some(update)) => {
                println!("[unmindful] downloading update {}…", update.version);
                match update.download_and_install(|_, _| {}, || {}).await {
                    Ok(()) => {
                        println!("[unmindful] update installed, restarting…");
                        let _ = app.restart();
                    }
                    Err(err) => eprintln!("[unmindful] update failed: {err}"),
                }
            }
            Err(err) => eprintln!("[unmindful] update check failed: {err}"),
        }
    });
}

fn tray(app: &tauri::App) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Open unmindful", true, None::<&str>)?;
    let capture = MenuItem::with_id(app, "capture", "Quick capture", true, None::<&str>)?;
    let update = MenuItem::with_id(app, "update", "Check for updates", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &capture, &update, &quit])?;

    let icon = app.default_window_icon().unwrap().clone();
    TrayIconBuilder::new()
        .icon(icon)
        .tooltip("unmindful")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => show_main(app),
            "capture" => toggle_capture(app),
            "update" => check_for_updates(app.clone()),
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            tray(app)?;
            app.global_shortcut().on_shortcut("Ctrl+Shift+U", |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    toggle_capture(app);
                }
            })?;

            // Config window has no init-script hook: rebuild it manually
            // with the gate so the shell boots in the primary window too.
            let mut cfg = app
                .config()
                .app
                .windows
                .first()
                .cloned()
                .expect("main window config");
            if let Ok(url) = std::env::var("UNMINDFUL_SITE_URL") {
                let url = url.trim_end_matches('/').to_string();
                cfg.url = WebviewUrl::External(url.parse().expect("UNMINDFUL_SITE_URL"));
            }
            #[allow(unused_mut)]
            let mut builder = WebviewWindowBuilder::from_config(app, &cfg)?
                .title("unmindful")
                .initialization_script(GATE_INIT_SCRIPT);
            if cfg!(debug_assertions) {
                builder = builder.inner_size(1180.0, 760.0).min_inner_size(880.0, 600.0);
            }
            builder.build()?;

            // TEMP VERIFY
            if std::env::var("UNMINDFUL_VERIFY").is_ok() {
                if let Some(win) = main_window(app.handle()) {
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_secs(12));
                        let probe = "document.title = 'VERIFY|url=' + location.href + '|root=' + !!document.getElementById('ds-root') + '|left=' + !!document.getElementById('ds-left') + '|right=' + !!document.getElementById('ds-right') + '|navItems=' + document.querySelectorAll('#ds-left nav a,#ds-left nav button').length";
                        let _ = win.eval(probe);
                        std::thread::sleep(std::time::Duration::from_millis(900));
                        if let Ok(t) = win.title() {
                            println!("[verify] {t}");
                        }
                    });
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // Minimize to tray instead of exiting.
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while starting the unmindful desktop app");
}
