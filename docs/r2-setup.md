# R2 이미지 저장소 셋업 — 운영자용

**소요 시간: 약 10분. 코드 수정은 없습니다.** Cloudflare 대시보드에서 값 6개를
받아 맥미니의 설정 파일에 적고, 컨테이너를 한 번 재시작하면 끝입니다.

---

## 먼저 — 이 한 줄만 급합니다 (Cloudflare 작업 없음, 1분)

맥미니 터미널에서:

```sh
source /Users/Shared/srv/.bay-web-cicd/backend.env
curl -i -X POST -H "x-sync-key: $SYNC_KEY" "localhost:4001/v1/sync/news?full=1"
```

이것만으로 두 가지가 해결됩니다:

- **깨져 보이던 사진 자리가 없어집니다.** 사진이 안 열릴 때 언론사 사진으로
  대신 채우도록 코드가 바뀌었고, 이 명령이 그 대체 사진을 모든 글에 채워
  넣습니다.
- **가짜 뉴스 30건이 사이트에서 내려갑니다.** (아래 8단계 참고)

**2~3분쯤 걸리고 그동안 응답이 없습니다.** 정상입니다. 끝나면 맨 위에
`HTTP/1.1 201`과 처리 건수가 나옵니다.

> **포트는 4001입니다.** 백엔드는 컨테이너 안에서 4000을 듣지만 맥미니
> 바깥으로는 4001로 열려 있습니다. 이 문서가 한동안 4000으로 적혀 있었고,
> 그 포트로 보내면 `curl`이 **아무 말 없이 아무것도 안 합니다** — 실행한 것
> 처럼 보이는데 서버에는 닿지 않습니다. 위 명령에 `-i`가 붙어 있는 이유가
> 이것으로, 상태 코드가 찍히니 그런 실패를 눈으로 잡을 수 있습니다.
> 포트가 의심되면 `docker port bay-backend`로 확인하세요.

아래 R2 셋업(1~7단계)은 이 다음에 여유 있을 때 하시면 됩니다. 급한 불은 위
한 줄로 꺼집니다.

---

## 왜 (R2가) 필요한가

뉴스 큐레이터가 노션 글에 붙여넣은 사진은, 노션이 주는 **1시간짜리 임시
주소**를 갖고 있습니다. 지금은 사이트가 그 주소를 그대로 저장하고 있어서
한 시간 뒤에 전부 죽습니다. 위 한 줄을 실행하면 그 자리가 언론사 사진으로
채워져 **빈 자리로 보이지는 않지만**, 큐레이터가 고른 원래 사진은 여전히
안 뜹니다.

고치는 방법은 사진을 **우리 저장소로 복사해두는 것**이고, 그 코드는 이미
짜여 있습니다. 지금은 저장소 주소만 비어 있어서 건너뛰고 있을 뿐입니다.
아래 값들을 채우면 그 다음 동기화부터 자동으로 복사가 시작되고, **이미 깨진
사진들도 같이 되살아납니다.**

저장소로는 Cloudflare R2를 씁니다. 이미 Cloudflare를 쓰고 계셔서 계정이
그대로 쓰이고, 무료 한도(10GB)가 이 사이트 규모의 수백 배라 비용은 사실상
0원입니다.

---

## 1단계 — 버킷 만들기

Cloudflare 대시보드 → 왼쪽 메뉴 **R2** → **Create bucket**

- 이름: `bay-media`
- 위치: 기본값(Automatic) 그대로

## 2단계 — API 토큰 발급

R2 화면 우측 **{} API** 또는 **Manage API Tokens** → **Create API Token**

- 권한(Permissions): **Object Read & Write**
- 적용 대상: 방금 만든 `bay-media` 버킷만 지정해도 되고, 전체여도 됩니다

발급되면 화면에 세 가지가 나옵니다. **이 창을 닫으면 Secret은 다시 볼 수
없으니** 먼저 복사해두세요:

- Access Key ID
- Secret Access Key
- **Endpoint** (`https://<계정ID>.r2.cloudflarestorage.com` 형태)

## 3단계 — 사진 주소용 도메인 연결

버킷 `bay-media` → **Settings** 탭 → **Public access** 항목 →
**Connect Domain**

- 도메인: `img.blockchainatyonsei.com`

