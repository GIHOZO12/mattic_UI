import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

test("guest buys without an account, returns to a private order and admin verifies payment", async ({
  page,
  browser,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products/classic-white-shirt");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByText("A good choice. Added to your bag."),
  ).toBeVisible();
  await page.goto("/cart");
  await expect(page.locator(".bag-item")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".bag-item")).toHaveCount(1);
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(
    page.getByText("Checkout as a guest. No account or password needed."),
  ).toBeVisible();
  for (const [label, value] of [
    ["Full name", "Guest Browser"],
    ["Phone number", "0780000000"],
    ["Province", "Kigali"],
    ["District", "Gasabo"],
    ["Sector", "Remera"],
  ]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole("button", { name: "Review your order" }).click();
  await expect(page.locator(".address-text")).toContainText("Guest Browser");
  await page
    .getByRole("button", { name: "Create order & continue to payment" })
    .click();
  await expect(page).toHaveURL(/\/payment\/\d+$/);
  const orderId = page.url().split("/").pop();
  await expect(page.locator(".merchant-code strong")).toHaveText("0784888458");
  await expect(page.getByRole("button", { name: "Copy number" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("guest-payment-mobile.png"),
    fullPage: true,
  });
  await page
    .getByLabel("Choose payment screenshot")
    .setInputFiles(resolve(".e2e-data/proof.png"));
  await page.getByRole("button", { name: "Submit payment proof" }).click();
  await expect(
    page.getByRole("heading", { name: "Payment submitted." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View your order" }).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));
  await page.reload();
  await expect(page.locator(".order-number")).toBeVisible();
  await page.goto("/orders");
  await expect(page.locator(".order-card")).toHaveCount(1);

  const stranger = await browser.newContext({
    baseURL: info.project.use.baseURL,
  });
  const other = await stranger.newPage();
  await other.goto(`/orders/${orderId}`);
  await expect(other.locator(".error-state")).toBeVisible();
  await expect(other.getByText("Guest Browser", { exact: true })).toHaveCount(
    0,
  );
  await stranger.close();

  const owner = await browser.newContext({ baseURL: info.project.use.baseURL });
  const admin = await owner.newPage();
  await admin.goto("/login");
  await admin.getByLabel("Email address").fill("owner@e2e.example");
  await admin
    .getByLabel("Password", { exact: true })
    .fill("E2e-only-Owner-493!");
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(admin).toHaveURL(/\/dashboard$/);
  await admin.goto(`/dashboard/orders/${orderId}`);
  await expect(
    admin.getByText("Guest checkout", { exact: false }).first(),
  ).toBeVisible();
  await admin.getByRole("link", { name: "View payment & screenshot" }).click();
  await expect(
    admin.getByAltText("Submitted payment screenshot"),
  ).toBeVisible();
  await admin
    .getByRole("button", { name: "Verify payment", exact: true })
    .click();
  await admin
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(
    admin.getByText("Payment verified. Order confirmed and stock updated."),
  ).toBeVisible();
  await page.goto(`/orders/${orderId}`);
  await expect(
    page.locator(".badge").filter({ hasText: /^paid$/i }),
  ).toBeVisible();
  await owner.close();
  expect(errors).toEqual([]);
});
