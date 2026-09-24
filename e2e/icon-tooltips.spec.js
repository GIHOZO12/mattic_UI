import { test, expect } from "@playwright/test";

test("icon labels support hover, keyboard focus, dismissal and navigation", async ({
  page,
}) => {
  await page.goto("/");
  const tooltip = page.getByRole("tooltip");
  const search = page.locator(".header-actions a[href='/search']");
  await search.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText("Search");
  await expect(tooltip).toHaveCSS("background-color", "rgb(32, 42, 51)");
  await tooltip.hover();
  await page.waitForTimeout(200);
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();
  await search.focus();
  await expect(tooltip).toHaveText("Search");
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search$/);
  await expect(tooltip).not.toBeVisible();

  for (const [href, label] of [
    ["/account", "Login"],
    ["/wishlist", "Wishlist"],
    ["/cart", "Shopping bag"],
  ]) {
    await page.locator(`.header-actions a[href='${href}']`).hover();
    await expect(tooltip).toHaveText(label);
    await expect(tooltip).toBeVisible();
  }
  await page.goto("/shop");
  const wish = page.locator(".wish-button").first();
  await expect(wish).toBeEnabled();
  await wish.hover();
  await expect(tooltip).toHaveText("Save to wishlist");
  await expect(tooltip).toBeVisible();
});

test("mobile icon labels stay within the viewport and appear above dialogs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/shop");
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  await menu.focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  const bounds = await tooltip.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(8);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(352);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Close menu", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".filter-trigger").click();
  const close = page.getByRole("button", { name: "Close dialog" });
  await close.hover();
  await expect(tooltip).toHaveText("Close dialog");
  await expect(tooltip).toBeVisible();
  expect(await tooltip.evaluate((el) => el.matches(":popover-open"))).toBe(
    true,
  );
  await close.click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
