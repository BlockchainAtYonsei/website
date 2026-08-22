# 배포 런북 (Railway)

2026-08-23부터 사이트는 **Railway**에서 돕니다. 맥미니 + Cloudflare 터널 구성은
폐기됐습니다(옛 절차는 git 히스토리의 이전 버전 참고).

```
GitHub main ──push──▶ Railway 프로젝트 bay-website (리전: 싱가포르)
                       ├─ website      Next.js   ← blockchainatyonsei.com / www
                       │     │ 서버사이드 fetch (API_URL)
                       │     ▼
                       ├─ bay-backend  NestJS    ← api.blockchainatyonsei.com
                       │     │ Notion sync(10분) · 이미지 재호스팅 · 읽기 API
                       │     ▼
                       ├─ Postgres     (Railway DB, 볼륨)
                       └─ bay-media    (Railway Bucket, S3 호환 · 비공개)
                             └ 이미지는 bay-backend의 GET /v1/media/<key>로 공개 서빙
```

## 계정 (인수인계 시 이것만 넘기면 됨)

| 무엇 | 어디 | 계정 |
|---|---|---|
| 코드 | github.com/BlockchainAtYonsei/website | GitHub 조직 (org owner가 Railway GitHub App 권한 관리) |
| 호스팅 전부 | railway.com → 프로젝트 `bay-website` | 학회 Gmail (blockchainatyonsei@) |
| DNS | Cloudflare (DNS만 사용, 프록시 OFF) | 학회 Gmail |
| 도메인 등록 | GoDaddy (네임서버 → Cloudflare) | 학회 계정 |
| 콘텐츠 원본 | Notion (뉴스 DB) | 리서치팀 워크스페이스 |

Railway 대시보드에 임원 초대: 프로젝트 → Settings → Members. 기수 교체 =
사람 추가/삭제. 시크릿은 전부 Railway Variables에만 있습니다(채팅/문서에
절대 적지 않기).

## 자동으로 되는 것 (할 일 아님)

`main`에 머지되면 Railway가 두 서비스를 다시 빌드·배포합니다.

- **bay-backend** 부팅 순서: `prisma migrate deploy` → `seed:members`(명부
  upsert) → (`NOTION_DB_ARTICLES` 비어 있으면) `seed:mock` → 서버. 헬스체크
  `/health`가 200을 줄 때까지 **이전 컨테이너가 계속 서빙**하므로 배포 중
  502가 없습니다(`backend/railway.json`).
- **website**는 빌드 중 백엔드(`API_URL`)를 호출해 페이지를 프리렌더합니다.
  백엔드가 죽어 있으면 빌드가 실패하는 게 정상 — 백엔드 먼저 고치고
  website를 Redeploy.
- 리전은 `railway.json`/`backend/railway.json`의 `multiRegionConfig`로
  싱가포르에 고정돼 있습니다. 대시보드에서 바꿔도 다음 배포에 되돌아오니
  바꾸려면 파일을 고치세요.
- Notion 동기화 10분마다, 매일 04:00 KST 전체 리컨실.

## 서비스별 변수 (Railway → 서비스 → Variables)

**bay-backend**

| 변수 | 값/출처 |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` 참조 |
| `PORT` | `4000` |
| `CORS_ORIGIN` | `https://blockchainatyonsei.com,https://www.blockchainatyonsei.com` |
| `NOTION_TOKEN` · `NOTION_DB_NEWS` | Notion 인테그레이션 토큰 · 뉴스 DB id (**id만**, URL/주석 줄 섞지 않기) |
| `NOTION_DB_ARTICLES` | 비움 — 리서치 Notion DB가 생기면 채움 (아래) |
| `SYNC_KEY` | 수동 sync 트리거용 시크릿 |
| `REVALIDATE_URL` | `http://website.railway.internal:3000/api/revalidate` (내부망) |
| `REVALIDATE_SECRET` | website의 같은 변수와 **동일해야** 함 |
| `S3_ENDPOINT` · `S3_BUCKET` · `S3_ACCESS_KEY_ID` · `S3_SECRET_ACCESS_KEY` · `S3_REGION=auto` | Bucket `bay-media` → Credentials 탭 값 그대로 |
| `S3_PUBLIC_URL` | `https://api.blockchainatyonsei.com/v1/media` — 이 값이 DB에 저장되는 이미지 URL의 접두사 |

