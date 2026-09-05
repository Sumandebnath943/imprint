/**
 * Cross-domain entity constants.
 *
 * IMPRINT is one of three properties that describe the same two entities:
 *
 *   Person        Suman Debnath   sumandebnath.houseofnamus.com
 *   Organization  House of Namus  houseofnamus.com
 *
 * Both of those sites already publish canonical JSON-LD nodes under the `@id`
 * values below. This file exists so IMPRINT *references* those nodes instead of
 * minting its own. A second Person node for the same human splits the entity
 * across two identifiers, which is worse than publishing nothing — search and
 * retrieval systems resolve entities by `@id`, and two ids means two people.
 *
 * The portfolio's Person node already names IMPRINT in its
 * `disambiguatingDescription` ("creator of ROASmind, IMPRINT, LEGATUS…").
 * Until this file shipped, that claim was unreciprocated: one site asserting a
 * relationship the other never confirmed. The nodes built from these constants
 * are what close that loop.
 */

/** Canonical Person node, defined on the portfolio. Reference, never redeclare. */
export const PERSON_ID = "https://sumandebnath.houseofnamus.com/#person";

/** Canonical Organization node, defined on the House of Namus root domain. */
export const ORG_ID = "https://houseofnamus.com/#organization";

export const PERSON_NAME = "Suman Debnath";
export const PERSON_URL = "https://sumandebnath.houseofnamus.com";

export const ORG_NAME = "House of Namus";
export const ORG_URL = "https://houseofnamus.com";
export const ORG_LOGO =
  "https://houseofnamus.com/wp-content/uploads/2025/11/cropped-NAMUS-LOGO-SQUARE-3000x3000-1-scaled-1.jpg";

/**
 * Suman's role *on this product*, distinct from the global `jobTitle` the
 * portfolio publishes ("Senior Brand Marketing Manager & AI-Native Product
 * Builder"). Both are true simultaneously: schema.org treats jobTitle as a
 * property of the person, and this as the role held within a specific work.
 */
export const PERSON_ROLE_HERE = "Creator";

/**
 * Verified profiles for the Person.
 *
 * This array is a copy of the one on the portfolio's Person node and must stay
 * byte-identical to it — same URLs, same order. Repeating it here is not
 * duplication: two properties independently asserting the same profile set is
 * exactly the corroboration that lets an engine treat the entity as real
 * rather than merely claimed. Drift between the two arrays is worse than
 * omitting this one, so change both together or neither.
 */
export const PERSON_SAME_AS = [
  "https://github.com/Sumandebnath943",
  "https://huggingface.co/SumanDebnath943",
  "https://linkedin.com/in/suman-debnath-a528653a1",
  "https://x.com/iamSdebnath",
  "https://bsky.app/profile/sumandebnath.bsky.social",
  "https://mastodon.social/@sumandebnath",
] as const;

/**
 * Verified profiles for the Organization, taken from the houseofnamus.com
 * footer. These are the accounts surfaced in IMPRINT's own footer, because the
 * footer speaks for the publisher; the Person's profiles above stay in
 * structured data only.
 *
 * Note the root domain currently publishes no `sameAs` on its Organization
 * node, so IMPRINT is the first property to assert these. Adding the same array
 * to houseofnamus.com would make the claim reciprocal there too.
 */
export const ORG_SOCIALS = [
  { platform: "linkedin", label: "House of Namus on LinkedIn", href: "https://www.linkedin.com/company/houseofnamus/" },
  { platform: "instagram", label: "House of Namus on Instagram", href: "https://www.instagram.com/houseofnamus/" },
  { platform: "facebook", label: "House of Namus on Facebook", href: "https://www.facebook.com/houseofnamus/" },
  { platform: "x", label: "House of Namus on X", href: "https://x.com/houseofnamus" },
  { platform: "youtube", label: "House of Namus on YouTube", href: "https://www.youtube.com/@houseofnamus" },
] as const;

/** Derived so the footer's visible links and the Organization node's `sameAs`
 *  can never disagree — a profile listed in one but not the other is the exact
 *  inconsistency that makes an engine discount both. */
export const ORG_SAME_AS = ORG_SOCIALS.map((s) => s.href);

/** Business contact for IMPRINT, scoped by purpose so it complements rather
 *  than contradicts the personal address on the portfolio's own nodes. */
export const CONTACT_EMAIL = "defy@houseofnamus.com";
