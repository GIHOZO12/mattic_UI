import { client, getRefresh, loginRequest } from "./client";

const result = (promise) => promise.then((response) => response.data);
export const get = (path, params = {}, signal) =>
  result(client.get(path, { params, signal }));
export const post = (path, data) =>
  result(
    client.post(
      path,
      data,
      data instanceof FormData ? { timeout: 120000 } : {},
    ),
  );
export const patch = (path, data) =>
  result(
    client.patch(
      path,
      data,
      data instanceof FormData ? { timeout: 120000 } : {},
    ),
  );
export const remove = (path) => result(client.delete(path));
export async function allPages(path, params = {}, signal) {
  const records = [];
  for (let page = 1; page <= 500; page += 1) {
    const data = await get(path, { ...params, page }, signal);
    if (Array.isArray(data)) return data;
    records.push(...(data.results || []));
    if (!data.next) return records;
  }
  throw new Error("Too many records to load. Please narrow the selection.");
}
export const authService = {
  login: loginRequest,
  register: (data) => post("/auth/register/", data),
  me: () => get("/auth/me/"),
  update: (data) => patch("/auth/me/", data),
  logout: () => post("/auth/logout/", { refresh: getRefresh() }),
};
export const productService = {
  list: (params, signal) => get("/products/", params, signal),
  detail: (slug, signal) =>
    get(`/products/${encodeURIComponent(slug)}/`, {}, signal),
};
export const referenceService = {
  all: (name, signal) => allPages(`/${name}/`, {}, signal),
  store: (signal) => get("/store/", {}, signal),
  payment: (signal) => get("/payment-instructions/", {}, signal),
};
export const cartService = {
  get: () => get("/cart/"),
  add: (variant, quantity) => post("/cart/items/", { variant, quantity }),
  update: (id, quantity) => patch(`/cart/items/${id}/`, { quantity }),
  remove: (id) => remove(`/cart/items/${id}/`),
  clear: () => remove("/cart/clear/"),
};
export const wishlistService = {
  get: () => get("/wishlist/"),
  add: (product) => post("/wishlist/items/", { product }),
  remove: (id) => remove(`/wishlist/items/${id}/`),
};
export const addressService = {
  all: () => allPages("/addresses/"),
  create: (data) => post("/addresses/", data),
  update: (id, data) => patch(`/addresses/${id}/`, data),
  remove: (id) => remove(`/addresses/${id}/`),
};
export const orderService = {
  list: (params, signal) => get("/orders/", params, signal),
  detail: (id, signal) => get(`/orders/${id}/`, {}, signal),
  checkout: (data) => post("/checkout/", data),
};
export const paymentService = {
  submit: (id, data) => post(`/orders/${id}/payment-proof/`, data),
  download: (id) =>
    result(client.get(`/payments/${id}/screenshot/`, { responseType: "blob" })),
};
export const reviewService = { create: (data) => post("/reviews/", data) };
export const dashboardService = {
  list: (resource, params, signal) =>
    get(`/dashboard/${resource}/`, params, signal),
  all: (resource, params = {}, signal) =>
    allPages(`/dashboard/${resource}/`, params, signal),
  detail: (resource, id, signal) =>
    get(`/dashboard/${resource}/${id}/`, {}, signal),
  create: (resource, data) => post(`/dashboard/${resource}/`, data),
  update: (resource, id, data) => patch(`/dashboard/${resource}/${id}/`, data),
  remove: (resource, id) => remove(`/dashboard/${resource}/${id}/`),
  summary: () => get("/dashboard/summary/"),
  report: (params) => get("/dashboard/reports/sales/", params),
  verify: (id, admin_note) =>
    post(`/dashboard/payments/${id}/verify/`, { admin_note }),
  reject: (id, admin_note) =>
    post(`/dashboard/payments/${id}/reject/`, { admin_note }),
  transition: (id, status, admin_note = "") =>
    post(`/dashboard/orders/${id}/transition/`, { status, admin_note }),
};
