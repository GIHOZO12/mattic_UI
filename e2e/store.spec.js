import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

const email = `shopper-${Date.now()}@e2e.example`;
const password = "E2e-only-Shopper-839!";
async function login(page, owner = false) {
  await page.goto("/login");
  await page
    .getByLabel("Email address")
    .fill(owner ? "owner@e2e.example" : email);
  await page
    .getByLabel("Password", { exact: true })
    .fill(owner ? "E2e-only-Owner-493!" : password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(owner ? /\/dashboard$/ : /\/account$/);
}
async function noOverflow(page) {
  const metrics = await page.evaluate(() => ({
    width: innerWidth,
    actual: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll("main *")]
      .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
      .slice(0, 10)
      .map((e) => ({
        tag: e.tagName,
        class: e.className,
        right: e.getBoundingClientRect().right,
      })),
  }));
  expect(metrics.actual, JSON.stringify(metrics)).toBeLessThanOrEqual(
    metrics.width + 1,
  );
}

test("responsive storefront, real categories, search and protected routes", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "occasion.",
    );
    await expect(page.locator(".category-card")).toHaveCount(4);
    await page.locator(".hero-image img").evaluate((image) => image.decode());
    await noOverflow(page);
    if ([390, 1440].includes(width)) {
      await page.locator("img").evaluateAll((images) =>
        Promise.all(
          images.map((image) => {
            image.loading = "eager";
            return image.decode().catch(() => {});
          }),
        ),
      );
      await page.screenshot({
        path: info.outputPath(`home-${width}.png`),
        fullPage: true,
      });
    }
    await page.goto("/shop");
    const catalogResponse = await page.request.get("/api/v1/products/");
    const catalog = (await catalogResponse.json()).data;
    expect(catalog.results.length).toBeGreaterThan(0);
    await expect(page.locator(".product-card")).toHaveCount(
      catalog.results.length,
    );
    await noOverflow(page);
  }
  await page.goto("/search");
  await page
    .getByRole("searchbox", { name: "Search products" })
    .fill("zzzz-nothing-matches");
  await expect(
    page
      .getByText(
        /No pieces found|Nothing here|No results|No pieces match|No matches/i,
      )
      .first(),
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(errors).toEqual([]);
});

