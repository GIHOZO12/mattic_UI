/* global HTMLRewriter */
// Serves the built storefront and forwards API/media requests to the Django backend,
// so the browser only ever talks to one origin (no CORS needed). It also builds
// /sitemap.xml and injects per-page SEO tags into product and category pages, because
// link-preview bots (WhatsApp, Facebook, X) do not run JavaScript.
import {
  BRAND,
  DEFAULT_DESCRIPTION,
  breadcrumbJsonLd,
  clip,
  pageTitle,
  productDescription,
  productImage,
  productJsonLd,
} from "../src/seo/shared.js";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/info/about",
  "/info/delivery",
  "/info/size-guide",
  "/info/returns",
  "/info/contact",
  "/info/terms",
  "/info/privacy",
];

async function api(env, path) {
  const response = await fetch(new URL(`/api/v1${path}`, env.BACKEND_URL), {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API ${path} returned ${response.status}`);
  const body = await response.json();
  return body && typeof body === "object" && "success" in body
    ? body.data
    : body;
}

async function allPages(env, path) {
  const records = [];
  for (let page = 1; page <= 50; page += 1) {
    const data = await api(env, `${path}?page=${page}`);
    if (!data) break;
    if (Array.isArray(data)) return data;
    records.push(...(data.results || []));
    if (!data.next) break;
  }
  return records;
}

const xmlEscape = (value) =>
  String(value).replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c],
  );

async function sitemap(env, origin) {
  const [products, categories] = await Promise.all([
    allPages(env, "/products/"),
    allPages(env, "/categories/"),
  ]);
  const urls = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...categories
      .filter((c) => c.is_active !== false)
      .map((c) => ({ path: `/shop/${c.slug}`, lastmod: c.updated_at })),
    ...products.map((p) => ({
      path: `/products/${p.slug}`,
      lastmod: p.updated_at || p.created_at,
    })),
  ];
  const body = urls
    .map(
      ({ path, lastmod }) =>
        `  <url><loc>${xmlEscape(origin + path)}</loc>${
          lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""
        }</url>`,
    )
    .join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}

// Rewrites the tags that index.html already has and appends the rest.
function withSeo(response, seo) {
  const set = (content) => ({
    element(el) {
      el.setAttribute("content", content);
    },
  });
  const extra = [
    seo.noindex
      ? `<meta name="robots" content="noindex" />`
      : `<link rel="canonical" href="${xmlEscape(seo.url)}" />`,
    `<meta name="twitter:title" content="${xmlEscape(seo.title)}" />`,
    `<meta name="twitter:description" content="${xmlEscape(seo.description)}" />`,
    `<meta name="twitter:image" content="${xmlEscape(seo.image)}" />`,
    seo.jsonLd &&
      `<script type="application/ld+json" id="seo-page-jsonld">${JSON.stringify(
        seo.jsonLd,
      ).replace(/</g, "\\u003c")}</script>`,
  ]
    .filter(Boolean)
    .join("");
  return new HTMLRewriter()
    .on("title", {
      element(el) {
        el.setInnerContent(seo.title);
      },
    })
    .on('meta[name="description"]', set(seo.description))
    .on('meta[property="og:title"]', set(seo.title))
    .on('meta[property="og:description"]', set(seo.description))
    .on('meta[property="og:url"]', set(seo.url))
    .on('meta[property="og:type"]', set(seo.type || "website"))
    .on('meta[property="og:image"]', set(seo.image))
    .on("head", {
      element(el) {
        el.append(extra, { html: true });
      },
    })
    .transform(response);
}

// The rewritten HTML differs per URL, so drop the shared index.html ETag.
function htmlResponse(page, status = page.status) {
  const headers = new Headers(page.headers);
  headers.delete("ETag");
  headers.set("Cache-Control", "no-cache");
  return new Response(page.body, { status, headers });
}

async function pageSeo(env, url, origin) {
  const [, section, slug] = url.pathname.split("/");
  if (!slug) return undefined;
  if (section === "products") {
    const product = await api(env, `/products/${encodeURIComponent(slug)}/`);
    if (!product) return null;
    const path = `/products/${product.slug}`;
    return {
      title: pageTitle(product.name),
      description: productDescription(product),
      image: productImage(product, origin),
      url: origin + path,
      type: "product",
      jsonLd: [
        productJsonLd(product, origin, env.CURRENCY || "RWF"),
        breadcrumbJsonLd(
          [
            { name: "Shop", path: "/shop" },
            {
              name: product.category.name,
              path: `/shop/${product.category.slug}`,
            },
            { name: product.name, path },
          ],
          origin,
        ),
      ],
    };
  }
  if (section === "shop") {
    const categories = await allPages(env, "/categories/");
    const category = categories.find((c) => c.slug === slug);
    if (!category) return null;
    return {
      title: pageTitle(`${category.name} for Men`),
      description: clip(
        category.description?.length > 40
          ? category.description
          : `Shop ${category.name.toLowerCase()} for men at ${BRAND}. Browse the collection, compare sizes and colours, and order online.`,
      ),
      image: category.image || `${origin}/images/og-default.jpg`,
      url: `${origin}/shop/${category.slug}`,
    };
  }
  return undefined;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Canonical links always point at the real domain, even on *.workers.dev.
    const origin = env.SITE_URL || url.origin;
    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/media/")
    ) {
      const target = new URL(url.pathname + url.search, env.BACKEND_URL);
      return fetch(new Request(target, request));
    }
    if (url.pathname === "/sitemap.xml") {
      try {
        return await sitemap(env, origin);
      } catch (error) {
        console.error("sitemap failed", error);
        return new Response("Sitemap temporarily unavailable", { status: 503 });
      }
    }
    const page = await env.ASSETS.fetch(request);
    const isHtml = page.headers.get("Content-Type")?.includes("text/html");
    if (!isHtml || request.method !== "GET") return page;
    let seo;
    try {
      seo = await pageSeo(env, url, origin);
    } catch (error) {
      // Backend unreachable: serve the page with its default tags.
      console.error("page SEO failed", error);
      return page;
    }
    if (seo === undefined) return page;
    if (seo === null)
      return withSeo(htmlResponse(page, 404), {
        title: pageTitle("Page not found"),
        description: DEFAULT_DESCRIPTION,
        image: `${origin}/images/og-default.jpg`,
        url: origin + url.pathname,
        noindex: true,
      });
    return withSeo(htmlResponse(page), seo);
  },
};
