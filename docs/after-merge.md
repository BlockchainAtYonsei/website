# 머지 후 운영자 할 일 — 한 장 요약

리서치/뉴스 백엔드가 main에 머지되었습니다. 맥미니에서 해줄 일은 아래
**두 가지**뿐이고, 각각 자세한 안내 문서가 따로 있습니다. 이 문서는 순서와
확인 방법만 담습니다.

## 자동으로 되는 것 (할 일 아님)

머지되면 맥미니의 자동 배포(60초 폴링)가 알아서 처리합니다:

- 컨테이너 3개(bay-pg, bay-backend, bay-web) 빌드·재기동
- DB 스키마 마이그레이션 (부팅 시 자동)
- 멤버 명단 반영 (부팅 시 자동 — 이후 명단 수정은 저장소의
  `backend/scripts/seed-members.ts` 편집 → 머지가 곧 반영)
- 노션 뉴스/리서치 동기화 (10분 주기 + 배포 직전 1회)

## 할 일 1 — 최초 셋업 (아직 안 했다면)

배포 구조가 컨테이너 1개 → 3개로 바뀌는 최초 1회 셋업입니다. 이미
`backend.env`를 만들고 3개 컨테이너가 돌고 있다면 건너뜁니다.

→ **[docs/deploy-runbook.md](./deploy-runbook.md)** 순서대로

`backend.env`의 Notion 항목은 **상현에게 2개만 받으면 됩니다.** 나머지는
채울 필요가 없습니다:

| 항목 | 어떻게 |
|---|---|
| `NOTION_TOKEN` | 상현에게 받기 (Notion 통합 시크릿) |
| `NOTION_DB_NEWS` | 상현에게 받기 (뉴스 DB id — 이미 확정된 값이 있음) |
| `NOTION_DB_ARTICLES` | **비워두세요.** 리서치용 Notion DB가 아직 없습니다 |
| `NOTION_DB_MEMBERS` | **비워두세요.** 현재 코드가 쓰지 않습니다(멤버는 저장소가 원본) |

> 참고: 이 값들은 Notion **데이터베이스 주소에서 따옵니다.** 해당 DB를 브라우저로
> 열었을 때 `notion.so/<워크스페이스>/**32자리 영숫자**?v=...` 의 굵은 부분이
> 곧 id입니다. 다만 위 표대로 새로 찾을 일은 없습니다.

`NOTION_DB_ARTICLES`가 비어 있어도 배포·뉴스 동기화는 정상입니다(확인함).
대신 **리서치 글 목록이 빈 채로 뜹니다.** 데모용으로 채우려면:

```sh
docker exec bay-backend npm run seed:mock     # 샘플 글 (뉴스·멤버는 안 건드림)
```

나중에 리서치용 Notion DB를 만들면, 그 DB를 통합에 공유한 뒤 id를
`NOTION_DB_ARTICLES`에 넣고 `docker restart bay-backend` 하면 붙습니다.

## 할 일 2 — R2 이미지 저장소 연결 (약 10분, 중요)

뉴스 사진이 노션의 1시간짜리 임시 주소로 저장되고 있어서, 이걸 안 하면
**사진이 계속 조용히 깨집니다.** Cloudflare 대시보드에서 값 6개 받아
`backend.env`에 넣는 작업입니다. 코드 수정 없음.

→ **[docs/r2-setup.md](./r2-setup.md)** 순서대로 (확인 명령까지 포함)

## 끝났는지 확인

```sh
docker ps                        # bay-pg, bay-backend, bay-web 세 개
curl -s localhost:4000/health    # {"status":"ok","db":"up",...}
curl -s localhost:3001/research/news -o /dev/null -w "%{http_code}\n"   # 200
curl -s "localhost:4000/v1/news?size=50" | grep -c amazonaws            # 0 (R2 후)
```

넷 다 통과하면 끝입니다. 막히면 `/Users/Shared/srv/.bay-web-cicd/deploy.log`
끝부분과 함께 상현에게 연락 주세요.
