# NOTE TESTER 개발 학습 아카이브

Java·JSP, 웹 기초, Spring, React, 데이터베이스, CI/CD, Python, ML·DL, LangChain RAG까지 실제 학습 저장소를 바탕으로 다시 구성한 공개 학습 사이트입니다.

각 수업은 다음 원칙으로 작성합니다.

- 중간 페이지부터 읽어도 이해할 수 있게 필요한 앞 개념을 짧게 다시 설명합니다.
- 개념 설명과 코드, 예상 실행 결과를 한 흐름으로 보여 줍니다.
- 서로 이어지는 용어와 수업을 링크해 복습 경로를 잃지 않게 합니다.
- 공개 가능한 저장소만 출처로 연결하고 비공개 백업과 민감 정보는 싣지 않습니다.

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm run dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

## 검증과 정적 빌드

```bash
npm run lint
npm test
```

정적 결과물은 `dist/client`에 생성됩니다. `main` 브랜치에 푸시하면 GitHub Actions가 이 폴더를 GitHub Pages에 배포합니다.

## 공개 주소

[https://notetester.github.io/](https://notetester.github.io/)
