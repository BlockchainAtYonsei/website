/* The member roster — owned by this database, no Notion counterpart.

   npm run seed:members   (idempotent — upserts by slug, touches nothing else)

   This is the single source for people on the site: the /organization chart
   and the research author pages both read these rows through the API, so a
   new social link or a semester turnover is an edit here and a re-run —
   nowhere else. The source sheet also carries phone numbers, emails, student
   ids and majors; none of that belongs on a public page, so none of it
   belongs here.

   `name` is load-bearing. The news/articles sync matches Notion's Author
   column against it, ignoring whitespace, so a member whose name is spelled
   differently here than in Notion syncs with an empty byline and a warning.

   Slugs are /research/author/<slug> addresses for anyone who publishes —
   never change one after it ships. Link hygiene: https:// on everything,
   share URLs stripped of their utm/s= tracking tails, handles expanded to
   full profile URLs. */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

try {
  process.loadEnvFile();
} catch {
  /* env comes from the shell */
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type Seed = {
  slug: string;
  name: string;
  cohort: number;
  team: string; // "" for the exec tier
  position: string; // 학회장 / 부학회장 / 부장 / 팀장 / 부원
  bio?: string;
  // Profile photo — an external URL (github.com/u/... etc.), or "/members/
  // <slug>.jpg" for a file committed to the frontend's public/members/ (no
  // S3/R2 is configured, so that's where a handed-over photo file goes — see
  // public/members/README.md). The 리서치팀 batch landed 2026-08-15, all 11 of
  // them; the other teams are still on the monogram fallback.
  avatarUrl?: string;
  socials?: { label: string; href: string }[];
};

const EXEC: Seed[] = [
  {
    slug: "yemo-koo",
    name: "구예모",
    cohort: 16,
    team: "",
    position: "학회장",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/yemo-koo-407a02352" },
      { label: "Telegram", href: "https://t.me/yemokooo" },
      { label: "X", href: "https://x.com/yemokoo2001" },
    ],
  },
  {
    slug: "jaegeun-lee",
    name: "이재근",
    cohort: 16,
    team: "",
    position: "부학회장",
    socials: [
      { label: "GitHub", href: "https://github.com/leejk206" },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/%EC%9E%AC%EA%B7%BC-%EC%9D%B4-3bb176406",
      },
      { label: "Telegram", href: "https://t.me/leejk206" },
      { label: "X", href: "https://x.com/JkLee25731" },
    ],
  },
];

