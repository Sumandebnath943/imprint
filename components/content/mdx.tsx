import Link from "next/link";
import type { MDXComponents } from "mdx/types";

/**
 * How MDX elements map onto the site's typography.
 *
 * MDX gives you bare HTML tags, and the site has no global prose styles — the
 * written pages set their own type. Mapping every element here keeps an article
 * looking like /methodology rather than like an unstyled document, and keeps
 * the heading levels honest: the page supplies the h1, so `#` in an article
 * becomes an h2 and everything shifts down one.
 *
 * Headings carry ids so an assistant can deep-link to the section it quoted,
 * and so the answer-first sections are individually addressable.
 */

function slugify(children: React.ReactNode): string {
  return String(children)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const text = { color: "rgba(255,255,255,0.72)", fontSize: 17, lineHeight: 1.8 };

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h2
      id={slugify(children)}
      className="text-white font-semibold mt-14 mb-4 scroll-mt-28"
      style={{ fontSize: "clamp(24px,2.6vw,30px)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
    >
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2
      id={slugify(children)}
      className="text-white font-semibold mt-14 mb-4 scroll-mt-28"
      style={{ fontSize: "clamp(24px,2.6vw,30px)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={slugify(children)}
      className="text-white font-semibold mt-10 mb-3 scroll-mt-28"
      style={{ fontSize: 19, letterSpacing: "-0.01em" }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-5" style={text}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-5 pl-5 space-y-2" style={{ ...text, listStyle: "disc" }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 pl-5 space-y-2" style={{ ...text, listStyle: "decimal" }}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li style={{ paddingLeft: 4 }}>{children}</li>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  blockquote: ({ children }) => (
    <blockquote
      className="my-6 pl-5"
      style={{
        borderLeft: "3px solid #FF5500",
        color: "rgba(255,255,255,0.82)",
        fontSize: 18,
        lineHeight: 1.7,
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10" style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.10)" }} />,
  code: ({ children }) => (
    <code
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 4,
        padding: "1px 5px",
        fontSize: "0.88em",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre
      className="rounded-xl p-5 overflow-x-auto my-6"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.78)",
        fontSize: 13.5,
        lineHeight: 1.7,
      }}
    >
      {children}
    </pre>
  ),
  // Internal links go through next/link for client-side navigation; external
  // ones open in a new tab and carry rel, so an article can cite a paper
  // without handing it referrer data or losing the reader's place.
  a: ({ href, children }) => {
    const url = String(href ?? "");
    const external = url.startsWith("http");
    const style = { color: "#FF5500" };
    const className = "hover:underline underline-offset-2";

    if (external) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={className} style={style}>
          {children}
        </a>
      );
    }
    return (
      <Link href={url} className={className} style={style}>
        {children}
      </Link>
    );
  },
};
