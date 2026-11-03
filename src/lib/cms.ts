import { articles as fallbackArticles, imageFor } from "../data/articles";

export type Taxonomy = { name: string; slug: string };
export const ARTICLES_PER_PAGE = 10;
export type CmsImage = {
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};
export type CmsContent = {
  id: number | string;
  slug: string;
  title: string;
  type: "post" | "page";
  commentsEnabled: boolean;
  description: string | null;
  bodyMarkdown: string | null;
  passwordProtected: boolean;
  publishedAt: string;
  updatedAt: string;
  author: { name: string } | null;
  category: Taxonomy | null;
  tags: Taxonomy[];
  featuredImage: CmsImage | null;
  seo: {
    title: string | null;
    description: string | null;
    canonicalUrl: string | null;
    noindex: boolean;
  };
};

type CursorResponse<T> = {
  data: T[];
  next_cursor?: string | null;
  next_page_url?: string | null;
};
type TaxonomyResponse = { data: { categories: Taxonomy[]; tags: Taxonomy[] } };

const apiBase = (import.meta.env.CMS_API_URL || "").replace(/\/$/, "");
export const cmsApiBase = apiBase;

async function cmsFetch<T>(path: string): Promise<T | null> {
  if (!apiBase) return null;
  try {
    const url = /^https?:\/\//.test(path) ? path : `${apiBase}${path}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`CMS API ${response.status}: ${path}`);
    return (await response.json()) as T;
  } catch (error) {
    console.warn(
      `[CMS] ${error instanceof Error ? error.message : String(error)}. Local preview data is used.`,
    );
    return null;
  }
}

async function fetchAllContentPages(
  endpoint: "posts" | "pages",
): Promise<CmsContent[] | null> {
  let nextPath: string | null = `/api/v1/${endpoint}?limit=100`;
  const collected: CmsContent[] = [];
  const visited = new Set<string>();

  while (nextPath) {
    if (visited.has(nextPath)) {
      throw new Error(`[CMS] Pagination loop detected: ${nextPath}`);
    }
    visited.add(nextPath);

    const payload: CursorResponse<CmsContent> | null =
      await cmsFetch<CursorResponse<CmsContent>>(nextPath);
    if (!payload) return null;
    collected.push(...payload.data);

    if (payload.next_cursor) {
      nextPath = `/api/v1/${endpoint}?limit=100&cursor=${encodeURIComponent(payload.next_cursor)}`;
    } else {
      nextPath = payload.next_page_url || null;
    }
  }

  return [
    ...new Map(collected.map((content) => [content.id, content])).values(),
  ];
}

function fallbackContent(): CmsContent[] {
  return fallbackArticles.map((article, index) => ({
    id: `fallback-${index + 1}`,
    slug: article.slug,
    title: article.title,
    type: "post",
    commentsEnabled: false,
    description: article.excerpt,
    bodyMarkdown: `## ${article.title}\n\n${article.excerpt}\n\n### まず押さえるポイント\n\n- 現象を図にして整理する\n- 既知量と未知量を区別する\n- 基本法則から式を立てる\n\n## 例題で確認\n\n物理量の向きと単位をそろえ、基本式から順番に考えます。\n\n\`\`\`text\nF = ma\n\`\`\`\n`,
    passwordProtected: false,
    publishedAt: `${article.date.replaceAll(".", "-")}T00:00:00+09:00`,
    updatedAt: `${article.date.replaceAll(".", "-")}T00:00:00+09:00`,
    author: { name: "あっきー" },
    category: { name: article.category, slug: "dynamics" },
    tags: [],
    featuredImage: {
      url: imageFor(article.image, 1200, 700),
      alt: article.title,
      width: 1200,
      height: 700,
    },
    seo: { title: null, description: null, canonicalUrl: null, noindex: false },
  }));
}

let postsPromise: Promise<CmsContent[]> | undefined;
let pagesPromise: Promise<CmsContent[]> | undefined;
let taxonomiesPromise:
  Promise<{ categories: Taxonomy[]; tags: Taxonomy[] }> | undefined;

export function getPosts(): Promise<CmsContent[]> {
  return (postsPromise ??= fetchAllContentPages("posts").then((posts) =>
    posts?.length ? posts : fallbackContent(),
  ));
}

export function getPages(): Promise<CmsContent[]> {
  return (pagesPromise ??= fetchAllContentPages("pages").then(
    (pages) => pages ?? [],
  ));
}

export async function getAllContent(): Promise<CmsContent[]> {
  const [posts, pages] = await Promise.all([getPosts(), getPages()]);
  return [...posts, ...pages];
}

export async function getTaxonomies(): Promise<{
  categories: Taxonomy[];
  tags: Taxonomy[];
}> {
  return (taxonomiesPromise ??= (async () => {
    const payload = await cmsFetch<TaxonomyResponse>("/api/v1/taxonomies");
    if (payload?.data) return payload.data;
    const posts = await getPosts();
    const categories = [
      ...new Map(
        posts.flatMap((post) =>
          post.category ? [[post.category.slug, post.category] as const] : [],
        ),
      ).values(),
    ];
    const tags = [
      ...new Map(
        posts.flatMap((post) =>
          post.tags.map((tag) => [tag.slug, tag] as const),
        ),
      ).values(),
    ];
    return { categories, tags };
  })());
}

export function contentUrl(content: CmsContent): string {
  return `/${content.slug}/`;
}

export function categoryUrl(category: Taxonomy): string {
  return `/category/${category.slug}/`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Tokyo",
      })
        .format(date)
        .replaceAll("/", ".");
}

export function excerpt(content: CmsContent): string {
  if (content.description) return content.description;
  return (content.bodyMarkdown || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
}
