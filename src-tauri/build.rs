fn main() {
    // .env.keys 파일에서 API 키를 읽어 컴파일 타임 상수로 포함
    // 빌드 전 src-tauri/.env.keys 파일을 생성해야 합니다
    if let Ok(content) = std::fs::read_to_string(".env.keys") {
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                let key = key.trim();
                let value = value.trim();
                if !key.is_empty() {
                    println!("cargo:rustc-env=BAKLOG_{}={}", key, value);
                }
            }
        }
    } else {
        // .env.keys 없으면 빈 값으로 설정 (개발 모드에서는 런타임 .env 사용)
        println!("cargo:rustc-env=BAKLOG_DATABASE_URL=");
        println!("cargo:rustc-env=BAKLOG_OPENAI_API_KEY=");
        println!("cargo:rustc-env=BAKLOG_AUTH_GOOGLE_ID=");
        println!("cargo:rustc-env=BAKLOG_AUTH_GOOGLE_SECRET=");
        println!("cargo:rustc-env=BAKLOG_AUTH_SECRET=");
    }

    println!("cargo:rerun-if-changed=.env.keys");
    tauri_build::build()
}