**website**

| 변수 | 값 |
|---|---|
| `API_URL` | `https://api.blockchainatyonsei.com` (빌드·런타임 모두 사용) |
| `REVALIDATE_SECRET` | bay-backend와 동일 |
| `NEXT_TELEMETRY_DISABLED` | `1` |

## 도메인 / DNS

Cloudflare DNS 레코드(모두 **DNS only**):

| Type | Name | Target |
|---|---|---|
| CNAME | `@` | website 서비스의 Railway 타깃 |
| CNAME | `www` | website 서비스의 Railway 타깃 |
| CNAME | `api` | bay-backend 서비스의 Railway 타깃 |
| TXT | `_railway-verify`, `_railway-verify.www`, `_railway-verify.api` | Railway가 보여주는 값 |

타깃 값은 Railway → 서비스 → Settings → Networking → Custom Domains에
표시됩니다. 도메인을 지웠다 다시 추가하면 타깃이 바뀌니 DNS도 같이 고치세요.
apex(`@`)에 CNAME이 되는 건 Cloudflare의 flattening 덕분이라 DNS 호스트를
다른 곳으로 옮기면 apex가 깨집니다.

## 운영

```sh
API=https://api.blockchainatyonsei.com
# Notion 발행 직후 즉시 반영 (평소엔 10분 주기 자동)
curl -i -X POST -H "x-sync-key: $SYNC_KEY" "$API/v1/sync/all"
# 전체 리컨실 — 삭제 반영 + 깨진 이미지 재호스팅
curl -i -X POST -H "x-sync-key: $SYNC_KEY" "$API/v1/sync/all?full=1"
# 콘텐츠가 안 보일 때 — 최근 런의 경고
curl -s -H "x-sync-key: $SYNC_KEY" "$API/v1/sync/runs" | head -c 2000
# 상태
curl -s $API/health            # {"status":"ok","db":"up","lastSync":{...}}
```

- **멤버 명단 수정** = `backend/scripts/seed-members.ts` 편집 → 머지. 부팅 시
  자동 upsert.
- **아티클 목업 갱신** — 부팅 시 자동 시드되지 않음. Railway → bay-backend →
  우상단 ⋯ → *Shell*(또는 `railway ssh`)에서:
  `SEED_ALLOW_REMOTE=1 npm run seed:mock`
- **리서치 Notion DB 붙이기** — DB를 인테그레이션에 공유 → id를
  `NOTION_DB_ARTICLES`에 → 재배포. 그 순간부터 목업 시드는 자동으로 꺼집니다.
- **이미지가 안 뜰 때** — `/v1/sync/runs`에 `image re-host failed (The access
  key ID you provided does not exist…)`가 보이면 `S3_ACCESS_KEY_ID`/`SECRET`이
  Bucket Credentials와 다른 것. 값 교체 후 `sync/all?full=1`.
- **DB 백업** — Railway Postgres는 볼륨 스냅샷을 지원하지만, 이 DB는 전부
  재생성 가능합니다(명부=레포, 뉴스=Notion, 아티클=목업). 최악의 경우 새
  Postgres + 재배포 + `sync/all?full=1`로 복구.
- **로그** — 서비스 → Deployments → 최신 배포 → Logs. HTTP 로그의 `host`가
  `api.blockchainatyonsei.com`으로 찍히지 않으면 도메인 연결 문제.

## 로컬 개발

`backend/README.md` 참고. 로컬에선 S3 미설정 상태로 돌려도 됩니다(경고만 남음).

## 비용 감

Hobby 플랜 + 사용량. 컨테이너 2개(소형) + Postgres + Bucket 수 GB ≈ 월 $8~15.
프로젝트 → Settings → Usage에서 확인, Billing에서 한도 알림 설정 권장.