const STAFF: Seed[] = [
  {
    slug: "sanghyeon-kwon",
    name: "권상현",
    cohort: 17,
    team: "홍보팀",
    position: "부장",
    bio: "ZK 기술로 블록체인 생태계를 해결해 나가는 그림을 그립니다.",
    /* GitHub 프사 — u/<id> is stable even if the handle changes */
    avatarUrl: "https://avatars.githubusercontent.com/u/174609772?v=4",
    socials: [
      { label: "GitHub", href: "https://github.com/0xSHKWON" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/sanghyeon-kwon-31623438a" },
      { label: "Telegram", href: "https://t.me/perfect_attendance" },
      { label: "X", href: "https://x.com/httpskshcokr" },
      { label: "Medium", href: "https://medium.com/@kwonsanghyeon3245" },
      { label: "Website", href: "https://shkwon.com" },
    ],
  },
  {
    slug: "juho-lee",
    name: "이주호",
    cohort: 17,
    team: "온보딩팀",
    position: "팀장",
    socials: [
      { label: "GitHub", href: "https://github.com/lejuho" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/juho-lee-a85a40263" },
      { label: "Telegram", href: "https://t.me/givmetwo" },
      { label: "X", href: "https://x.com/juholee__" },
    ],
  },
];

const DEV: Seed[] = [
  {
    slug: "hojae-lee",
    name: "이호재",
    cohort: 17,
    team: "개발팀",
    position: "팀장",
    socials: [
      { label: "GitHub", href: "https://github.com/ghwo336" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/hojae-lee-99400a368" },
      { label: "Telegram", href: "https://t.me/ghwo336" },
      { label: "X", href: "https://x.com/ihojae212644" },
      { label: "Website", href: "https://pelicanlab.dev" },
    ],
  },
  {
    slug: "dongin-kang",
    name: "강동인",
    cohort: 17,
    team: "개발팀",
    position: "부원",
    socials: [{ label: "Website", href: "https://lobyi.github.io/" }],
  },
  { slug: "dahyun-kim", name: "김다현", cohort: 17, team: "개발팀", position: "부원" },
  { slug: "minji-kim", name: "김민지", cohort: 17, team: "개발팀", position: "부원" },
  { slug: "minju-ryu", name: "류민주", cohort: 17, team: "개발팀", position: "부원" },
  { slug: "hunil-park", name: "박훈일", cohort: 17, team: "개발팀", position: "부원" },
  { slug: "wooheon-baek", name: "백우헌", cohort: 17, team: "개발팀", position: "부원" },
  { slug: "minseop-yoon", name: "윤민섭", cohort: 17, team: "개발팀", position: "부원" },
  {
    slug: "yeonuk-jeong",
    name: "정연욱",
    cohort: 17,
    team: "개발팀",
    position: "부원",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/cyunwook" },
      { label: "GitHub", href: "https://github.com/cyunwook" },
      { label: "Telegram", href: "https://t.me/cyunwook11" },
      { label: "X", href: "https://x.com/cyunwoook" },
    ],
  },
  { slug: "yunho-jeong", name: "정윤호", cohort: 17, team: "개발팀", position: "부원" },
  {
    slug: "seokhoon-choi",
    name: "최석훈",
    cohort: 17,
    team: "개발팀",
    position: "부원",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/seokhoon-choi-4a90b1372" },
      { label: "GitHub", href: "https://github.com/Sskskxi" },
    ],
  },
  {
    slug: "dongyun-kwak",
    name: "곽동윤",
    cohort: 18,
    team: "개발팀",
    position: "부원",
    socials: [
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/%EB%8F%99%EC%9C%A4-%EA%B3%BD-440592429",
      },
      { label: "GitHub", href: "https://github.com/DongYun22" },
      { label: "Telegram", href: "https://t.me/DongYunKwak22" },
      { label: "X", href: "https://x.com/syooonnnnn5" },
    ],
  },
  {
    slug: "geonu-kim",
    name: "김건우",
    cohort: 18,
    team: "개발팀",
    position: "부원",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/geonu-kim-a18ab8372/" },
      { label: "GitHub", href: "https://github.com/3DUCK" },
      { label: "Telegram", href: "https://t.me/Geonu_Kim" },
      { label: "Medium", href: "https://medium.com/@kermit7520k" },
      { label: "X", href: "https://x.com/GimGeonU95171" },
    ],
  },
  { slug: "jeongwoo-ahn", name: "안정우", cohort: 18, team: "개발팀", position: "부원" },
  { slug: "taeyeon-yoo", name: "유태연", cohort: 18, team: "개발팀", position: "부원" },
  {
    slug: "chaeyoung-lee",
    name: "이채영",
    cohort: 18,
    team: "개발팀",
    position: "부원",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/chaeyoung-lee-3b79b4407" },
      { label: "Telegram", href: "https://t.me/chae0x" },
      { label: "Website", href: "https://chae0x.com" },
      { label: "X", href: "https://x.com/chae0x" },
    ],
  },
  { slug: "yeongho-jeon", name: "전영호", cohort: 18, team: "개발팀", position: "부원" },
  {
    slug: "yeonhan-jeong",
    name: "정연한",
    cohort: 18,
    team: "개발팀",
    position: "부원",
    socials: [
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/%EC%97%B0%ED%95%9C-%EC%A0%95-a17b07175/",
      },
      { label: "GitHub", href: "https://github.com/yt4307" },
      { label: "Telegram", href: "https://t.me/yn_siny" },
      { label: "X", href: "https://x.com/yt4307" },
    ],
  },
  {
    slug: "seungwon-choi",
    name: "최승원",
    cohort: 18,
    team: "개발팀",
    position: "부원",
    socials: [{ label: "GitHub", href: "https://github.com/Seungwon326" }],
  },
  {
    slug: "jaemin-choi",
    name: "최재민",
    cohort: 17,
    team: "개발팀",
    position: "부원",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jaesimin0903/" },
      { label: "GitHub", href: "https://github.com/jaesimin0903" },
      { label: "Telegram", href: "https://t.me/jaesimin0903" },
      { label: "Website", href: "https://jaesimin.xyz" },
    ],
  },
  {
    slug: "junu-choi",
    name: "최준우",
    cohort: 18,
    team: "개발팀",
    position: "부원",
    socials: [
      /* 학번이 곧 깃허브 아이디 — 시트의 숫자는 오기가 아니었다 */
      { label: "GitHub", href: "https://github.com/2022148030" },
      { label: "Telegram", href: "https://t.me/choi_junu" },
      { label: "X", href: "https://x.com/ea8e1b1f099b4f5" },
    ],
  },
  {
    slug: "hyunsu-choi",
    name: "최현수",
    cohort: 18,
    team: "개발팀",
    position: "부원",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/hyunsu-choi-3b5648276/" },
      { label: "GitHub", href: "https://github.com/sdh2222" },
      { label: "Telegram", href: "https://t.me/sdh2222" },
      { label: "X", href: "https://x.com/henryfromseoul" },
    ],
  },
];

