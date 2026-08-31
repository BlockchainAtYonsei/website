import Hero from "@/components/hero";
import ApplyTrigger from "@/components/apply-modal";
import BlurText from "@/components/blur-text";
import HistoryTimeline from "@/components/history-timeline";
import Mission from "@/components/mission";
// import Partners from "@/components/partners";
import Pillars from "@/components/pillars";
import ScrollPager from "@/components/scroll-pager";
import SiteFooter from "@/components/site-footer";

export default function Home() {
  return (
    <main>
      {/* Pointer-device pager: one wheel flick advances exactly one panel.
          Touch and keyboard keep the CSS scroll-snap underneath. */}
      <ScrollPager />

      <Hero />

      {/* Mission — bilingual, so it lives in a client component that reads the
          language switch (this page is server-rendered and cannot) */}
      <Mission />

      {/* Capabilities — the two cards and their team dialogs */}
      <Pillars />

      {/* History — pinned; vertical scroll drives the horizontal track. Reads
          its own bilingual data via the language switch. */}
      <HistoryTimeline />

      {/* Partners — held back on purpose. Some of the organizations listed
          are not formal partnerships, and the section shows their logos, so
          it stays off the page until the roster is confirmed. The component
          and its logo files are intact; drop the comment to bring it back. */}
      {/* <Partners /> */}

      {/* Last screen — the CTA and the footer share one full-viewport snap
          panel: the CTA grows to fill and centers, the footer rides the bottom
          edge, so landing here shows both without a further scroll. */}
      <div className="snap-panel flex min-h-svh flex-col">
        <section
          id="apply"
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-ink py-24"
        >
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(47,107,255,0.55), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <BlurText
              text="Be the next BAY"
              className="font-heading text-5xl tracking-[-2px] text-white md:text-7xl"
            />
            {/* label omitted on purpose — the trigger reads the language switch,
                which this server-rendered page cannot */}
            <ApplyTrigger className="liquid-glass-strong font-body mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]" />
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
