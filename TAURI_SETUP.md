# Tauri Desktop App 설정 가이드

## Google OAuth 설정 (필수)

Tauri 데스크톱 앱에서 Google 로그인을 사용하려면 Google OAuth Console에서 추가 설정이 필요합니다.

### ⚠️ 중요: 반드시 설정해야 합니다!

데스크톱 앱에서 Google 로그인이 작동하지 않으면 이 설정을 확인하세요.

### 설정 단계

1. **Google Cloud Console 접속**
   - [https://console.cloud.google.com/](https://console.cloud.google.com/) 열기
   - Baklog 프로젝트 선택

2. **OAuth 클라이언트 ID 찾기**
   - 좌측 메뉴: "API 및 서비스" > "사용자 인증 정보"
   - 기존 OAuth 2.0 클라이언트 ID 클릭

3. **리디렉션 URI 추가**
   - "승인된 리디렉션 URI" 섹션 찾기
   - **추가** 버튼 클릭
   - 다음 URI 입력:
     ```
     baklog://oauth/callback
     ```
   - **저장** 버튼 클릭

4. **확인**
   - 승인된 리디렉션 URI 목록에 다음 두 개가 있어야 합니다:
     - `http://localhost:3000/api/auth/callback/google` (웹 개발용)
     - `https://your-domain.com/api/auth/callback/google` (웹 프로덕션용)
     - `baklog://oauth/callback` (데스크톱 앱용) ✨

### 작동 원리

```
1. 사용자가 데스크톱 앱에서 "Google로 로그인" 클릭
   ↓
2. 기본 브라우저 열림 (Google 로그인 페이지)
   ↓
3. 사용자가 로그인 및 권한 승인
   ↓
4. Google이 baklog://oauth/callback?code=XXX&state=YYY 로 리다이렉트
   ↓
5. macOS가 Baklog 앱 활성화 (Deep Link)
   ↓
6. Tauri가 URL 캡처 → 프론트엔드로 이벤트 전달
   ↓
7. 프론트엔드가 /api/auth/callback/google 호출
   ↓
8. Next.js OAuth 플로우 완료 ✅
```

### 트러블슈팅

**문제: 로그인 후 앱으로 돌아오지 않음**
- Google OAuth Console에서 `baklog://oauth/callback` URI 추가 확인
- 브라우저 콘솔에서 "ERR_UNKNOWN_URL_SCHEME" 에러 확인
- Tauri 앱 재시작

**문제: "redirect_uri_mismatch" 에러**
- Google OAuth Console의 리디렉션 URI와 정확히 일치하는지 확인
- 대소문자 구분 확인
- 슬래시(/) 유무 확인

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
