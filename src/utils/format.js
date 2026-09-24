export const formatMoney = (amount, currency = "RWF") => {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency}`;
  }
};
export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeZone: "Africa/Kigali",
      }).format(new Date(value))
    : "—";
export const statusLabel = (value) =>
  ({
    PENDING_PAYMENT: "Awaiting payment",
    PAYMENT_SUBMITTED: "Payment submitted",
    PENDING_VERIFICATION: "Awaiting verification",
  })[value] ||
  String(value || "")
    .toLowerCase()
    .replaceAll("_", " ");
export const canSubmitPayment = (order) =>
  ["PENDING_PAYMENT", "PAYMENT_SUBMITTED"].includes(order?.status) &&
  ["PENDING", "REJECTED"].includes(order?.payment?.status);
export const nextOrderStatus = (order) =>
  order?.payment_status === "PAID"
    ? { CONFIRMED: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" }[
        order.status
      ] || null
    : null;
export function selectVariant(variants, size, color) {
  return (
    variants.find(
      (v) =>
        String(v.size) === String(size) &&
        String(v.color) === String(color) &&
        v.is_available &&
        v.stock_quantity > 0,
    ) || null
  );
}
export const safeRedirect = (value) =>
  typeof value === "string" &&
  value.startsWith("/") &&
  !value.startsWith("//") &&
  // Explicitly reject controls that browsers remove while normalizing a URL.
  // eslint-disable-next-line no-control-regex
  !/[\u0000-\u001f\u007f\\]/.test(value)
    ? value
    : "/account";
