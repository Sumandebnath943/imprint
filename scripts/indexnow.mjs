#!/usr/bin/env node
/**
 * Push every URL in the sitemap to IndexNow.
 *
 * IndexNow is a shared submission protocol: one POST reaches Microsoft Bing,
 * Yandex, Naver, Seznam.cz and Yep, because participants agree to forward
 * submissions to each other. Bing's index also feeds DuckDuckGo, Ecosia and
 * Yahoo, so the practical reach is wider than the participant list.
 *
 * Google does not participate and has not since testing it in 2021 — Google
 * discovery still depends on Search Console and the sitemap. Nor do Brave or
 * ByteDance. This complements those; it does not replace them.
 *
 * Usage:
 *   node scripts/indexnow.mjs              # submit every sitemap URL
 *   node scripts/indexnow.mjs --dry-run    # show what would be sent
 *   node scripts/indexnow.mjs /faq /notes  # submit specific paths only
 *
 * Re-run after publishing or materially editing a page. Submitting unchanged
 * URLs repeatedly is what the 429 response is for, so do not put this on a
 * timer — it belongs in the publish step.
 */

const SITE = "https://imprint.houseofnamus.com";
const KEY = "f28dbd0050fb4f421f7e385a1d3b32c6";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const explicit = args.filter((a) => a.startsWith("/"));

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const urlList = explicit.length
    ? explicit.map((p) => `${SITE}${p}`)
    : await sitemapUrls();

  if (!urlList.length) throw new Error("nothing to submit");

  // The key file has to be reachable before submission or every URL is
  // rejected with 403. Checking first turns a silent failure into a clear one.
  const keyCheck = await fetch(KEY_LOCATION);
  const keyBody = keyCheck.ok ? (await keyCheck.text()).trim() : null;
  if (keyBody !== KEY) {
    throw new Error(
      `key file not serving correctly at ${KEY_LOCATION} ` +
        `(status ${keyCheck.status}, body "${keyBody ?? "n/a"}"). ` +
        `Deploy it before submitting.`
    );
  }
  console.log(`key file verified at ${KEY_LOCATION}`);

  const body = {
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  console.log(`${urlList.length} URLs to submit`);
  if (dryRun) {
    urlList.forEach((u) => console.log("  " + u));
    console.log("\n--dry-run: nothing sent");
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  const meaning =
    {
      200: "OK — submitted",
      202: "Accepted — key validation pending",
      400: "Bad request — malformed payload",
      403: "Forbidden — key file missing or wrong",
      422: "Unprocessable — URLs do not match host, or bad key schema",
      429: "Rate limited — too many submissions",
    }[res.status] ?? "unexpected";

  console.log(`\nHTTP ${res.status} — ${meaning}`);
  if (text.trim()) console.log(text.trim().slice(0, 400));
  if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exitCode = 1;
});
