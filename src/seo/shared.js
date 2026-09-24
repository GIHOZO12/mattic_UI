// Shared by the browser app and the Cloudflare Worker (worker/index.js), so it must not
// touch `import.meta.env`, the DOM or anything browser-only.

export const BRAND = "Suit and Tie Fashion Shop";
export const DEFAULT_DESCRIPTION =
  "Suit and Tie Fashion Shop. Considered menswear for every occasion. Discover tailoring, everyday essentials and the finishing touches.";
export const DEFAULT_IMAGE = "/images/og-default.jpg";

// Paths that should never appear in search results.
export const PRIVATE_PREFIXES = [
  "/cart",
  "/checkout",
  "/payment",
  "/orders",
  "/wishlist",
  "/account",
  "/dashboard",
  "/login",
  "/register",
  "/search",
];
export const isPrivatePath = (path) =>
  PRIVATE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

export const pageTitle = (title) =>
  title && title !== BRAND ? `${title} | ${BRAND}` : BRAND;

export const clip = (text, max = 160) => {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

export const absoluteUrl = (value, origin) =>
  value ? new URL(value, origin).href : undefined;

export function productDescription(product) {
  return clip(
    product.short_description ||
      product.description ||
      `${product.name} from ${BRAND}.`,
  );
}

export function productImage(product, origin) {
  const images = [...(product.images || [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  return absoluteUrl(images[0]?.image || DEFAULT_IMAGE, origin);
}

export function productJsonLd(product, origin, currency = "RWF") {
  const url = `${origin}/products/${product.slug}`;
  const inStock =
    product.in_stock ??
    (product.variants || []).some(
      (v) => v.is_available && v.stock_quantity > 0,
    );
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription(product),
    image: (product.images || []).map((i) => absoluteUrl(i.image, origin)),
    url,
    sku: String(product.id),
    category: product.category?.name,
    ...(product.brand?.name && {
      brand: { "@type": "Brand", name: product.brand.name },
    }),
    ...(product.material && { material: product.material }),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: String(product.current_price ?? product.base_price),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: BRAND },
    },
  };
  if (product.review_count > 0 && product.average_rating)
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(product.average_rating),
      reviewCount: product.review_count,
    };
  if (!data.image.length) data.image = [absoluteUrl(DEFAULT_IMAGE, origin)];
  return data;
}

export function breadcrumbJsonLd(items, origin) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  };
}
