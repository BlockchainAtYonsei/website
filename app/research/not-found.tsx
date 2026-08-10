import Link from "next/link";

export default function ResearchNotFound() {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-6xl flex-col justify-center px-6 py-24">
      <p className="font-mono mb-6 text-[10px] tracking-[0.18em] text-bay-300/70 uppercase">
        404
      </p>
      <h1 className="font-heading text-4xl tracking-[-1px] break-keep text-white italic md:text-5xl">
        찾는 글이 없습니다.
      </h1>
      <p className="font-body mt-5 max-w-md leading-relaxed font-light break-keep text-slate-400">
        주소가 바뀌었거나 아직 발행되지 않은 글일 수 있습니다.
      </p>
      <Link
        href="/research"
        className="liquid-glass-strong font-body mt-9 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
      >
        전체 리서치 보기
      </Link>
    </main>
  );
}
