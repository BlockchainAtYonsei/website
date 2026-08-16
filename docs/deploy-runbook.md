# 맥미니 배포 런북

배포 구조는 **컨테이너 3개**입니다.

```
[Cloudflare 터널] → bay-web 호스트 :3001 → 컨테이너 :3000 (Next.js)
                      │ 서버사이드 fetch
                      ▼
                    bay-backend 호스트 :4001 → 컨테이너 :4000
                                     (NestJS · Notion sync + API)
                      │ bay-net (도커 내부망)
                      ▼
                    bay-pg (Postgres 17 · 볼륨 bay-pg-data)
```

> **백엔드 호스트 포트를 믿지 말고 확인하세요 — `docker port bay-backend`.**
> 이 저장소의 `scripts/deploy.sh`는 `-p 4000:4000`으로 띄우는데, 맥미니에서
> 실제로 동작한 명령은 4001이었습니다(`docs/r2-setup.md`). launchd가 실행하는
> 것은 checkout이 아니라 `/Users/Shared/srv/BAY-WEB/scripts/deploy.sh` 복사본
> 이라, 그 복사본이 구버전이면 이렇게 갈립니다. 틀린 포트로 보내면 `curl`이
> **조용히 아무것도 안 합니다** — 그래서 아래 명령에는 `-i`를 붙입니다.

## 지금 상태 (2026-08-15)

아래 1회 셋업과 R2 연결은 **이미 끝났습니다.** 이 문서는 재구축·인수인계용
으로 남깁니다. 현재 돌아가는 방식:

- **뉴스** — Notion에서 10분 주기로 동기화되는 실제 데이터. 본문 이미지는
  R2(버킷 `bay-media`)로 재호스팅되어 `img.blockchainatyonsei.com`으로
  나갑니다.
- **리서치 글** — 아직 **의도된 목업**입니다. 리서치용 Notion DB가 없어서
  `NOTION_DB_ARTICLES`를 비워둔 채 `seed:mock`으로 채워둔 상태이고,
  실명 바이라인이 붙습니다. 실제 DB가 생기면 아래 "리서치 Notion DB 붙이기"
  대로 전환하세요.
- **멤버 명단** — Notion이 아니라 저장소가 원본입니다.
  `backend/scripts/seed-members.ts` 편집 → 머지 → 컨테이너 부팅 시 자동 반영.

## 자동으로 되는 것 (할 일 아님)

머지되면 맥미니의 자동 배포(60초 폴링)가 처리합니다:

- 컨테이너 3개 빌드·재기동
- DB 스키마 마이그레이션 (부팅 시 자동, 실패하면 기존 컨테이너 유지)
- 멤버 명단 upsert (부팅 시 자동, 실패해도 서버는 뜨고 로그만 남음)
- Notion 동기화 (10분 주기 + 배포 직전 1회)

## 1회 셋업 (재구축 시, 순서대로)

```sh
BASE=/Users/Shared/srv/.bay-web-cicd

# 1. 새 deploy.sh 반영 — launchd는 checkout이 아니라 아래 고정 경로의
#    복사본을 실행하므로, 스크립트 변경은 자동 반영되지 않습니다
cp $BASE/checkout/scripts/deploy.sh /Users/Shared/srv/BAY-WEB/scripts/deploy.sh

# 2. 시크릿 파일 생성 (git에 절대 넣지 않음)
PG_PW=$(openssl rand -hex 16)
cat > $BASE/backend.env <<EOF
POSTGRES_PASSWORD=$PG_PW
DATABASE_URL=postgresql://bay:$PG_PW@bay-pg:5432/bay
SYNC_KEY=$(openssl rand -hex 24)
REVALIDATE_SECRET=$(openssl rand -hex 24)
REVALIDATE_URL=http://host.docker.internal:3001/api/revalidate
# Notion — 토큰과 뉴스 DB id 2개는 상현에게 받으면 됩니다. 나머지는 비워두세요.
# 멤버는 Notion이 아니라 backend/scripts/seed-members.ts가 원본 — 부팅 시 자동 반영
NOTION_TOKEN=
NOTION_DB_ARTICLES=   # 비워둘 것 — 리서치용 Notion DB가 아직 없습니다(아래 참고)
NOTION_DB_NEWS=
# 뉴스 본문 이미지 재호스팅용 R2/S3 — 뉴스 sync를 켰다면 사실상 필수:
# 미설정이면 Notion 서명 URL을 그대로 저장하는데, 그 URL은 1시간이면 죽는다
# 설정 절차는 docs/r2-setup.md (운영자에게 그대로 넘기면 되는 단독 문서)
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_URL=
EOF
chmod 600 $BASE/backend.env

# 3. 다음 폴링(60초)에 자동 배포됨. 확인:
tail -20 $BASE/deploy.log
docker ps            # bay-pg, bay-backend, bay-web 세 개
curl -s localhost:4001/health   # {"status":"ok","db":"up",...}
curl -s localhost:3001/research -o /dev/null -w "%{http_code}\n"   # 200
curl -s "localhost:4001/v1/news?size=50" | grep -c amazonaws       # 0 (R2 연결 후)
```

