import axios from "axios";

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "/api/v1"
).replace(/\/$/, "");
const raw = axios.create({ baseURL: API_BASE, timeout: 20000 });
export const client = axios.create({ baseURL: API_BASE, timeout: 20000 });
let accessToken = null;
let refreshPromise = null;
let generation = 0;
const tokenKey = "suitandtiefashionshop.refresh";
const storage = () =>
  typeof sessionStorage !== "undefined" ? sessionStorage : null;

export function setTokens(tokens) {
  accessToken = tokens.access;
  if (tokens.refresh) storage()?.setItem(tokenKey, tokens.refresh);
}
export function clearTokens() {
  generation += 1;
  accessToken = null;
  storage()?.removeItem(tokenKey);
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("suitandtiefashionshop:logout"));
}
export const getRefresh = () => storage()?.getItem(tokenKey);

export async function refreshSession() {
  if (!getRefresh()) return null;
  if (!refreshPromise) {
    const started = generation;
    refreshPromise = raw
      .post("/auth/token/refresh/", { refresh: getRefresh() })
      .then(({ data }) => {
        if (started !== generation)
          throw new Error("Session ended. Please sign in again.");
        setTokens(data.data);
        return data.data;
      })
      .catch((error) => {
        if (started === generation) clearTokens();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// A private browser session lets guests return to their own bag and orders.
let guestToken;
function getGuestToken() {
  if (guestToken) return guestToken;
  try {
    guestToken = localStorage.getItem("suitandtiefashionshop.guest");
  } catch {
    /* Use memory when storage is unavailable. */
  }
  if (!/^[0-9a-f]{64}$/.test(guestToken || "")) {
    guestToken = Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    try {
      localStorage.setItem("suitandtiefashionshop.guest", guestToken);
    } catch {
      /* Keep this tab usable. */
    }
  }
  return guestToken;
}

client.interceptors.request.use((config) => {
  config._sessionGeneration ??= generation;
  if (config._sessionGeneration !== generation)
    throw new axios.CanceledError("Session changed.");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  else config.headers["X-Guest-Token"] = getGuestToken();
  return config;
});
client.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    )
      response.data = response.data.data;
    return response;
  },
  async (error) => {
    const config = error.config;
    if (config && config._sessionGeneration !== generation)
      return Promise.reject(error);
    if (error.response?.status === 401 && !config?._retried && getRefresh()) {
      config._retried = true;
      try {
        // Another response may already have refreshed this request's old token.
        if (
          !accessToken ||
          config.headers?.Authorization === `Bearer ${accessToken}`
        )
          await refreshSession();
        return await client(config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 401) clearTokens();
    return Promise.reject(error);
  },
);

export function errorMessage(error) {
  const errors = error?.response?.data?.errors;
  const flatten = (value, prefix = "") => {
    if (Array.isArray(value))
      return value.map((v) => flatten(v, prefix)).join(" ");
    if (value && typeof value === "object")
      return Object.entries(value)
        .map(([k, v]) =>
          flatten(
            v,
            ["detail", "non_field_errors"].includes(k)
              ? ""
              : `${k.replaceAll("_", " ")}: `,
          ),
        )
        .join(" ");
    return `${prefix}${value ?? ""}`;
  };
  if (errors) return flatten(errors);
  if (error?.code === "ERR_NETWORK")
    return "We couldn’t reach the store. Please check your connection and try again.";
  if (error?.code === "ECONNABORTED")
    return "The store took too long to respond. Please try again.";
  return (
    error?.message || "This request could not be completed. Please try again."
  );
}

export async function loginRequest(values) {
  const { data } = await raw.post("/auth/login/", values);
  generation += 1;
  setTokens(data.data);
  return data.data;
}

export function mediaUrl(value) {
  if (!value) return "/images/product-placeholder.svg";
  if (/^(https?:|blob:|data:image\/)/i.test(value)) return value;
  const base = new URL(
    API_BASE,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  return new URL(value, base.origin).href;
}
