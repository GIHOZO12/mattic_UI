import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

test("product editor publishes images, variants and stock; expired access refreshes once", async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@e2e.example");
  await page
    .getByLabel("Password", { exact: true })
    .fill("E2e-only-Owner-493!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("#dashboard-content h1")).toBeVisible();
  let refreshCount = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/token/refresh/")) refreshCount++;
  });
  const authenticated = await page.evaluate(async () => {
    const { setTokens } = await import("/src/api/client.js");
    const { dashboardService } = await import("/src/api/services.js");
    setTokens({ access: "deliberately-expired-test-token" });
    const values = await Promise.all(
      ["products", "brands", "colors"].map((name) =>
        dashboardService.list(name),
      ),
    );
    return values.every((value) => Array.isArray(value.results));
  });
  expect(authenticated).toBe(true);
  expect(refreshCount).toBe(1);

  await page
    .getByRole("navigation", { name: "Dashboard navigation" })
    .getByRole("link", { name: "Products", exact: true })
    .click();
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  const suffix = Date.now();
  const name = `Browser Capsule ${suffix}`;
  const slug = `browser-capsule-${suffix}`;
  await page.getByLabel("Product name", { exact: true }).fill(name);
  await page.getByLabel("URL slug").fill(slug);
  await page
    .getByLabel("Category / subcategory")
    .selectOption({ label: "Shirts" });
  await page.getByLabel("Regular price", { exact: true }).fill("18000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/dashboard\/products\/\d+$/);
  const productId = page.url().split("/").pop();
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    name,
  );
  await page
    .getByLabel("Upload product image")
    .setInputFiles(resolve(".e2e-data/proof.png"));
  await expect(page.locator(".admin-image img")).toHaveCount(1);
  await page.getByRole("button", { name: "Add variant", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Size", exact: true })
    .selectOption({ label: "M" });
  await dialog
    .getByRole("combobox", { name: "Color", exact: true })
    .selectOption({ label: "White" });
  const sku = `E2E-${suffix}`;
  await dialog.getByLabel("SKU / stock code").fill(sku);
  await dialog.getByLabel("Variant price override").fill("19000");
  await dialog.getByLabel("Available stock", { exact: true }).fill("7");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("cell", { name: sku, exact: true }),
  ).toBeVisible();

  const publicContext = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  const shopper = await publicContext.newPage();
  await shopper.goto(`/products/${slug}`);
  await expect(
    shopper.getByRole("heading", { name, exact: true }),
  ).toBeVisible();
  await expect(shopper.locator(".stock-label")).toContainText("7 available");
  await expect(shopper.locator(".product-purchase > .price")).toContainText(
    "19,000",
  );
  await expect(
    shopper.getByRole("button", { name: "Add to bag" }),
  ).toBeEnabled();
  expect(
    await shopper.locator(".gallery-main img").evaluate(async (image) => {
      await image.decode();
      return image.naturalWidth;
    }),
  ).toBeGreaterThan(0);

  await page.getByRole("button", { name: `Edit ${sku}`, exact: true }).click();
  await dialog.getByLabel("Available stock", { exact: true }).fill("0");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  await shopper.reload();
  await expect(
    shopper.getByRole("button", { name: "Add to bag" }),
  ).toBeDisabled();
  await expect(shopper.locator(".stock-label")).toContainText("unavailable");
  await publicContext.close();
  await page
    .getByRole("navigation", { name: "Dashboard navigation" })
    .getByRole("link", { name: "Products", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Delete ${name}`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(page.getByRole("cell", { name, exact: true })).toHaveCount(0);
  expect(productId).toMatch(/^\d+$/);
  expect(errors).toEqual([]);
});