DNS가 이미 Cloudflare에 있어서 자동으로 연결됩니다. 연결 후 상태가
`Active`가 될 때까지 1~2분 걸릴 수 있습니다.

> 같은 화면에 `r2.dev`로 끝나는 주소를 켜는 옵션도 있는데, **그건 쓰지
> 말아주세요.** 개발용이라 Cloudflare가 속도 제한을 걸어둡니다. 커스텀
> 도메인으로 연결해야 평소 쓰시던 Cloudflare 캐싱을 타서 사진이 빠르게
> 뜹니다.

---

## 4단계 — 맥미니 설정 파일에 값 넣기

맥미니 터미널에서 설정 파일을 엽니다:

```sh
nano /Users/Shared/srv/.bay-web-cicd/backend.env
```

파일 아래쪽에 `S3_`로 시작하는 줄 6개가 **비어 있는 채로** 있을 겁니다.
그 줄들을 찾아 위에서 받은 값으로 채워주세요(기존 줄의 `=` 뒤에 붙이면
됩니다). 만약 그런 줄이 없다면 아래 6줄을 그대로 파일 끝에 추가하시면
됩니다:

```
S3_ENDPOINT=https://<계정ID>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=bay-media
S3_ACCESS_KEY_ID=<2단계의 Access Key ID>
S3_SECRET_ACCESS_KEY=<2단계의 Secret Access Key>
S3_PUBLIC_URL=https://img.blockchainatyonsei.com
```

주의할 점 세 가지:

- `S3_REGION`은 `auto` 그대로 둡니다 (R2는 이 값을 씁니다)
- 값에 따옴표를 붙이지 마세요. 등호 뒤에 바로 값입니다
- `S3_PUBLIC_URL` 끝에 슬래시(`/`)를 붙이지 마세요

저장: `Ctrl+O` → `Enter` → `Ctrl+X`

## 5단계 — 적용

설정 파일만 고치면 자동 배포는 걸리지 않습니다(자동 배포는 GitHub에 새
커밋이 올라올 때만 돕니다). 컨테이너를 직접 한 번 재시작해주세요:

```sh
docker restart bay-backend
```

10초쯤 뒤 정상 기동 확인:

```sh
curl -s localhost:4001/health
```

`{"status":"ok","db":"up",...}` 가 나오면 됩니다.

## 6단계 — 사진 복구 실행

이제 노션에서 사진을 다시 받아와 R2로 복사시킵니다:

```sh
source /Users/Shared/srv/.bay-web-cicd/backend.env
curl -i -X POST -H "x-sync-key: $SYNC_KEY" "localhost:4001/v1/sync/news?full=1"
```

**끝에 붙은 `?full=1`이 반드시 있어야 합니다.** 이게 없으면 최근에 수정된
글 한두 개만 훑고 0.5초 만에 끝나버려서, 이미 깨진 사진들은 그대로
남습니다. `?full=1`이 있어야 전체 글을 다시 훑습니다. 큰따옴표도 그대로
넣어주세요.

**1~2분쯤 걸리고 그동안 응답이 없습니다.** 정상입니다. 끝나면 처리 건수가
출력됩니다.

---

## 7단계 — 확인

아래 명령의 결과가 **`0`** 이면 성공입니다 (깨지는 노션 임시 주소가 하나도
안 남았다는 뜻):

```sh
curl -s "localhost:4001/v1/news?size=50" | grep -c amazonaws
```

`0`이 나왔다면 브라우저에서 https://www.blockchainatyonsei.com/research/news 를 열어
사진들이 제대로 뜨는지 눈으로도 한 번 봐주세요.

---

## 8단계 — 가짜 뉴스 30건이 사라졌는지 확인

**맨 위 "먼저" 절이나 6단계 중 하나만 실행했으면 이미 정리됐습니다** (둘 다
같은 명령입니다). 확인만 해주시면 됩니다.

사이트 개발 초기에 화면 배치를 보려고 만든 **가짜 뉴스 30건**이 실제
데이터베이스에 들어간 채로 남아 있습니다. 제목도 요약도 그럴듯하고 부원들
실명이 작성자로 붙어 있어서, 진짜 뉴스와 섞여 있으면 구별이 안 됩니다
(뉴스 아카이브 108건 중 30건이 이것입니다). 출처 링크에 `mock`이라는
글자가 들어 있는 것만이 유일한 표시입니다.

