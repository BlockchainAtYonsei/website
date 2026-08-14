# 맥미니 배포 런북 — 리서치 백엔드 합류판

이 브랜치가 main에 머지되면 배포 구조가 **컨테이너 1개 → 3개**로 바뀝니다.
운영자가 맥미니에서 **한 번만** 해줄 일이 있고, 그 전까지는 기존 사이트가
그대로 떠 있습니다(안전).

```
[Cloudflare 터널] → bay-web :3001 (Next.js)
                      │ 서버사이드 fetch
                      ▼
                    bay-backend :4000 (NestJS · Notion sync + API)
                      │ bay-net (도커 내부망)
                      ▼
                    bay-pg (Postgres 17 · 볼륨 bay-pg-data)
```

## 머지 직후 무슨 일이 일어나나

기존 `deploy.sh`(운영자 복사본)가 새 main을 빌드하려다 **실패하고 기존
컨테이너를 유지**합니다 — 새 웹은 빌드 시점에 백엔드 API가 필요하기
때문입니다. 즉 머지 자체로 사이트가 죽지는 않지만, 아래 셋업 전까지 새
버전은 배포되지 않습니다.

## 1회 셋업 (순서대로)

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
# Notion — 준비되면 채우고 저장만 하면 됨 (없어도 배포는 됨, 리서치 섹션이 비어 보일 뿐)
# 멤버는 Notion이 아니라 backend/scripts/seed-members.ts가 원본 — 부팅 시 자동 반영
NOTION_TOKEN=
NOTION_DB_ARTICLES=
NOTION_DB_NEWS=
# 뉴스 본문 이미지 재호스팅용 R2/S3 — 뉴스 sync를 켰다면 사실상 필수:
# 미설정이면 Notion 서명 URL을 그대로 저장하는데, 그 URL은 1시간이면 죽는다
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
curl -s localhost:4000/health   # {"status":"ok","db":"up",...}
curl -s localhost:3001/research -o /dev/null -w "%{http_code}\n"   # 200
```

## Cloudflare 주의

- 터널/프록시는 **:3001(bay-web)만** 노출합니다. :4000은 노출할 필요
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
curl -X POST -H "x-sync-key: $SYNC_KEY" localhost:4000/v1/sync/all

# 콘텐츠가 안 보일 때 — sync 런 경고 확인
curl -H "x-sync-key: $SYNC_KEY" localhost:4000/v1/sync/runs

# 데이터 백업 (가끔)
docker exec bay-pg pg_dump -U bay bay > ~/bay-backup-$(date +%Y%m%d).sql
```

- 배포 로그: `$BASE/deploy.log` — `BLOCKED:`로 시작하는 줄이 있으면 위
  셋업이 안 된 것입니다.
- 마이그레이션은 bay-backend 부팅 시 자동 적용되고, 실패하면 기존
  컨테이너가 유지됩니다.
- **멤버 명단 수정** = `backend/scripts/seed-members.ts` 편집 → 머지.
  부팅 시 자동으로 upsert됩니다(실패해도 서버는 뜨고 로그만 남음).
  아티클을 mock으로 채우려면: `docker exec bay-backend npm run seed:mock`
  (아티클만 갈아엎음 — 멤버·뉴스는 건드리지 않음).