test("customer checkout, screenshot approval, fulfillment, review moderation and stock", async ({
  page,
  browser,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/register");
  await page.getByLabel("First name").fill("Browser");
  await page.getByLabel("Last name").fill("Customer");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Phone number").fill("+250788123456");
  await page.getByLabel("Password").fill(password);
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/dashboard");
  await expect(
    page
      .getByText(
        /This space is for store administrators|Access restricted|administrator|store owner/i,
      )
      .first(),
  ).toBeVisible();
  await page.goto("/products/classic-white-shirt");
  await expect(
    page.getByRole("heading", { name: "Classic White Shirt", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add to wishlist", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saved to wishlist" }),
  ).toBeVisible();
  const stockBefore = Number(
    (await page.locator(".stock-label").innerText()).match(
      /(\d+) available/,
    )[1],
  );
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(
    page.getByText("A good choice. Added to your bag."),
  ).toBeVisible();
  await page.goto("/cart");
  await expect(page.locator(".bag-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.locator(".quantity")).toContainText("2");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/checkout");
  await noOverflow(page);
  await page.getByRole("button", { name: "Add address" }).click();
  const dialog = page.getByRole("dialog");
  for (const [label, value] of [
    ["Full name", "Browser Customer"],
    ["Phone number", "+250788123456"],
    ["Province", "Kigali"],
    ["District", "Gasabo"],
    ["Sector", "Remera"],
    ["Street or landmark", "KG 123 Test Street"],
  ])
    await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByRole("button", { name: "Save address" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Review your order" }).click();
  await page
    .getByRole("button", { name: "Create order & continue to payment" })
    .click();
  await expect(page).toHaveURL(/\/payment\/\d+$/);
  const orderId = page.url().split("/").pop();
  await expect(
    page.getByText("DEMO DATA — DO NOT PAY", { exact: false }).first(),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("payment-mobile.png"),
    fullPage: true,
  });
  await page
    .getByLabel("Choose payment screenshot")
    .setInputFiles(resolve(".e2e-data/proof.png"));
  await page
    .getByLabel("Transaction reference (optional)")
    .fill(`E2E-${orderId}`);
  await page.getByRole("button", { name: "Submit payment proof" }).click();
  await expect(
    page.getByRole("heading", { name: "Payment submitted." }),
  ).toBeVisible();

  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: { width: 1440, height: 1000 },
  });
  const admin = await context.newPage();
  admin.on("pageerror", (error) => errors.push(error.message));
  admin.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await login(admin, true);
  await expect(
    admin.locator("#dashboard-content").getByRole("heading", { level: 1 }),
  ).toBeVisible();
  await admin.screenshot({
    path: info.outputPath("dashboard-desktop.png"),
    fullPage: true,
  });
  await admin.goto(`/dashboard/orders/${orderId}`);
  await admin.getByRole("link", { name: "View payment & screenshot" }).click();
  await expect(
    admin.getByAltText("Submitted payment screenshot"),
  ).toBeVisible();
  const paymentId = admin.url().split("/").pop();
  await admin
    .getByLabel("Verification / rejection note")
    .fill("E2E: isolated test payment approved.");
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
  await expect(
    admin.getByRole("button", { name: "Verify payment", exact: true }),
  ).toHaveCount(0);
  await admin.goto(`/dashboard/orders/${orderId}`);
  for (const status of ["processing", "shipped", "delivered"]) {
    await admin.getByRole("button", { name: `Mark as ${status}` }).click();
    await admin
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm", exact: true })
      .click();
    await expect(admin.getByRole("dialog")).not.toBeVisible();
  }
  await page.goto(`/account/orders/${orderId}`);
  await expect(page.locator(".order-progress")).toBeVisible();
  await noOverflow(page);
  await page.getByText("Review Classic White Shirt", { exact: true }).click();
  await page.getByLabel("Review title").fill(`Excellent fit ${orderId}`);
  await page
    .getByLabel("Tell us about your piece")
    .fill("The actual customer-to-admin flow is working.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(
    page.getByText("Thank you. Your review is waiting for approval."),
  ).toBeVisible();
  await admin.goto("/dashboard/reviews?is_approved=false");
  await admin
    .locator("tbody tr")
    .filter({ hasText: `Excellent fit ${orderId}` })
    .getByRole("button", { name: /Edit/ })
    .click();
  await admin.getByRole("dialog").getByLabel("Approved").check();
  await admin
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes" })
    .click();
  await expect(admin.getByRole("dialog")).not.toBeVisible();
  await page.goto("/products/classic-white-shirt");
  await expect(
    page.getByRole("heading", { name: `Excellent fit ${orderId}` }),
  ).toBeVisible();
  // Assertions hit the same real Django APIs using this browser's authenticated session.
  const state = await admin.evaluate(
    async ({ orderId, paymentId }) => {
      const { dashboardService } = await import("/src/api/services.js");
      const order = await dashboardService.detail("orders", orderId);
      const inventory = await dashboardService.detail(
        "inventory",
        order.items[0].variant,
      );
      await dashboardService.verify(paymentId, "Idempotency check");
      const after = await dashboardService.detail("inventory", inventory.id);
      return {
        status: order.status,
        paid: order.payment_status,
        deducted: order.stock_deducted,
        quantity: order.items[0].quantity,
        unchanged: inventory.stock_quantity === after.stock_quantity,
        remaining: inventory.stock_quantity,
      };
    },
    { orderId, paymentId },
  );
  expect(state).toMatchObject({
    status: "DELIVERED",
    paid: "PAID",
    quantity: 2,
    unchanged: true,
    remaining: stockBefore - 2,
  });
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin.goto("/dashboard");
  await expect(admin.getByRole("heading", { level: 1 })).toBeVisible();
  await noOverflow(admin);
  await admin.screenshot({
    path: info.outputPath("dashboard-mobile.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await context.close();
});

test("admin catalog CRUD saves and publishes real API data", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/dashboard/brands");
  await page.getByRole("button", { name: "Add brand" }).click();
  const name = `Browser Brand ${Date.now()}`;
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Brand name", { exact: true }).fill(name);
  await dialog
    .getByLabel("URL slug", { exact: true })
    .fill(name.toLowerCase().replaceAll(" ", "-"));
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  await dialog
    .getByLabel("Description")
    .fill("Edited through the React dashboard.");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: `Delete ${name}`, exact: true })
    .click();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("cell", { name, exact: true })).toHaveCount(0);
  for (const resource of [
    "products",
    "categories",
    "sizes",
    "colors",
    "inventory",
    "orders",
    "payments",
    "customers",
    "coupons",
    "reviews",
    "reports",
    "settings",
    "payment-settings",
  ]) {
    await page
      .locator(
        `nav[aria-label="Dashboard navigation"] a[href="/dashboard/${resource}"]`,
      )
      .click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/${resource}$`));
    await expect(
      page.locator("#dashboard-content").getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(page.locator(".error-state")).toHaveCount(0);
    await expect(page.getByText("This page needs a fresh start.")).toHaveCount(
      0,
    );
    await noOverflow(page);
  }
});