const RESEARCH: Seed[] = [
  {
    slug: "yerim-bae",
    name: "배예림",
    cohort: 17,
    team: "리서치팀",
    position: "팀장",
    bio: "RWA와 스테이블코인을 중심으로 전통금융이 온체인으로 확장되는 흐름을 살펴보고 있습니다.",
    avatarUrl: "/members/yerim-bae.webp",
    socials: [
      { label: "GitHub", href: "https://github.com/yerim-Bae" },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/%EC%98%88%EB%A6%BC-%EB%B0%B0-6120b2288/",
      },
      { label: "Telegram", href: "https://t.me/DeFi_Auditor" },
      { label: "Medium", href: "https://medium.com/@yelim8694" },
      { label: "Website", href: "https://yerim-accounting.vercel.app/" },
    ],
  },
  {
    slug: "jehee-noh",
    name: "노제희",
    cohort: 17,
    team: "리서치팀",
    position: "부원",
    bio: "RWA·스테이블코인·재보험",
    avatarUrl: "/members/jehee-noh.webp",
  },
  {
    slug: "jaehwan-lee",
    name: "이재환",
    cohort: 17,
    team: "리서치팀",
    position: "부원",
    bio: "블록체인을 통한 RWA시장의 변화를 주시하고 있습니다.",
    avatarUrl: "/members/jaehwan-lee.webp",
    socials: [
      { label: "Telegram", href: "https://t.me/delpa818" },
      { label: "X", href: "https://x.com/delpa818" },
    ],
  },
  {
    slug: "jaeseo-kim",
    name: "김재서",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    bio: "데이터와 리서치를 기반으로 Web3의 새로운 가능성을 탐구합니다",
    avatarUrl: "/members/jaeseo-kim.webp",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/ethan-kim-806b90374" },
      { label: "Telegram", href: "https://t.me/ethankim02" },
    ],
  },
  {
    slug: "uihyeok-park",
    name: "박의혁",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    bio: "전통금융의 눈으로 온체인 생태계를 쉽게 전달합니다.",
    avatarUrl: "/members/uihyeok-park.webp",
    socials: [{ label: "Telegram", href: "https://t.me/insiapark" }],
  },
  {
    slug: "younghwan-shin",
    name: "신영환",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    bio: "블록체인 거래 내의 Programmable UX 과 AI Agent 의 역할을 파고듭니다.",
    avatarUrl: "/members/younghwan-shin.webp",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/yeonghwan-shin/" },
      { label: "Telegram", href: "https://t.me/yhshinsimon" },
      { label: "Website", href: "https://yhshinsimon.com/" },
    ],
  },
  {
    slug: "seongjae-lee",
    name: "이성재",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    bio: "블록체인이 만들어갈 변화와 가능성을 꾸준히 기록합니다",
    avatarUrl: "/members/seongjae-lee.webp",
    socials: [
      { label: "GitHub", href: "https://github.com/sungjae0309" },
      { label: "Telegram", href: "https://t.me/sungjae0309" },
      { label: "Website", href: "https://sungjae0309.tistory.com/" },
    ],
  },
  {
    slug: "chaeyun-lim",
    name: "임채윤",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    bio: "온체인 데이터와 마켓 메이커의 자금 흐름을 추적하며, 가상자산 제도권 편입 시나리오를 파고듭니다.",
    avatarUrl: "/members/chaeyun-lim.webp",
    socials: [{ label: "Telegram", href: "https://t.me/limchaeyooon" }],
  },
  {
    slug: "donghyun-jang",
    name: "장동현",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    bio: "웹2,3 취약점 및 스마트컨트랙트 보안을 파고듭니다.",
    avatarUrl: "/members/donghyun-jang.webp",
    socials: [
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/%EB%8F%99%ED%98%84-%EC%9E%A5-5ab69a3a5",
      },
      { label: "GitHub", href: "https://github.com/hyeon-Sec" },
      { label: "Telegram", href: "https://t.me/SamsungSemiconductor" },
      { label: "X", href: "https://x.com/D_D0ng77" },
    ],
  },
  {
    slug: "yunseon-jang",
    name: "장윤선",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    bio: "프로젝트의 비즈니스 모델과 기관의 움직임으로 블록체인 시장을 바라봅니다.",
    avatarUrl: "/members/yunseon-jang.webp",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/yoonsun-jang-990705276" },
      { label: "Medium", href: "https://medium.com/@yoonsunjang1250" },
    ],
  },
  {
    slug: "hyunchae-cho",
    name: "조현채",
    cohort: 18,
    team: "리서치팀",
    position: "부원",
    /* 붙여쓴 게 맞다 — 본인이 그렇게 쓴 문체이니 띄어쓰기를 넣지 말 것 */
    bio: "안녕하세요조현채입니다잘부탁드립니다",
    avatarUrl: "/members/hyunchae-cho.webp",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/hyunchae-jo" },
      { label: "Telegram", href: "https://t.me/catalyze_juno" },
      { label: "X", href: "https://x.com/trip4e_J" },
    ],
  },
];

const ROSTER = [...EXEC, ...STAFF, ...DEV, ...RESEARCH];

async function main() {
  for (const m of ROSTER) {
    const row = {
      name: m.name,
      cohort: m.cohort,
      team: m.team,
      position: m.position,
      bio: m.bio ?? "",
      avatarUrl: m.avatarUrl ?? null,
      socials: m.socials ?? [],
      status: "active" as const,
      visible: true,
    };
    await prisma.member.upsert({
      where: { slug: m.slug },
      create: { slug: m.slug, ...row },
      update: row,
    });
  }

  const all = await prisma.member.findMany({
    select: { name: true, team: true, position: true, socials: true },
    orderBy: [{ team: "asc" }, { name: "asc" }],
  });
  const withLinks = all.filter((m) => (m.socials as unknown[]).length > 0).length;
  console.log(`멤버 ${all.length}명 (링크 보유 ${withLinks}명)`);
  for (const team of [...new Set(all.map((m) => m.team))]) {
    const names = all.filter((m) => m.team === team).map((m) => m.name);
    console.log(`  ${team || "운영진"} (${names.length}): ${names.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
