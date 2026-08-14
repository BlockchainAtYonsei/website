import type { ReactNode } from "react";
import { headingId, type Block } from "@/lib/research";

/* Minimal inline markup so authors can emphasise without HTML: **bold**,
   `code`, [label](href). Parsed into React nodes — never dangerouslySetInnerHTML,
   so pasted content can't inject markup. */
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="font-mono rounded bg-white/8 px-1.5 py-0.5 text-[0.85em] text-bay-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const external = /^https?:\/\//.test(link[2]);
      return (
        <a
          key={i}
          href={link[2]}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="text-bay-300 underline decoration-bay-300/30 underline-offset-4 transition-colors hover:decoration-bay-300"
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

const P = "font-body text-[0.975rem] leading-[1.85] font-light break-keep text-slate-300 md:text-base";

function Bullet() {
  return (
    <span className="mt-[0.72em] h-1 w-1 shrink-0 rounded-full bg-bay-400 shadow-[0_0_8px_rgba(95,139,255,0.8)]" />
  );
}

export default function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="max-w-[68ch]">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2":
            return (
              <h2
                key={i}
                id={headingId(b.text, i)}
                className="font-heading mt-16 mb-5 scroll-mt-28 text-3xl leading-[1.15] tracking-[-1px] break-keep text-white md:text-4xl"
              >
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                id={headingId(b.text, i)}
                className="font-body mt-10 mb-3 scroll-mt-28 text-lg font-medium break-keep text-white"
              >
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className={`${P} mt-6`}>
                {inline(b.text)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="mt-6 space-y-3">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3.5">
                    <Bullet />
                    <span className={P}>{inline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="mt-6 space-y-3">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3.5">
                    <span className="font-mono mt-[0.35em] w-4 shrink-0 text-xs text-bay-300/80">
                      {j + 1}
                    </span>
                    <span className={P}>{inline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="my-12 border-l-2 border-bay-400/60 pl-6 md:pl-8"
              >
                <p className="font-heading text-2xl leading-[1.35] tracking-[-0.5px] break-keep text-white md:text-3xl">
                  {b.text}
                </p>
                {b.cite && (
                  <cite className="font-mono mt-4 block text-[10px] tracking-[0.18em] text-bay-300/70 uppercase not-italic">
                    {b.cite}
                  </cite>
                )}
              </blockquote>
            );
          case "callout":
            return (
              <aside
                key={i}
                className="liquid-glass my-10 rounded-[1.25rem] px-6 py-6 md:px-7"
              >
                {b.title && (
                  <p className="font-mono mb-2.5 text-[10px] tracking-[0.18em] text-bay-300 uppercase">
                    {b.title}
                  </p>
                )}
                <p className="font-body leading-relaxed font-light break-keep text-white/90">
                  {inline(b.text)}
                </p>
              </aside>
            );
          case "table":
            return (
              <div
                key={i}
                className="my-10 overflow-x-auto rounded-[1rem] border border-white/10"
              >
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th
                          key={j}
                          scope="col"
                          className="font-mono border-b border-white/10 bg-white/[0.03] px-5 py-3.5 text-[10px] font-normal tracking-[0.18em] whitespace-nowrap text-bay-300/80 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j} className="border-b border-white/6 last:border-0">
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className={`font-body px-5 py-3.5 align-top text-sm leading-relaxed font-light break-keep ${
                              k === 0 ? "text-white/90" : "text-slate-400"
                            }`}
                          >
                            {inline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "image":
            /* plain <img>, like the avatars — the sources are our own R2/S3
               copies (or Notion URLs in local dev), so next/image's remote
               domain allow-list would only add configuration to keep in sync */
            return (
              <figure key={i} className="my-10">
                <img
                  src={b.url}
                  alt={b.caption ?? ""}
                  loading="lazy"
                  className="w-full rounded-[1.25rem] border border-white/8"
                />
                {b.caption && (
                  <figcaption className="font-body mt-3 text-center text-xs font-light break-keep text-slate-500">
                    {b.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "divider":
            return (
              <hr
                key={i}
                className="my-14 border-0 border-t border-white/10"
              />
            );
        }
      })}
    </div>
  );
}
