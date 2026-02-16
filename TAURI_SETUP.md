# Tauri Desktop App 설정 가이드

## Google OAuth 설정

Tauri 데스크톱 앱에서 Google 로그인을 사용하려면 Google OAuth Console에서 추가 설정이 필요합니다.

### 단계

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (Baklog)
3. 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
4. OAuth 2.0 클라이언트 ID 선택
5. "승인된 리디렉션 URI"에 다음 추가:
   ```
   baklog://oauth/callback
   ```
6. 저장

### 작동 원리

1. 사용자가 데스크톱 앱에서 "Google로 로그인" 클릭
2. 기본 브라우저가 열리고 Google 로그인 페이지 표시
3. 사용자가 로그인 및 권한 승인
4. Google이 `baklog://oauth/callback?code=...&state=...`로 리다이렉트
5. macOS가 Baklog 앱을 활성화하고 Deep Link 전달
6. Tauri가 Deep Link를 받아서 프론트엔드로 이벤트 전달
7. 프론트엔드가 `/api/auth/callback/google`로 리다이렉트
8. Next.js가 OAuth 플로우 완료

## 개발 환경 실행

```bash
# Tauri 개발 모드
npm run tauri:dev
```

이 명령은 자동으로:
1. Next.js 개발 서버 시작 (http://localhost:3000)
2. Tauri 앱 빌드 및 실행
3. Tauri 윈도우가 Next.js 앱을 표시

## 프로덕션 빌드

```bash
# Phase 7에서 구현 예정
npm run tauri:build
```
