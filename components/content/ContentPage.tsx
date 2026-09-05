import Link from "next/link";
import Breadcrumbs, { type Crumb } from "@/components/seo/Breadcrumbs";
import { PERSON_NAME, PERSON_URL, PERSON_ROLE_HERE } from "@/lib/seo/entity";

/**
 * Shared layout for the written pages — methodology, FAQ, glossary, contact.
 *
 * Server components, deliberately. The landing page is client-rendered for its
 * motion, but nothing here animates, and these are the pages built to be read
 * by extractors: no hydration step between the crawler and the content.
 *
 * Measurements match the privacy and terms pages (880px column, the same
 * eyebrow/h1/lede stack) so the written side of the site reads as one thing.
 */

export function PageShell({
  eyebrow,
  title,
  lede,
  byline = false,
  updated,
  breadcrumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  /** Show the author line. On pages making technical claims, attribution is
   *  the difference between a statement and a citable one. */
  byline?: boolean;
  updated?: string;
  /** Rendered above the title. Taken as a prop rather than passed through
   *  `children` so the trail cannot end up below the heading it describes. */
  breadcrumbs?: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[880px] mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-24">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <p
        className="uppercase tracking-widest font-medium mb-4"
        style={{ fontSize: 12, letterSpacing: "0.22em", color: "#FF5500" }}
      >
        {eyebrow}
      </p>
      <h1
        className="text-white font-bold mb-5"
        style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1.08, letterSpacing: "-0.03em" }}
      >
        {title}
      </h1>
      {lede ? (
        <p
          className="mb-8"
          style={{ color: "rgba(255,255,255,0.68)", fontSize: 19, lineHeight: 1.65, maxWidth: 680 }}
        >
          {lede}
        </p>
      ) : null}

      {byline ? <Byline updated={updated} /> : null}

      <div className="space-y-14 mt-12">{children}</div>
    </div>
  );
}

/**
 * Author attribution.
 *
 * Visible because a claim with a named author behind it is quotable and an
 * anonymous one is not — this is the whole reason there is no founder page.
 * The link is rel="author me" so the relationship is machine-readable as well
 * as legible, and points at the same URL as the Person node's `url`.
 */
export function Byline({ updated }: { updated?: string }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-4"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.10)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        fontSize: 14,
        color: "rgba(255,255,255,0.55)",
      }}
    >
      <span>
        Written by{" "}
        <a
          href={PERSON_URL}
          rel="author me noopener"
          target="_blank"
          className="text-white hover:underline underline-offset-2"
        >
          {PERSON_NAME}
        </a>
        , {PERSON_ROLE_HERE.toLowerCase()} of IMPRINT
      </span>
      {updated ? (
        <>
          <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.25)" }}>
            ·
          </span>
          <span>Last updated {updated}</span>
        </>
      ) : null}
    </div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2
        className="text-white font-semibold mb-4"
        style={{ fontSize: "clamp(22px,2.4vw,28px)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <div
        className="space-y-4"
        style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 1.75 }}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * A question and its answer.
 *
 * The heading is the question verbatim, and the first paragraph is written to
 * stand alone at roughly 40–55 words — a snippet engine lifts that paragraph
 * and shows it with nothing around it, so an answer that leans on the sentence
 * before it cannot be used. Anything further goes in `children`.
 */
export function QA({
  id,
  question,
  answer,
  children,
}: {
  id: string;
  question: string;
  answer: string;
  children?: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28 py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
      <h3 className="text-white font-semibold mb-3" style={{ fontSize: 19, letterSpacing: "-0.01em" }}>
        {question}
      </h3>
      <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 1.75 }}>{answer}</p>
      {children ? (
        <div
          className="space-y-3 mt-3"
          style={{ color: "rgba(255,255,255,0.62)", fontSize: 15, lineHeight: 1.7 }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Highlighted aside, in the brand orange wash used on the privacy page. */
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 my-2"
      style={{ background: "rgba(255,85,0,0.07)", border: "1px solid rgba(255,85,0,0.22)" }}
    >
      <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

/** Monospaced formula block. The arithmetic is the point of /methodology, so
 *  it is set as code rather than described in prose. */
export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="rounded-xl p-5 overflow-x-auto my-2"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.78)",
        fontSize: 13.5,
        lineHeight: 1.7,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }}
    >
      <code>{children}</code>
    </pre>
  );
}

export function Row({ what, why }: { what: string; why: React.ReactNode }) {
  return (
    <div
      className="grid gap-2 md:grid-cols-[minmax(0,240px)_1fr] py-3.5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
    >
      <div className="text-white font-medium" style={{ fontSize: 15 }}>
        {what}
      </div>
      <div style={{ color: "rgba(255,255,255,0.66)", fontSize: 15, lineHeight: 1.65 }}>{why}</div>
    </div>
  );
}

export function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  const className = "hover:underline underline-offset-2";
  const style = { color: "#FF5500" };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
