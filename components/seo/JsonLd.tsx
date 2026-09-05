/**
 * Renders a JSON-LD graph into the document.
 *
 * A server component with no client bundle cost: the markup is in the SSR HTML,
 * which is the point — several AI fetchers and every social scraper read the
 * first response without executing JavaScript, so structured data injected
 * after hydration is structured data they never see.
 *
 * `<` is escaped to its unicode form before the string reaches the DOM. Without
 * that, any value containing "</script>" would close the tag early and inject
 * markup into the page. Nothing user-supplied flows in here today, but article
 * frontmatter and glossary terms will, and the escape costs nothing.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // The content is serialised JSON, not markup — this is the documented
      // way to emit JSON-LD in React and the escape above closes the one hole.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
