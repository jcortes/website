import type { APIRequestContext } from "@playwright/test";

/**
 * Every page of the site, as paths, read from the generated sitemap. The
 * sitemap lists absolute production URLs; tests only need the paths.
 */
export async function sitemapPaths(
  request: APIRequestContext,
): Promise<string[]> {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const paths: string[] = [];
  for (const sitemap of locs(index)) {
    const xml = await (await request.get(new URL(sitemap).pathname)).text();
    paths.push(...locs(xml).map((loc) => new URL(loc).pathname));
  }
  return paths.sort();
}

const locs = (xml: string) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
