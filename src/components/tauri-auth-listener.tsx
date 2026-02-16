"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function TauriAuthListener() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Tauri 환경에서만 실행
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      // OAuth 리스너 초기화
      import("@/lib/auth.desktop").then(({ initDesktopAuth }) => {
        initDesktopAuth().catch(console.error);
      });

      // API 키 설정 확인
      import("@tauri-apps/api/core").then(({ invoke }) => {
        invoke<boolean>("check_credentials_exist")
          .then((exists) => {
            if (!exists && pathname !== "/settings") {
              router.push("/settings");
            }
          })
          .catch(console.error);
      });
    }
  }, [pathname, router]);

  return null;
}
