import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";
import {
  PERSON_ID,
  PERSON_NAME,
  PERSON_URL,
  PERSON_ROLE_HERE,
  PERSON_SAME_AS,
  ORG_ID,
  ORG_NAME,
  ORG_URL,
  ORG_LOGO,
  ORG_SAME_AS,
  CONTACT_EMAIL,
} from "./entity";

/**
 * JSON-LD node builders.
 *
 * Everything is emitted as a single `@graph` rather than several loose
 * <script> tags. Inside one graph, nodes cross-reference each other by `@id`
 * and a parser can reconstruct the relationships exactly; split across separate
 * scripts it has to infer which nodes belong together, and usually doesn't.
 */

/** IMPRINT's own node ids. These are minted here because they describe this
 *  site — unlike PERSON_ID and ORG_ID, which are borrowed from elsewhere. */
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;

type Node = Record<string, unknown>;

/**
 * The Person, referenced by the portfolio's `@id`.
 *
 * Deliberately a stub: name, url, sameAs and the relationships that only
 * IMPRINT can assert. Biography, credentials, education and skills all live on
 * the portfolio's fuller node and are not restated here — restating them
 * invites the two copies to drift, and a shorter node under a matching `@id`
 * merges cleanly with the longer one.
 */
export function personNode(): Node {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: PERSON_NAME,
    url: PERSON_URL,
    sameAs: [...PERSON_SAME_AS],
    worksFor: { "@id": ORG_ID },
  };
}

/** House of Namus, referenced by the root domain's `@id`. IMPRINT's publisher. */
export function organizationNode(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: ORG_NAME,
    url: ORG_URL,
    logo: ORG_LOGO,
    sameAs: ORG_SAME_AS,
    founder: { "@id": PERSON_ID },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "IMPRINT product enquiries",
      email: CONTACT_EMAIL,
      availableLanguage: ["English"],
    },
  };
}

export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
    author: { "@id": PERSON_ID },
    about: { "@id": SOFTWARE_ID },
    // No `potentialAction`/SearchAction: IMPRINT has no site search, and
    // declaring one that doesn't exist is a claim the site can't support.
  };
}

/**
 * The product itself.
 *
 * `applicationCategory` is LifestyleApplication rather than HealthApplication.
 * IMPRINT measures distance from a self-captured baseline; it does not screen,
 * diagnose or treat anything. Claiming a health category would pull the whole
 * domain toward the "Your Money or Your Life" quality bar for no gain in how
 * the product is understood.
 *
 * The zero-price `offers` block is load-bearing, not filler: it is the field an
 * assistant reads when asked whether IMPRINT is free. Without it, a paid
 * product is the safer assumption and the likelier answer.
 *
 * No `aggregateRating` and no `review`. The landing-page quotes are labelled
 * pre-launch impressions, so review markup over them would assert to search
 * engines something the page itself does not claim.
 */
export function softwareNode(): Node {
  return {
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: SITE_NAME,
    alternateName: "IMPRINT — Identity Preservation Engine",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web browser",
    inLanguage: "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    creator: { "@id": PERSON_ID },
    publisher: { "@id": ORG_ID },
    author: { "@id": PERSON_ID },
    isAccessibleForFree: true,
    featureList: [
      "Cognitive baseline capture",
      "Drift Score measurement",
      "Recurring calibration",
      "Skill Vault tracking",
      "Socratic reflection (The Mirror)",
      "Distraction-free composition (The Forge)",
    ],
    // Named here so the coined vocabulary has somewhere machine-readable to
    // live before the glossary pages exist.
    keywords: [
      "Echo Drift",
      "Drift Score",
      "cognitive baseline",
      "cognitive offloading",
      "AI dependence",
      "skill atrophy",
    ].join(", "),
  };
}

/**
 * The full site graph.
 *
 * Order matters only for readability — resolution is by `@id`. The Person node
 * is included on every public page rather than on /about alone so that any page
 * an assistant happens to fetch carries the attribution with it; chunks are
 * retrieved individually, and one that arrives without its author is one that
 * cannot be attributed.
 */
export function siteGraph(extra: Node[] = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      websiteNode(),
      softwareNode(),
      organizationNode(),
      personNode(),
      ...extra,
    ],
  };
}

/** Breadcrumb trail. `items` is ordered root-first and excludes the page itself
 *  only when that page is the root. */
export function breadcrumbNode(items: { name: string; path: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${items[items.length - 1]?.path ?? "/"}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * An `AboutPage` whose primary subject is the product, authored by the Person.
 * Used on /about, where the founder attribution belongs.
 */
export function aboutPageNode(): Node {
  return {
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#aboutpage`,
    url: `${SITE_URL}/about`,
    name: `Why ${SITE_NAME} Exists`,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": SOFTWARE_ID },
    author: { "@id": PERSON_ID },
    publisher: { "@id": ORG_ID },
    about: [{ "@id": SOFTWARE_ID }, { "@id": PERSON_ID }],
  };
}

export { PERSON_ID, ORG_ID, PERSON_NAME, PERSON_ROLE_HERE };
