import type { APIRoute } from "astro";
import { getAllContent } from "../lib/cms";

export const prerender = true;

const SITE_URL = "https://ryebourbon.xsrv.jp";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toIsoDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toISOString();
}

export const GET: APIRoute = async () => {
  const content = (await getAllContent())
    .filter((entry) => !entry.seo.noindex)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
    );

  const latestUpdate = content[0]?.updatedAt ?? new Date().toISOString();
  const urls = [
    {
      loc: `${SITE_URL}/`,
      lastmod: latestUpdate,
      changefreq: "daily",
      priority: "1.0",
    },
    ...content.map((entry) => ({
      // WordPressと同じく、投稿・固定ページともルート直下のスラッグURLにする。
      loc: `${SITE_URL}/${encodeURIComponent(entry.slug)}/`,
      lastmod: entry.updatedAt,
      changefreq: entry.type === "page" ? "weekly" : "monthly",
      priority: entry.type === "page" ? "0.6" : "0.2",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${escapeXml(toIsoDate(url.lastmod))}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
