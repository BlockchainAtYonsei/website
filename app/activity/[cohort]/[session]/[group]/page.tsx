import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/research/article-body";
import {
  ACTIVITY_COHORT,
  allReports,
  getReport,
} from "@/lib/activities";

/* Dedicated reading view for a group's project report. The drill-down modal on
   the home page links here; the data is local (lib/activities), so this route
   prerenders without the backend. */

type Params = { cohort: string; session: string; group: string };

/* One entry per report that exists. Cohort/session/group arrive as strings. */
export function generateStaticParams(): Params[] {
  return allReports().map((r) => ({
    cohort: ACTIVITY_COHORT,
    session: String(r.session),
    group: String(r.group),
  }));
}

function resolve(params: Params) {
  const session = Number(params.session);
  const group = Number(params.group);
  if (params.cohort !== ACTIVITY_COHORT || !Number.isInteger(session) || !Number.isInteger(group)) {
    return null;
  }
  return getReport(session, group);
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const report = resolve(params);
  if (!report) return {};
  const title = `${report.project} · 정규세션 ${report.session}차 ${report.group}조 · BAY`;
  return {
    title,
    openGraph: { title, type: "article", locale: "ko_KR" },
  };
}

export default async function ActivityReportPage(props: {
  params: Promise<Params>;
}) {
  const params = await props.params;
  const report = resolve(params);
  if (!report) notFound();

  const trail = `${ACTIVITY_COHORT} · 정규세션 ${report.session}차 · ${report.group}조`;

  return (
    <main>
      <article>
        <header className="mx-auto max-w-3xl px-6 pt-14 md:pt-20">
          <Link
            href="/#activities"
            className="font-mono inline-flex items-center gap-2 text-[10px] tracking-[0.18em] text-white/45 uppercase transition-colors hover:text-bay-300"
          >
            <span aria-hidden>←</span> Team Activity
          </Link>

          <p className="font-mono mt-8 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
            {trail}
          </p>

          <h1 className="font-heading mt-5 text-4xl leading-[1.1] tracking-[-2px] break-keep text-white md:text-6xl">
            {report.project}
          </h1>
        </header>

        <div className="mx-auto max-w-3xl px-6 pt-6 pb-24 md:pb-32">
          <ArticleBody blocks={report.body} />
        </div>
      </article>
    </main>
  );
}