## 리서치 Notion DB 붙이기 (나중에)

리서치용 Notion DB를 만들면: 그 DB를 통합에 공유 → id를
`NOTION_DB_ARTICLES`에 넣기 → `docker restart bay-backend`. 그 전까지
리서치 목록은 `seed:mock`이 채운 목업입니다(운영 섹션 참고).

## Cloudflare 주의

- 터널/프록시는 **:3001(bay-web)만** 노출합니다. 백엔드 포트는 노출할 필요
  없습니다 — 사이트가 서버사이드에서만 호출합니다.
- 지금 main이 Cloudflare **Pages** 정적 호스팅이라면, 이 버전부터는 그
  방식이 불가합니다(백엔드 + DB + ISR 필요). 맥미니 + 터널 구성으로
  전환한 뒤 DNS를 터널로 돌리면 됩니다.

## 전제 조건

- Docker Desktop 또는 OrbStack (스크립트가 `host.docker.internal`을 씀 —
  colima는 추가 설정 없이는 안 됨)
- 디스크: 이미지 3개 + Postgres 볼륨, 여유 5GB면 충분

## 운영

```sh
# Notion에서 발행 직후 즉시 반영하고 싶을 때 (평소엔 10분 주기 자동)
curl -i -X POST -H "x-sync-key: $SYNC_KEY" localhost:4001/v1/sync/all

# 콘텐츠가 안 보일 때 — sync 런 경고 확인
curl -H "x-sync-key: $SYNC_KEY" localhost:4001/v1/sync/runs

# 데이터 백업 (가끔)
docker exec bay-pg pg_dump -U bay bay > ~/bay-backup-$(date +%Y%m%d).sql
```

- 배포 로그: `$BASE/deploy.log` — `BLOCKED:`로 시작하는 줄이 있으면 위
  셋업이 안 된 것입니다.
- 마이그레이션은 bay-backend 부팅 시 자동 적용되고, 실패하면 기존
  컨테이너가 유지됩니다.
- **멤버 명단 수정** = `backend/scripts/seed-members.ts` 편집 → 머지.
  부팅 시 자동으로 upsert됩니다(실패해도 서버는 뜨고 로그만 남음).
- **아티클 목업 갱신** — 목업 내용이 바뀌었으면(개수, 참고자료, 커버) 배포
  만으로는 반영되지 않습니다. 아티클 행은 부팅 시 자동 시드되지 않고, 이
  명령을 손으로 돌려야 갈립니다:

  ```sh
  docker exec -e SEED_ALLOW_REMOTE=1 bay-backend npm run seed:mock
  ```

  `SEED_ALLOW_REMOTE=1`이 필요한 이유: 이 스크립트는 아티클 테이블을 통째로
  지우고 다시 만들기 때문에, 로컬이 아닌 DB(여기서는 `bay-pg`)를 향하면
  기본적으로 거부합니다 — 예전에 같은 계열 스크립트가 프로덕션에 지어낸
  뉴스 서른 건을 실명 바이라인으로 몇 주간 올려둔 적이 있어서입니다.
  멤버·뉴스는 건드리지 않습니다.
