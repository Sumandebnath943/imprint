import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * The MDX article index.
 *
 * Articles are .mdx files under content/notes/. Reading them from disk rather
 * than from a database is deliberate: these pages are statically generated, so
 * a crawler is served a file that was rendered at build time with no database
 * round-trip in the request path — and the content is version-controlled and
 * reviewable in a diff.
 *
 * Everything here runs at build time only. Nothing in this module may be
 * imported by a client component; `node:fs` would break the bundle.
 */

const NOTES_DIR = path.join(process.cwd(), "content", "notes");

export type NoteFaq = { q: string; a: string };
export type NoteSource = { title: string; url?: string };

export type NoteMeta = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated: string;
  author: string;
  /** Cluster from the keyword plan, kept so the content mix stays deliberate. */
  cluster: string;
  primaryKeyword: string;
  readingMinutes: number;
  /** Generates FAQPage schema on the article, stacked with Article. */
  faqs: NoteFaq[];
  sources: NoteSource[];
};

export type Note = NoteMeta & { body: string };

/** Average adult reading speed, rounded conservatively. */
function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
}

function parse(file: string): Note {
  const raw = fs.readFileSync(path.join(NOTES_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const slug = file.replace(/\.mdx?$/, "");

  // Frontmatter is authored by hand, so it is checked rather than trusted. A
  // missing title or description would otherwise ship as an empty <title> and
  // an article with no meta description, which is silent and expensive.
  for (const key of ["title", "description", "published", "primaryKeyword"] as const) {
    if (!data[key]) throw new Error(`content/notes/${file}: frontmatter is missing "${key}"`);
  }

  return {
    slug,
    title: data.title,
    description: data.description,
    published: data.published instanceof Date
      ? data.published.toISOString().slice(0, 10)
      : String(data.published),
    updated: data.updated
      ? data.updated instanceof Date
        ? data.updated.toISOString().slice(0, 10)
        : String(data.updated)
      : String(data.published),
    author: data.author ?? "Suman Debnath",
    cluster: data.cluster ?? "",
    primaryKeyword: data.primaryKeyword,
    readingMinutes: readingMinutes(content),
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    sources: Array.isArray(data.sources) ? data.sources : [],
    body: content,
  };
}

/** All notes, newest first. */
export function getNotes(): Note[] {
  if (!fs.existsSync(NOTES_DIR)) return [];
  return fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parse)
    .sort((a, b) => (a.published < b.published ? 1 : -1));
}

export function getNote(slug: string): Note | undefined {
  return getNotes().find((n) => n.slug === slug);
}

/** Metadata only — for the index page and the sitemap, which never need bodies. */
export function getNoteMeta(): NoteMeta[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return getNotes().map(({ body, ...meta }) => meta);
}
