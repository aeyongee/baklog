import { listen } from "@tauri-apps/api/event";

export async function initDesktopAuth() {
  // Tauri 환경인지 확인
  if (typeof window === "undefined" || !("__TAURI__" in window)) {
    return;
  }

  // OAuth 콜백 리스너
  await listen<string>("oauth-callback", (event) => {
    const url = event.payload;
    handleOAuthCallback(url);
  });
}

function handleOAuthCallback(url: string) {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get("code");
    const state = urlObj.searchParams.get("state");

    if (code && state) {
      // Next.js OAuth 핸들러로 전달
      window.location.href = `/api/auth/callback/google?code=${code}&state=${state}`;
    }
  } catch (err) {
    console.error("OAuth callback error:", err);
  }
}
