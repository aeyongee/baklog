use tauri::Manager;
use std::sync::Mutex;

mod secure_storage;

struct ServerState {
    child: Option<tauri::async_runtime::JoinHandle<()>>,
}

#[tauri::command]
fn get_oauth_callback_url() -> String {
    "baklog://oauth/callback".to_string()
}

#[tauri::command]
async fn save_api_keys(
    database_url: String,
    openai_key: String,
    google_id: String,
    google_secret: String,
) -> Result<(), String> {
    use secure_storage::{save_credentials, Credentials};

    let creds = Credentials {
        database_url,
        openai_api_key: openai_key,
        auth_google_id: google_id,
        auth_google_secret: google_secret,
        auth_secret: generate_auth_secret(),
    };

    save_credentials(&creds)?;

    // 환경 변수로 설정 (Next.js 서버용)
    std::env::set_var("DATABASE_URL", &creds.database_url);
    std::env::set_var("OPENAI_API_KEY", &creds.openai_api_key);
    std::env::set_var("AUTH_GOOGLE_ID", &creds.auth_google_id);
    std::env::set_var("AUTH_GOOGLE_SECRET", &creds.auth_google_secret);
    std::env::set_var("AUTH_SECRET", &creds.auth_secret);

    Ok(())
}

#[tauri::command]
async fn check_credentials_exist() -> bool {
    use secure_storage::load_credentials;
    load_credentials().is_ok()
}

fn generate_auth_secret() -> String {
    use rand::Rng;
    let random_bytes: Vec<u8> = (0..32)
        .map(|_| rand::thread_rng().gen())
        .collect();
    hex::encode(random_bytes)
}

#[tauri::command]
async fn start_next_server(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<ServerState>>,
) -> Result<(), String> {
    let mut server = state.lock().unwrap();

    if server.child.is_some() {
        return Ok(()); // 이미 실행 중
    }

    // 개발 모드에서는 이미 실행 중인 서버 사용
    if cfg!(debug_assertions) {
        println!("[Tauri] Development mode - using existing Next.js server");
        return Ok(());
    }

    // 프로덕션 모드에서만 Sidecar 실행
    use tauri_plugin_shell::ShellExt;

    let handle = tauri::async_runtime::spawn(async move {
        let shell = app.shell();
        match shell.sidecar("next-server") {
            Ok(sidecar) => {
                match sidecar.spawn() {
                    Ok((_rx, child)) => {
                        println!("[Tauri] Next.js server started (PID: {:?})", child.pid());
                    }
                    Err(e) => {
                        eprintln!("[Tauri] Failed to spawn server: {}", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("[Tauri] Failed to create sidecar: {}", e);
            }
        }
    });

    server.child = Some(handle);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(Mutex::new(ServerState { child: None }))
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      get_oauth_callback_url,
      start_next_server,
      save_api_keys,
      check_credentials_exist
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Keychain에서 인증 정보 로드
      use secure_storage::load_credentials;

      if let Ok(creds) = load_credentials() {
        // 환경 변수 설정
        std::env::set_var("DATABASE_URL", &creds.database_url);
        std::env::set_var("OPENAI_API_KEY", &creds.openai_api_key);
        std::env::set_var("AUTH_GOOGLE_ID", &creds.auth_google_id);
        std::env::set_var("AUTH_GOOGLE_SECRET", &creds.auth_google_secret);
        std::env::set_var("AUTH_SECRET", &creds.auth_secret);

        // Next.js 서버 시작 (프로덕션 모드에서만)
        if !cfg!(debug_assertions) {
          let app_handle = app.handle().clone();
          tauri::async_runtime::spawn(async move {
            if let Err(e) = start_next_server(app_handle.clone(), app_handle.state::<Mutex<ServerState>>()).await {
              eprintln!("[Tauri] Failed to start Next.js server: {}", e);
            }
          });
        }
      } else {
        // 첫 실행 → 설정 페이지로 리다이렉트
        println!("[Tauri] No credentials found, user needs to configure API keys");
        // 프론트엔드에서 /settings로 리다이렉트 처리
      }

      // Deep Link 리스너 등록
      // TODO: Tauri v2 API 확인 후 재구현
      // #[cfg(not(target_os = "ios"))]
      // {
      //   let handle = app.handle().clone();
      //   tauri_plugin_deep_link::register("baklog", move |request| {
      //     if request.starts_with("baklog://oauth/callback") {
      //       let _ = handle.emit("oauth-callback", request);
      //     }
      //   })
      //   .unwrap();
      // }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
