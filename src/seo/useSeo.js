import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { siteUrl } from "../components/layout/StoreLayout";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  absoluteUrl,
  clip,
  isPrivatePath,
  pageTitle,
} from "./shared";

function setTag(selector, create, attr, value) {
  let el = document.head.querySelector(selector);
  if (value == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}
const meta = (key, value, attr = "name") =>
  setTag(
    `meta[${attr}="${key}"]`,
    () => {
      const el = document.createElement("meta");
      el.setAttribute(attr, key);
      return el;
    },
    "content",
    value,
  );

// Updates the tags already in index.html (or injected by the Worker) instead of adding
// duplicates. `jsonLd` replaces the page-specific structured data block.
export function applySeo({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd = null,
}) {
  const fullTitle = pageTitle(title);
  const text = clip(description || DEFAULT_DESCRIPTION);
  const url = `${siteUrl}${path}`;
  const img = absoluteUrl(image || DEFAULT_IMAGE, siteUrl);
  document.title = fullTitle;
  meta("description", text);
  meta("robots", noindex ? "noindex, nofollow" : null);
  meta("og:title", fullTitle, "property");
  meta("og:description", text, "property");
  meta("og:url", url, "property");
  meta("og:type", type, "property");
  meta("og:image", img, "property");
  meta("twitter:card", "summary_large_image");
  meta("twitter:title", fullTitle);
  meta("twitter:description", text);
  meta("twitter:image", img);
  setTag(
    'link[rel="canonical"]',
    () => {
      const el = document.createElement("link");
      el.rel = "canonical";
      return el;
    },
    "href",
    noindex ? null : url,
  );
  let script = document.getElementById("seo-page-jsonld");
  if (!jsonLd) script?.remove();
  else {
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "seo-page-jsonld";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }
}

// `ready` lets data-driven pages wait until their content has loaded.
export function useSeo(options, ready = true) {
  const { pathname } = useLocation();
  const key = JSON.stringify(options);
  useEffect(() => {
    if (ready) applySeo({ path: pathname, ...options });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pathname, ready]);
}

// Default tags for every route; pages that call useSeo override them afterwards.
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    applySeo({ path: pathname, noindex: isPrivatePath(pathname) });
  }, [pathname]);
  return null;
}
