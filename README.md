# 오늘의 건강

임신과 육아를 위한 건강 관리 플랫폼입니다.

## 기술 스택

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Linting**: ESLint

## 시작하기

### 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn

### 설치 및 실행

1. 의존성 설치:

```bash
npm install
# 또는
yarn install
```

2. 개발 서버 실행:

```bash
npm run dev
# 또는
yarn dev
```

3. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
momhealth-web/
├── pages/              # Next.js 페이지
│   ├── _app.tsx       # 앱 래퍼
│   └── index.tsx      # 홈페이지
├── components/         # 재사용 가능한 컴포넌트
├── styles/            # CSS 스타일
│   ├── globals.css    # 전역 스타일
│   └── Home.module.css # 홈페이지 스타일
├── public/            # 정적 파일
├── next.config.js     # Next.js 설정
├── tsconfig.json      # TypeScript 설정
└── package.json       # 프로젝트 의존성
```

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행

## 기능

- 🏠 **홈페이지**: 오늘의 건강 소개 및 주요 기능 안내
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두 지원
- 🎨 **모던 UI**: 깔끔하고 직관적인 사용자 인터페이스

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
