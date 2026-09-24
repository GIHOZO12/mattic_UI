import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

async function fits(page) {
  const overflow = await page.evaluate(() => ({
    width: innerWidth,
    actual: document.documentElement.scrollWidth,
    main: document.querySelector("#dashboard-content")?.getBoundingClientRect()
      .right,
  }));
  expect(overflow.actual, JSON.stringify(overflow)).toBeLessThanOrEqual(
    overflow.width + 1,
  );
  if (overflow.main)
    expect(overflow.main).toBeLessThanOrEqual(overflow.width + 1);
}

test("mobile admin creates a product with its photo and stock, and shoppers see the listing image", async ({
  page,
  browser,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@e2e.example");
  await page
    .getByLabel("Password", { exact: true })
    .fill("E2e-only-Owner-493!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("#dashboard-content h1")).toBeVisible();
  await fits(page);
  await page.screenshot({
    path: info.outputPath("dashboard-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open dashboard navigation" }).click();
  await page
    .getByRole("navigation", { name: "Dashboard navigation" })
    .getByRole("link", { name: "Products", exact: true })
    .click();
  await expect(page.locator(".dashboard-sidebar")).not.toHaveClass(/open/);
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  const slug = `photo-mobile-${Date.now()}`;
  const name = "Mobile photo product";
  await page.getByLabel("Product name", { exact: true }).fill(name);
  await page.getByLabel("URL slug").fill(slug);
  await page
    .getByLabel("Category / subcategory")
    .selectOption({ label: "Shirts" });
  await page.getByLabel("Regular price", { exact: true }).fill("24000");
  await page
    .getByLabel("Product image", { exact: true })
    .setInputFiles(resolve(".e2e-data/proof.png"));
  await expect(
    page.getByAltText("Selected product image preview"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add size", exact: true }).click();
  await page.getByLabel("Size 1", { exact: true }).fill("42");
  await page
    .getByLabel("Color 1", { exact: true })
    .selectOption({ label: "White" });
  await page.getByLabel("Stock quantity 1", { exact: true }).fill("4");
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await fits(page);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Color theme").selectOption("dark");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("new-product-mobile-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/products\/\d+$/);
  await expect(page.locator(".admin-image img")).toHaveCount(1);
  await expect(page.getByText("Primary image", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Stock for 42 White", { exact: true }),
  ).toHaveValue("4");
  await fits(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("product-editor-mobile-dark.png"),
    fullPage: true,
  });
  const imageURL = await page.locator(".admin-image img").getAttribute("src");
  const context = await browser.newContext({
    baseURL: info.project.use.baseURL,
  });
  const shopper = await context.newPage();
  await shopper.goto(`/shop?search=${encodeURIComponent(name)}`);
  const card = shopper.locator(".product-card").filter({ hasText: name });
  await expect(card).toHaveCount(1);
  await expect(card.locator(".product-picture img")).toHaveAttribute(
    "src",
    imageURL,
  );
  expect(
    await card.locator(".product-picture img").evaluate(async (img) => {
      await img.decode();
      return img.naturalWidth;
    }),
  ).toBeGreaterThan(0);
  await shopper.goto(`/products/${slug}`);
  await expect(shopper.locator(".gallery-main img")).toHaveAttribute(
    "src",
    imageURL,
  );
  await expect(shopper.locator(".stock-label")).toContainText("4 available");
  await context.close();
  await page.getByLabel("Color theme").selectOption("light");
  for (const route of [
    "products",
    "inventory",
    "orders",
    "payments",
    "reports",
    "settings",
    "payment-settings",
  ]) {
    await page.goto(`/dashboard/${route}`);
    await expect(page.locator("#dashboard-content h1")).toBeVisible();
    await expect(
      page.locator("#dashboard-content [aria-busy='true']"),
    ).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 844 });
    await fits(page);
    await page.setViewportSize({ width: 768, height: 1000 });
    await fits(page);
    if (route === "products") {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(
        page.getByRole("button", { name: `Edit ${name}`, exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath("products-mobile.png"),
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
});