`?full=1` 동기화는 "노션에 없는 글은 내린다"는 규칙도 같이 실행하기 때문에,
이 30건이 자동으로 숨겨집니다. 아래 명령의 결과가 **`0`** 이면 정리된
것입니다:

```sh
curl -s "localhost:4001/v1/news?size=100" | grep -c "/mock/"
```

`0`이 아니면 명령 끝의 `?full=1`이 빠졌을 가능성이 높습니다. 그대로 다시
실행해주세요.

> 위 방법은 글을 **숨기는**(archived) 것이라 데이터베이스에는 행이 남습니다.
> 완전히 지우고 싶으시면 아래를 한 번 실행하시면 되는데, 급하지 않습니다.
> ```sh
> docker exec bay-pg psql -U bay -d bay -c "DELETE FROM news_items WHERE notion_page_id LIKE 'mock-news-%';"
> ```

---

## 9단계 (선택) — 언론사 사진도 우리 쪽으로 가져오기

여기까지 하면 **깨지는 문제는 완전히 해결됩니다.** 아래는 급하지 않은
개선이라 나중에 하셔도 됩니다.

현재 카드 썸네일 중 상당수는 언론사 서버(blockmedia.co.kr 등)에 직접
링크돼 있습니다. 당장 깨지진 않지만, 남의 서버라 느리고 언론사가 주소를
바꾸면 그때 깨집니다. 이것들까지 R2로 가져오려면 한 번만:

```sh
docker exec bay-pg psql -U bay -d bay -c "UPDATE news_items SET cover_url = NULL;"
```

그리고 6단계 명령(`?full=1` 포함)을 다시 실행하면 됩니다.

> **순서 주의:** 이 명령은 반드시 위 1~7단계를 모두 마친 뒤에 실행해야
> 합니다. R2 설정 전에 실행하면 언론사 주소를 다시 그대로 저장해서 아무
> 효과가 없습니다.


---

## 문제가 생기면

**Q. 6단계에서 에러가 나거나, 7단계 숫자가 0이 아닙니다**

동기화 로그에 이유가 남습니다:

```sh
source /Users/Shared/srv/.bay-web-cicd/backend.env
curl -s -H "x-sync-key: $SYNC_KEY" localhost:4001/v1/sync/runs | head -40
```

여기 나온 경고 문구를 그대로 개발자에게 전달해주시면 됩니다. 자주 나오는
것들:

- **`storage not configured — image URLs will expire`** → 4단계 값이 제대로
  안 들어갔습니다. `backend.env`의 `S3_BUCKET` / `S3_ACCESS_KEY_ID` /
  `S3_SECRET_ACCESS_KEY` / `S3_PUBLIC_URL` 네 개가 **모두** 채워져야 하고,
  하나라도 비면 통째로 건너뜁니다. 값을 고쳤으면 5단계(재시작)를 다시
  해주세요.
- **`image re-host failed`** → R2에 올리다 실패했습니다. 뒤에 붙은 괄호 안
  문구를 전달해주세요. 특히 `x-amz-checksum`이 보이면 코드 한 줄 수정이
  필요한 알려진 사례입니다.
- **`unsupported block type`** → 이번 건과 무관한 별개의 안내입니다.
  무시하셔도 됩니다.

**Q. 사진이 여전히 안 보입니다**

`img.blockchainatyonsei.com` 연결이 아직 `Active`가 아닐 수 있습니다. 3단계 화면에서
상태를 확인하고, 브라우저에서 직접 열어보세요:

```sh
curl -s -o /dev/null -w "%{http_code}\n" https://img.blockchainatyonsei.com
```

**Q. 되돌리고 싶습니다**

`backend.env`의 `S3_` 줄 6개를 다시 비우고 `docker restart bay-backend` 하면
설정 전 상태로 돌아갑니다. R2에 올라간 파일은 그대로 남아 있어서, 값을 다시
넣으면 그대로 다시 쓰입니다.

---

## 참고: 앞으로는

한 번 설정해두면 이후에는 신경 쓸 게 없습니다. 새로 올라오는 뉴스의 사진은
동기화(10분마다)가 알아서 R2로 복사합니다. 이 문서는 최초 1회용입니다.
