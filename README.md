# 🔥 온라인 손난로 - 함께 따뜻하게

[![Deploy to Netlify](https://img.shields.io/badge/deploy-netlify-00C7B7?style=for-the-badge&logo=netlify)](https://app.netlify.com/start)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

디지털 세계에서 만나는 따뜻한 손난로! 전 세계 사람들과 함께 CPU와 GPU를 돌려 따뜻함을 나눠보세요.

![온라인 손난로](https://img.shields.io/badge/status-🔥_hot-ff6b6b?style=for-the-badge)

## ✨ 주요 기능

### 🌡️ 온도 조절
- 10단계 온도 설정 (25°C ~ 70°C)
- 실시간 온도 조절 가능
- CPU와 GPU를 동시 사용해 실제로 기기가 따뜻해집니다!

### 👥 실시간 소셜 기능
- **현재 접속자 수**: 지금 이 순간 함께 있는 사람들
- **오늘 방문자**: 오늘 하루 방문한 총 인원
- **누적 사용자 수**: 서비스 시작 이후 총 방문자 수 (NEW!)
- **내 발열량**: 내가 생성한 칼로리 추적
- **전 세계 누적 발열량**: 모두가 함께 만든 따뜻함

### 💬 따뜻한 채팅
- 실시간 채팅으로 따뜻한 메시지 나누기
- 전 세계 사용자들과 소통
- 100자 이내의 짧고 따뜻한 한마디

### 📱 모바일 최적화
- 반응형 디자인
- PWA 지원 (홈화면 추가 가능)
- 터치 최적화

## 🚀 시작하기

### 전체 시스템 구성

이 프로젝트는 **프론트엔드**와 **백엔드 서버**로 구성됩니다:
- **프론트엔드**: Vite 기반 정적 사이트
- **백엔드**: Node.js + Socket.io 실시간 서버 (별도 구축 필요)

### 백엔드 서버 구축

서버 요구사항 및 API 명세서를 확인하세요:
- **[SERVER_REQUIREMENTS.md](SERVER_REQUIREMENTS.md)** - 서버 구축 가이드 및 API 명세서

### 프론트엔드 로컬 개발

```bash
# 저장소 클론
git clone https://github.com/your-username/cpu_killer.git
cd cpu_killer

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 서버 URL을 설정하세요

# 개발 서버 시작
npm run dev
```

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 🔧 기술 스택

### Frontend
- **Frontend**: Vanilla JavaScript, CSS3
- **Workers**: Web Workers (백그라운드 CPU 작업)
- **GPU**: WebGL 2.0 (GPU 가속)
- **Build**: Vite
- **Deploy**: Netlify / Vercel

### Backend (별도 구축 필요)
- **Runtime**: Node.js + Express
- **실시간 통신**: Socket.io
- **데이터베이스**: Redis + PostgreSQL/MySQL
- **Deploy**: Docker 권장

## 🌐 배포

### 프론트엔드 배포 (Netlify)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

환경 변수 설정:
- `VITE_SERVER_URL`: 백엔드 서버 URL
- `VITE_WS_URL`: WebSocket 서버 URL

### 백엔드 배포

[SERVER_REQUIREMENTS.md](SERVER_REQUIREMENTS.md) 문서를 참고하여 서버를 구축하고 배포하세요.

## 📊 성능

- **CPU 부하**: 코어 수 × 2배 워커 실행
- **GPU 부하**: 4개 캔버스 동시 렌더링
- **발열 속도**: 2-3분 내 체감 가능
- **연산량**: 기존 대비 10-20배 증가

자세한 성능 정보는 [PERFORMANCE.md](PERFORMANCE.md) 참고

## ⚠️ 주의사항

- CPU와 GPU 사용량이 매우 높아집니다
- 노트북은 발열에 주의하세요
- 배터리 소모가 빠를 수 있습니다
- 장시간 사용 시 휴식을 권장합니다
- 여름철에는 사용을 자제하세요

## 🎯 왜 손난로인가?

CPU와 GPU를 사용하면 실제로 열이 발생합니다!
- 추운 겨울, 스마트폰이나 노트북을 손난로처럼 사용
- 혼자가 아닌 전 세계 사람들과 함께
- 재미있는 상호작용으로 따뜻한 커뮤니티 형성

## 🤝 기여

PR 환영합니다! 더 따뜻한 기능을 추가해주세요 🔥

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m '🔥 Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🙏 감사의 말

- Socket.io - 실시간 통신
- Netlify - 무료 호스팅
- Vite - 빠른 빌드 도구

---

**Made with 🔥 and ❤️**

⚡ 함께 모여 따뜻하게!
