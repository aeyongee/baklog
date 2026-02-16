# Baklog Desktop v0.1.0

macOS 네이티브 데스크톱 애플리케이션

## 시스템 요구사항

- macOS 10.13 이상
- Apple Silicon (M1/M2/M3) 권장
- 인터넷 연결 (클라우드 DB 접근)

## 설치 방법

1. `Baklog_0.1.0_aarch64.dmg` 다운로드
2. DMG 열고 Baklog을 Applications 폴더로 드래그
3. 첫 실행: 우클릭 → 열기 (Gatekeeper 우회)

## 첫 실행 설정

1. 설정 페이지에서 다음 정보 입력:
   - PostgreSQL 데이터베이스 URL
   - OpenAI API Key
   - Google OAuth 클라이언트 ID/Secret
2. 저장하면 Keychain에 안전하게 보관됩니다

## 기능

- 웹 앱의 모든 기능 지원
- 클라우드 데이터베이스 연동 (웹/앱 데이터 공유)
- macOS 네이티브 통합
- 빠른 실행 속도
- 안전한 API 키 관리 (Keychain)

## 알려진 제한사항

- 인터넷 연결 필요 (오프라인 미지원)
- 초기 릴리스 (실험적)
- Apple Silicon 전용 (Intel Mac 미지원)

## 개발자 노트

### 개발 환경 실행

```bash
npm run tauri:dev
```

### 프로덕션 빌드

```bash
./scripts/build-desktop.sh
```

### Google OAuth 설정

Google Cloud Console에서 승인된 리디렉션 URI에 추가:
```
baklog://oauth/callback
```

자세한 내용은 `TAURI_SETUP.md`를 참조하세요.
