use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "com.baklog.app";

#[derive(Serialize, Deserialize)]
pub struct Credentials {
    pub database_url: String,
    pub openai_api_key: String,
    pub auth_google_id: String,
    pub auth_google_secret: String,
    pub auth_secret: String,
}

pub fn save_credentials(creds: &Credentials) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, "credentials")
        .map_err(|e| e.to_string())?;

    let json = serde_json::to_string(creds)
        .map_err(|e| e.to_string())?;

    entry.set_password(&json)
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn load_credentials() -> Result<Credentials, String> {
    let entry = Entry::new(SERVICE_NAME, "credentials")
        .map_err(|e| e.to_string())?;

    let json = entry.get_password()
        .map_err(|e| e.to_string())?;

    serde_json::from_str(&json)
        .map_err(|e| e.to_string())
}
