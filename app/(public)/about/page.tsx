import AboutClient from "@/components/about/AboutClient";
import JsonLd from "@/components/seo/JsonLd";
import { aboutPageNode } from "@/lib/seo/schema";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why IMPRINT Exists",
  description:
    "The philosophy behind IMPRINT, and a first-person account of why it was built. Echo Drift, the two beliefs the product rests on, and what it deliberately is not.",
  // Self-referencing canonical. The ?notrack=1 opt-out can be appended to any
  // URL on the site, so without this every page has a duplicate variant.
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      {/* AboutPage, authored by the Person and about the product. This is the
          page carrying the origin account in Suman's own voice, so it is the
          natural anchor for the authorship claim — the site graph in the public
          layout supplies the Person and Organization nodes it references. */}
      <JsonLd data={{ "@context": "https://schema.org", ...aboutPageNode() }} />
      <AboutClient />
    </>
  );
}
