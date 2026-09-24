import { test, expect } from "@playwright/test";

test("theme follows the system, persists overrides and keeps dark pages readable", async ({
  page,
}, info) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(20, 26, 32)",
  );
  await expect(page.locator("body")).toHaveCSS("color", "rgb(242, 243, 237)");
  await page.locator(".header-actions a[href='/search']").hover();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveCSS(
    "color",
    "rgb(242, 243, 237)",
  );
  await expect(page.locator(".hero-image img")).toHaveCSS("filter", "none");
  await page.getByLabel("Color theme").selectOption("light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Color theme").selectOption("system");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await expect(page.locator(".category-card")).toHaveCount(4);
  await page.locator("img").evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        image.loading = "eager";
        return image.decode().catch(() => {});
      }),
    ),
  );
  await page.screenshot({
    path: info.outputPath("dark-home.png"),
    fullPage: true,
  });
});

test("new product sizes publish together and stock updates reach an open storefront", async ({
  page,
  browser,
}, info) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("owner@e2e.example");
  await page
    .getByLabel("Password", { exact: true })
    .fill("E2e-only-Owner-493!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByLabel("Color theme").selectOption("dark");
  await page.goto("/dashboard/products/new");
  const slug = `size-stock-${Date.now()}`;
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Size stock shoes");
  await page.getByLabel("URL slug").fill(slug);
  await page
    .getByLabel("Category / subcategory")
    .selectOption({ label: "Shoes" });
  await page.getByLabel("Regular price", { exact: true }).fill("50000");
  for (const [index, size] of ["42", "43", "44", "45"].entries()) {
    await page.getByRole("button", { name: "Add size", exact: true }).click();
    await page.getByLabel(`Size ${index + 1}`, { exact: true }).fill(size);
    await page
      .getByLabel(`Color ${index + 1}`, { exact: true })
      .selectOption({ label: "Black" });
    await page
      .getByLabel(`Stock quantity ${index + 1}`, { exact: true })
      .fill(index === 2 ? "0" : "5");
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: info.outputPath("dark-product-form.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/products\/\d+$/);
  await expect(page.getByLabel("Stock for 42 Black")).toHaveValue("5");
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    colorScheme: "dark",
  });
  const shopper = await context.newPage();
  await shopper.goto(`/products/${slug}`);
  await expect(
    shopper.getByRole("button", { name: "Size 42", exact: true }),
  ).toBeEnabled();
  await expect(
    shopper.getByRole("button", { name: "Size 44 — unavailable", exact: true }),
  ).toBeDisabled();
  await shopper.getByRole("button", { name: "Size 42", exact: true }).click();
  await expect(shopper.locator(".stock-label")).toContainText("5 available");
  const row = page
    .locator("tr")
    .filter({ has: page.getByLabel("Stock for 42 Black") });
  await row.getByLabel("Stock for 42 Black").fill("0");
  await row.getByRole("button", { name: "Update stock" }).click();
  await expect(
    shopper.getByRole("button", { name: "Size 42 — unavailable", exact: true }),
  ).toBeDisabled({ timeout: 25000 });
  await expect(
    shopper.getByRole("button", { name: "Add to bag" }),
  ).toBeDisabled();
  await row.getByLabel("Stock for 42 Black").fill("8");
  await row.getByRole("button", { name: "Update stock" }).click();
  await expect(shopper.locator(".stock-label")).toContainText("8 available", {
    timeout: 25000,
  });
  await shopper.screenshot({
    path: info.outputPath("dark-product.png"),
    fullPage: true,
  });
  for (const size of ["42", "43", "45"]) {
    const stockRow = page
      .locator("tr")
      .filter({ has: page.getByLabel(`Stock for ${size} Black`) });
    await stockRow.getByLabel(`Stock for ${size} Black`).fill("0");
    await stockRow.getByRole("button", { name: "Update stock" }).click();
    await expect(stockRow.getByLabel(`Stock for ${size} Black`)).toHaveValue(
      "0",
    );
  }
  await expect(
    shopper.getByRole("button", { name: "Color: Black", exact: true }),
  ).toBeDisabled({ timeout: 25000 });
  await expect(
    shopper.getByRole("button", { name: "Add to bag" }),
  ).toBeDisabled();
  await context.close();
});
