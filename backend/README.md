# bay-backend

NestJS + PostgreSQL(Prisma 7) — Notion 동기화 + 읽기 전용 API.
설계 문서: [`../docs/backend-design.md`](../docs/backend-design.md)

## 개발 시작

```sh
# 1. 로컬 Postgres (일회용)
docker run -d --name bay-pg-dev \
  -e POSTGRES_USER=bay -e POSTGRES_PASSWORD=bay -e POSTGRES_DB=bay \
  -p 5432:5432 postgres:17-alpine

# 2. env
cp .env.example .env   # DATABASE_URL=postgresql://bay:bay@localhost:5432/bay

# 3. 스키마 반영 + 클라이언트 생성
npm install
npx prisma migrate deploy
npx prisma generate

# 4. 실행
npm run start:dev      # http://localhost:4000/health
```

## Notion 연동 준비 (운영진 셋업)

1. [notion.so/my-integrations](https://www.notion.so/my-integrations)에서 **internal
   integration** 생성 → 토큰을 `NOTION_TOKEN`에.
2. 데이터베이스 2개(Research/News)를 각각 인테그레이션에 **연결(공유)**.
   DB 링크(URL 그대로 붙여넣기 가능)를 `NOTION_DB_ARTICLES` /
   `NOTION_DB_NEWS`에. 멤버 명단은 Notion에 없다 — 이 DB가 원본이고,
   `npm run seed:members`(scripts/seed-members.ts)로 관리한다.
3. 속성 이름은 아래 표와 **정확히** 일치해야 한다(다르게 쓰고 싶으면
   `src/notion/schema.ts` 한 파일만 수정).

**Research** — 제목(title) · Slug(text, `[a-z0-9-]` 필수) · Dek(text) ·
카테고리(select) · Accent(select: blue/violet/teal/indigo, 비우면 자동) ·
상태(select: 발행/초안/보관) · 발행일(date) · Featured(checkbox) ·
작성자(relation → 멤버 페이지, 복수 = 공저 — 페이지 제목을 명부의 이름과
공백 무시로 대조) · Medium URL(url) · 커버(files, 아직 미사용).
**본문은 페이지 안에 그냥 쓰면 된다** — 지원 블록: 제목2/3, 문단, 불릿/번호
리스트, 인용(마지막 줄 `— 출처`), 콜아웃(첫 줄 굵게 = 제목), 표, 이미지,
코드, 구분선. 굵게·인라인 코드·링크 유지. 미지원 블록은 경고와 함께 스킵.

**News** — 리서치팀의 Blockchain News Tracking DB를 그대로 읽는다(컬럼명이
곧 계약): Title(text) · Source(원문 링크 — 하이퍼링크 걸린 텍스트) ·
Content Summary(text) · Topic(multi-select) · Date of issue(date) ·
Author(이름 — 명부와 공백 무시로 대조) · Status · Pick(checkbox) ·
Slug/Cover(선택 — 없으면 페이지 id/크롤링 og:image로 자동).
**요약/인사이트는 페이지 본문에 쓰면** 뉴스 상세 페이지로 발행된다(리서치와
같은 블록 지원). 본문이 비어 있으면 링크-온리 아이템.

본문 이미지·카드 커버 재호스팅에는 S3 호환 버킷(R2 권장)이 필요 — `S3_*`
env. 없으면 sync는 돌지만 Notion 업로드 이미지 URL이 만료된다는 경고를
남긴다(로컬 개발용으로만 허용).

## 운영

```sh
# 수동 sync (Notion에서 글 발행 직후 즉시 반영하고 싶을 때)
curl -X POST -H "x-sync-key: $SYNC_KEY" localhost:4000/v1/sync/all
# 전체 리컨실 (삭제 반영 포함 — 새벽 4시 cron과 동일)
curl -X POST -H "x-sync-key: $SYNC_KEY" "localhost:4000/v1/sync/all?full=1"
# 콘텐츠가 안 보일 때 — 최근 런의 경고 확인
curl -H "x-sync-key: $SYNC_KEY" localhost:4000/v1/sync/runs
```

자동: 10분마다 증분 sync, 매일 04:00(KST) 전체 리컨실. Notion env가 없으면
크론은 조용히 쉰다(읽기 API 단독 구동 가능).

## 알아둘 것

- **Prisma 7**: datasource url은 `schema.prisma`가 아니라 `prisma.config.ts`에
  있다. `.env` 자동 로딩도 없어져서 config가 `process.loadEnvFile()`로 직접
  읽는다. `migrate diff`는 DATABASE_URL이 없으면 **에러 없이 빈 출력**을
  내니 주의.
- 런타임 클라이언트는 driver adapter(`@prisma/adapter-pg`) 경유 —
  `src/prisma/prisma.service.ts`.
- 생성된 클라이언트(`src/generated/prisma/`)는 gitignore — 클론 후
  `npx prisma generate` 필요.
- `/health`는 DB가 죽어 있어도 200 + `degraded`로 응답한다(크래시루프 방지).
  DB 상태 + 마지막 sync 런을 함께 보여준다.
