use tauri::Manager;
use std::path::PathBuf;

// 빌드 시 .env.keys에서 주입된 컴파일 타임 상수
const APP_DATABASE_URL: &str = env!("BAKLOG_DATABASE_URL");
const APP_OPENAI_API_KEY: &str = env!("BAKLOG_OPENAI_API_KEY");
const APP_AUTH_GOOGLE_ID: &str = env!("BAKLOG_AUTH_GOOGLE_ID");
const APP_AUTH_GOOGLE_SECRET: &str = env!("BAKLOG_AUTH_GOOGLE_SECRET");
const APP_AUTH_SECRET: &str = env!("BAKLOG_AUTH_SECRET");

// 포트가 이미 사용 중인지 확인
fn is_port_in_use(port: u16) -> bool {
    use std::net::TcpStream;
    TcpStream::connect(format!("127.0.0.1:{}", port)).is_ok()
}

fn navigate_to_app(app_handle: &tauri::AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.navigate("http://localhost:3000".parse().unwrap());
    }
}

// 프로덕션 모드: node sidecar로 .next/standalone/server.js 실행
fn start_production_server(app_handle: tauri::AppHandle) {
    use tauri_plugin_shell::ShellExt;
    use tauri_plugin_shell::process::CommandEvent;

    tauri::async_runtime::spawn(async move {
        let shell = app_handle.shell();

        // Tauri resources 디렉토리에서 standalone 서버 경로 결정
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .unwrap_or_else(|_| PathBuf::from("."));

        let standalone_dir = resource_dir.join("next-bundle");
        let server_js = standalone_dir.join("server.js");

        println!("[Tauri] standalone_dir: {:?}", standalone_dir);
        println!("[Tauri] server_js: {:?}", server_js);

        let node = match shell.sidecar("node") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[Tauri] node sidecar 생성 실패: {}", e);
                return;
            }
        };

        let node = node
            .env("DATABASE_URL", APP_DATABASE_URL)
            .env("OPENAI_API_KEY", APP_OPENAI_API_KEY)
            .env("AUTH_GOOGLE_ID", APP_AUTH_GOOGLE_ID)
            .env("AUTH_GOOGLE_SECRET", APP_AUTH_GOOGLE_SECRET)
            .env("AUTH_SECRET", APP_AUTH_SECRET)
            .env("AUTH_URL", "http://localhost:3000")
            .env("AUTH_TRUST_HOST", "true")
            .env("NODE_ENV", "production")
            .env("PORT", "3000")
            .args([server_js.to_str().unwrap_or("server.js")])
            .current_dir(&standalone_dir);

        let (mut rx, _child) = match node.spawn() {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[Tauri] 서버 시작 실패: {}", e);
                return;
            }
        };

        println!("[Tauri] Next.js 서버 시작 중...");

        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let text = String::from_utf8_lossy(&line);
                    println!("[Server] {}", text);

                    if text.contains("ready") || text.contains("Ready") {
                        println!("[Tauri] 서버 준비 완료. 앱으로 이동...");
                        navigate_to_app(&app_handle);
                    }
                }
                CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line);
                    eprintln!("[Server] {}", text);

                    if text.contains("ready") || text.contains("Ready") {
                        navigate_to_app(&app_handle);
                    }

                    // 포트가 이미 사용 중이면 기존 서버로 이동
                    if text.contains("EADDRINUSE") || text.contains("address already in use") {
                        println!("[Tauri] 포트 3000 이미 사용 중. 기존 서버로 이동...");
                        navigate_to_app(&app_handle);
                        break;
                    }
                }
                CommandEvent::Error(e) => {
                    eprintln!("[Server Error] {}", e);
                }
                CommandEvent::Terminated(status) => {
                    eprintln!("[Tauri] 서버 종료: {:?}", status);
                    break;
                }
                _ => {}
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // 개발 모드에서는 이미 실행 중인 Next.js 서버 사용
      if cfg!(debug_assertions) {
        println!("[Tauri] 개발 모드: localhost:3000 사용");
        return Ok(());
      }

      // 프로덕션: node sidecar로 서버 시작
      std::env::set_var("DATABASE_URL", APP_DATABASE_URL);
      std::env::set_var("OPENAI_API_KEY", APP_OPENAI_API_KEY);
      std::env::set_var("AUTH_GOOGLE_ID", APP_AUTH_GOOGLE_ID);
      std::env::set_var("AUTH_GOOGLE_SECRET", APP_AUTH_GOOGLE_SECRET);
      std::env::set_var("AUTH_SECRET", APP_AUTH_SECRET);
      std::env::set_var("AUTH_URL", "http://localhost:3000");
      std::env::set_var("AUTH_TRUST_HOST", "true");

      // 포트 3000이 이미 사용 중이면 바로 이동 (중복 실행 방지)
      if is_port_in_use(3000) {
        println!("[Tauri] 포트 3000 이미 사용 중. 기존 서버로 이동...");
        navigate_to_app(app.handle());
        return Ok(());
      }

      println!("[Tauri] 프로덕션 모드: Next.js 서버 시작");
      start_production_server(app.handle().clone());

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
