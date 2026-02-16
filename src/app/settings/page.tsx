"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export default function SettingsPage() {
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [googleSecret, setGoogleSecret] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await invoke("save_api_keys", {
        databaseUrl,
        openaiKey,
        googleId,
        googleSecret,
      });
      alert("✓ 설정이 Keychain에 안전하게 저장되었습니다");
      // 메인 페이지로 리다이렉트
      window.location.href = "/";
    } catch (err) {
      alert(`오류: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          API 설정
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              데이터베이스 URL (PostgreSQL)
            </label>
            <input
              type="password"
              placeholder="postgresql://..."
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              OpenAI API Key
            </label>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Google OAuth Client ID
            </label>
            <input
              type="text"
              placeholder="..."
              value={googleId}
              onChange={(e) => setGoogleId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Google OAuth Client Secret
            </label>
            <input
              type="password"
              placeholder="GOCSPX-..."
              value={googleSecret}
              onChange={(e) => setGoogleSecret(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#FF2F92] text-white py-2 rounded-lg hover:bg-[#e6287f] disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 이 정보는 macOS Keychain에 안전하게 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
