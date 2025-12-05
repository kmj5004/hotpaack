# 🚀 배포 가이드

## Netlify 배포

### 1. Netlify 사이트 생성
1. [Netlify](https://app.netlify.com/) 로그인
2. "Add new site" → "Import an existing project"
3. GitHub 저장소 연결

### 2. 빌드 설정
Netlify 대시보드에서:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `20`

### 3. GitHub Secrets 설정
GitHub 저장소 → Settings → Secrets and variables → Actions에서 추가:

- `NETLIFY_AUTH_TOKEN`: Netlify 개인 액세스 토큰
  - Netlify → User Settings → Applications → New access token
  
- `NETLIFY_SITE_ID`: Netlify 사이트 ID
  - Netlify → Site settings → General → Site details → API ID

### 4. 배포
```bash
git add .
git commit -m "🔥 온라인 손난로 배포"
git push origin main
```

자동으로 빌드 & 배포됩니다!

---

## 수동 배포 (Netlify CLI)

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로그인
netlify login

# 빌드
npm run build

# 배포
netlify deploy --prod --dir=dist
```

---

## GitHub Pages 배포 (대안)

`.github/workflows/pages.yml` 생성:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist
      - uses: actions/deploy-pages@v3
```

GitHub 저장소 → Settings → Pages → Source: "GitHub Actions"

---

## Vercel 배포 (대안)

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel --prod
```

---

## 환경 변수 (필요시)

Firebase 설정을 환경 변수로 관리:

```bash
# .env.production
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_DATABASE_URL=your_url
VITE_FIREBASE_PROJECT_ID=your_id
```

`main.js`에서:
```javascript
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    // ...
};
```

---

## 배포 체크리스트

- [ ] Firebase 프로젝트 생성 및 설정
- [ ] `main.js`에 Firebase 설정 입력
- [ ] GitHub Secrets 등록
- [ ] 배포 테스트
- [ ] 도메인 연결 (선택사항)
- [ ] Analytics 설정 (선택사항)

---

## 트러블슈팅

### Worker 오류
Worker 파일은 같은 도메인에서 로드되어야 합니다.
CORS 이슈가 있다면 Netlify `_headers` 파일 추가:

```
/worker.js
  Access-Control-Allow-Origin: *
```

### Firebase 연결 실패
Firebase Realtime Database 규칙 확인:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### 빌드 실패
`npm ci` 대신 `npm install` 시도

---

## 성능 최적화

### Netlify 설정
`netlify.toml` 생성:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### CDN 캐싱
정적 리소스는 자동으로 CDN에 캐시됩니다.
