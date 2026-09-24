import { describe, it } from "node:test";
import assert from "node:assert/strict";
const expect = (actual) => ({
  toBe: (expected) => assert.equal(actual, expected),
  toBeNull: () => assert.equal(actual, null),
});
import {
  canSubmitPayment,
  nextOrderStatus,
  safeRedirect,
  selectVariant,
} from "./format.js";

describe("checkout and access boundaries", () => {
  it("rejects external and backslash redirects", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/\n/evil.example",
      "/\t/evil.example",
      null,
      "account",
    ])
      expect(safeRedirect(value)).toBe("/account");
    expect(safeRedirect("/checkout?from=bag")).toBe("/checkout?from=bag");
  });
  it("only allows the exact available variant with positive stock", () => {
    const variants = [
      { size: 1, color: 2, is_available: true, stock_quantity: 3 },
      { size: 1, color: 3, is_available: false, stock_quantity: 3 },
      { size: 2, color: 2, is_available: true, stock_quantity: 0 },
    ];
    expect(selectVariant(variants, "1", "2")).toBe(variants[0]);
    expect(selectVariant(variants, 1, 3)).toBeNull();
    expect(selectVariant(variants, 2, 2)).toBeNull();
    expect(selectVariant(variants, 8, 8)).toBeNull();
  });
  it("allows new or rejected proofs and blocks resubmission after verification", () => {
    expect(
      canSubmitPayment({
        status: "PENDING_PAYMENT",
        payment: { status: "PENDING" },
      }),
    ).toBe(true);
    expect(
      canSubmitPayment({
        status: "PENDING_PAYMENT",
        payment: { status: "REJECTED" },
      }),
    ).toBe(true);
    for (const status of ["SUBMITTED", "VERIFIED"])
      expect(
        canSubmitPayment({ status: "PAYMENT_SUBMITTED", payment: { status } }),
      ).toBe(false);
    expect(
      canSubmitPayment({
        status: "CANCELLED",
        payment: { status: "REJECTED" },
      }),
    ).toBe(false);
  });
  it("only offers sequential fulfillment after payment", () => {
    expect(
      nextOrderStatus({ status: "CONFIRMED", payment_status: "UNPAID" }),
    ).toBeNull();
    expect(
      nextOrderStatus({ status: "CONFIRMED", payment_status: "PAID" }),
    ).toBe("PROCESSING");
    expect(
      nextOrderStatus({ status: "PROCESSING", payment_status: "PAID" }),
    ).toBe("SHIPPED");
    expect(nextOrderStatus({ status: "SHIPPED", payment_status: "PAID" })).toBe(
      "DELIVERED",
    );
    expect(
      nextOrderStatus({ status: "DELIVERED", payment_status: "PAID" }),
    ).toBeNull();
  });
});
