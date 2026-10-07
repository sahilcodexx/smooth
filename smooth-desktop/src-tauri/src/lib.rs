use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    WebviewUrl,
    Manager,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const SITE_URL: &str = "https://unmindful.vercel.app";
const CAPTURE_LABEL: &str = "quick-capture";

fn main_window(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    app.get_webview_window("main")
}

fn toggle_capture(app: &tauri::AppHandle) {
    match app.get_webview_window(CAPTURE_LABEL) {
        Some(window) => {
            let visible = window.is_visible().unwrap_or(false);
            if visible {
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

            let url = format!("{SITE_URL}/create?new=true&capture=1")
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
            let url = SITE_URL.parse().expect("main url");
            let _ = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(url),
            )
            .title("unmindful")
            .inner_size(1180.0, 760.0)
            .min_inner_size(880.0, 600.0)
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
                match update
                    .download_and_install(|_, _| {}, || {})
                    .await
                {
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
