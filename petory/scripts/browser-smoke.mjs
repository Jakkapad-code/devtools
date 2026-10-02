import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/** Exercise the actual forms and image rendering against the disposable integration DB. */
export async function runBrowserSmoke(baseUrl) {
  const browser = await chromium.launch(process.platform === "darwin" ? { channel: "chrome" } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(20_000);
    const email = `browser-${randomUUID()}@petory.local`;
    const imagePath = "public/uploads/demo/recipe-dog-biscuits.jpg";

    await page.goto(`${baseUrl}/petory/register`);
    await page.getByPlaceholder("Name").fill("Browser Tester");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill("browser-test-password-2026");
    await page.getByPlaceholder("Confirm Password").fill("browser-test-password-2026");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("**/petory/onboarding");

    await page.getByRole("button", { name: "Add Your First Pet" }).click();
    await page.waitForURL("**/petory/pets/new");
    await page.locator('label[title="อัปโหลดรูปสัตว์เลี้ยง"] input[type="file"]').setInputFiles(imagePath);
    await page.getByRole("button", { name: "ใช้รูปนี้" }).click();
    await page.getByPlaceholder("เช่น Mochi").fill("Browser Pet");
    await page.getByPlaceholder("Shiba Inu").fill("Mixed");
    await page.getByPlaceholder("ปี").fill("2");
    await page.getByRole("button", { name: "Save Pet" }).click();
    await page.waitForURL("**/petory/pets");
    assert.equal(await page.getByText("Browser Pet", { exact: true }).count(), 1);

    await page.goto(`${baseUrl}/petory/explore`);
    await page.getByRole("button", { name: "+ สร้างโพสต์" }).click();
    await page.getByPlaceholder("หัวข้อเรื่อง").fill("Browser test post");
    await page.getByPlaceholder("เขียนแคปชั่น...").fill("Post created through the browser E2E flow.");
    await page.locator('label[title="อัปโหลดรูปประกอบโพสต์"] input[type="file"]').setInputFiles(imagePath);
    await page.getByRole("button", { name: "ใช้รูปนี้" }).click();
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await page.getByTestId("category-tips").click();
    await page.getByText("Browser test post", { exact: true }).waitFor();
    await page.getByText("โพสต์เรียบร้อยแล้ว!").waitFor({ state: "hidden" });

    await mkdir("test-results", { recursive: true });
    for (const [category, expected] of [["recipe", 6], ["clinic", 4]]) {
      await page.getByTestId(`category-${category}`).click();
      const cards = page.getByTestId("explore-card");
      await cards.first().waitFor();
      await page.waitForFunction((count) => document.querySelectorAll('[data-testid="explore-card"]').length === count, expected);
      const urls = await cards.evaluateAll((nodes) => nodes.map((node) => {
        const background = node.firstElementChild?.firstElementChild?.style.background ?? "";
        return background.match(/\/api\/media\/[0-9a-f-]+/)?.[0];
      }));
      assert.equal(urls.length, expected);
      assert(urls.every(Boolean), `${category} includes a card without a photo`);
      assert.equal(new Set(urls).size, expected, `${category} repeats a photo`);
      const imagesLoaded = await page.evaluate(async (photoUrls) => Promise.all(photoUrls.map(async (url) => {
        const response = await fetch(url);
        return response.ok && (await response.blob()).size > 0;
      })), urls);
      assert(imagesLoaded.every(Boolean), `${category} contains an image that cannot be loaded`);
      await page.screenshot({ path: `test-results/explore-${category}.png`, fullPage: true });
    }
  } finally {
    await browser.close();
  }
}

/** Check that DB-backed social/admin state survives a fresh browser login and reload. */
export async function runAuthenticatedView(baseUrl, { email, path, text, screenshot }) {
  const browser = await chromium.launch(process.platform === "darwin" ? { channel: "chrome" } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(20_000);
    await page.goto(`${baseUrl}/petory/login`);
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill("petory-demo-password-2026");
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL(/\/petory\/(home|admin)$/);
    await page.goto(`${baseUrl}${path}`);
    await page.getByText(text, { exact: false }).first().waitFor();
    await page.reload();
    await page.getByText(text, { exact: false }).first().waitFor();
    if (screenshot) {
      await mkdir("test-results", { recursive: true });
      await page.screenshot({ path: `test-results/${screenshot}.png`, fullPage: true });
    }
  } finally {
    await browser.close();
  }
}
