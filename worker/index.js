// Serves the built storefront and forwards API/media requests to the Django backend,
// so the browser only ever talks to one origin (no CORS needed).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) {
      const target = new URL(url.pathname + url.search, env.BACKEND_URL);
      return fetch(new Request(target, request));
    }
    return env.ASSETS.fetch(request);
  },
};
