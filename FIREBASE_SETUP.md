# Firebase 설정 가이드

## 옵션 1: 무료 Firebase 사용 (추천)

1. Firebase Console 접속: https://console.firebase.google.com/
2. 새 프로젝트 생성
3. Realtime Database 생성 (테스트 모드로 시작)
4. 프로젝트 설정에서 웹 앱 추가
5. Firebase 설정 정보를 `main.js`의 `firebaseConfig`에 복사

### Firebase Realtime Database 규칙 설정:
```json
{
  "rules": {
    "onlineUsers": {
      ".read": true,
      ".write": true,
      "$userId": {
        ".validate": "newData.hasChildren(['timestamp', 'online'])"
      }
    }
  }
}
```

**무료 플랜 제한:**
- 동시 연결: 100명
- 데이터 저장: 1GB
- 다운로드: 10GB/월
- 이 프로젝트에는 충분합니다!

## 옵션 2: PeerJS 공용 서버 (대안)

PeerJS의 무료 공용 서버를 사용할 수도 있지만, 중앙 카운터가 없어서 정확한 접속자 수를 알기 어렵습니다.

## 옵션 3: Supabase (Firebase 대안)

Supabase도 무료 플랜이 있으며 Firebase와 비슷하게 사용 가능합니다.
- https://supabase.com/

## 현재 상태

현재 코드에는 데모용 Firebase 설정이 들어있습니다. 
실제로 작동하려면 본인의 Firebase 프로젝트를 만들고 설정을 변경해야 합니다.

Firebase 없이도 로컬에서는 정상 작동하며, 접속자 수만 표시되지 않습니다.
