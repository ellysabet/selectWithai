# 선택을 도와줘 🤔

두 가지 선택지와 지금의 감정을 입력하면, AI가 하나를 골라주고 이유와 따뜻한 한마디를 건네주는 웹앱입니다.

## 폴더 구조

```
choice-helper/
├── index.html         # 프론트엔드 (정적 페이지)
├── api/
│   └── generate.js     # Gemini API를 호출하는 Vercel 서버리스 함수
├── package.json
└── .env.example
```

## 로컬에서 테스트하기 (선택)

1. Vercel CLI 설치: `npm i -g vercel`
2. 프로젝트 루트에서 `vercel dev` 실행
3. 실행 시 `GEMINI_API_KEY` 환경변수를 물어보면 Gemini API 키를 입력 (또는 `.env.local` 파일에 `GEMINI_API_KEY=실제키` 로 저장)

## Vercel 배포 방법

1. 이 폴더를 GitHub 저장소에 올립니다.
2. [vercel.com](https://vercel.com) 에서 New Project → 해당 GitHub 저장소 선택 → Import
3. **Environment Variables** 설정에서 아래를 추가합니다.
   - Key: `GEMINI_API_KEY`
   - Value: 발급받은 Gemini API 키 (Google AI Studio에서 발급)
4. Deploy 클릭 → 배포 완료 후 발급된 URL로 접속하면 바로 사용 가능합니다.

## 참고

- Gemini API 키는 [Google AI Studio](https://aistudio.google.com/apikey) 에서 무료로 발급받을 수 있습니다.
- `api/generate.js`는 `gemini-2.5-flash` 모델을 사용합니다. 모델명이 바뀌거나 만료되면 이 파일 상단의 `MODEL_NAME` 값만 바꿔주면 됩니다.
- API 키는 절대 `index.html`이나 프론트엔드 코드에 넣지 마세요. 반드시 서버리스 함수(`api/generate.js`) 안에서만, 그것도 환경변수로만 사용해야 학생들이 브라우저 개발자도구로 키를 볼 수 없습니다.
