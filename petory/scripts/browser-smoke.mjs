import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/** Exercise the actual forms and image rendering against the disposable integration DB. */
export async function runBrowserSmoke(baseUrl) {
  const browser = await chromium.launch(process.platform === "darwin" ? { channel: "chrome" } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, permissions: ["geolocation"], geolocation: { latitude: 13.75, longitude: 100.50 } });
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
    const photoInput = page.locator('label[title="อัปโหลดรูปสัตว์เลี้ยง"] input[type="file"]');
    const uploadPhoto = async (index) => {
      await photoInput.setInputFiles(imagePath);
      await page.getByRole("button", { name: "ใช้รูปนี้" }).click();
      await page.getByTestId("pet-gallery-item").nth(index).waitFor();
      if (index < 4) await page.waitForFunction(() => !document.querySelector('label[title="อัปโหลดรูปสัตว์เลี้ยง"] input[type="file"]').disabled);
    };
    for (let index = 0; index < 5; index += 1) await uploadPhoto(index);
    assert.equal(await page.getByTestId("pet-gallery-item").count(), 5);
    assert.equal(await photoInput.isDisabled(), true, "the sixth photo must not be selectable");
    const galleryIds = async () => page.getByTestId("pet-gallery-item").evaluateAll((items) => items.map((item) => {
      const image = item.firstElementChild?.style.backgroundImage ?? "";
      return image.match(/\/api\/media\/([0-9a-f-]+)/)?.[1];
    }));
    const before = await galleryIds();
    assert(before.every(Boolean));
    assert.equal(new Set(before).size, 5);
    await page.getByTestId("pet-gallery-item").nth(4).getByRole("button", { name: "ตั้งรูปหลัก" }).click();
    assert.equal((await galleryIds())[0], before[4]);
    const removedId = (await galleryIds())[4];
    await page.getByTestId("pet-gallery-item").nth(4).getByRole("button", { name: "ลบ" }).click();
    assert.equal(await page.getByTestId("pet-gallery-item").count(), 4);
    assert(!(await galleryIds()).includes(removedId));
    await uploadPhoto(4);
    const expectedPhotos = await galleryIds();
    await page.getByPlaceholder("เช่น Mochi").fill("Browser Pet");
    await page.getByPlaceholder("Shiba Inu").fill("Mixed");
    await page.getByPlaceholder("ปี").fill("2");
    await page.getByRole("button", { name: "Save Pet" }).click();
    await page.waitForURL("**/petory/pets");
    assert.equal(await page.getByText("Browser Pet", { exact: true }).count(), 1);
    const pets = await (await page.request.get(`${baseUrl}/api/pets`)).json();
    const savedPet = pets.pets.find((pet) => pet.name === "Browser Pet");
    assert.deepEqual(savedPet.photoMediaIds, expectedPhotos);
    assert.equal(savedPet.photoMediaId, before[4]);
    await page.goto(`${baseUrl}/petory/pets/${savedPet.id}`);
    for (const id of expectedPhotos) assert.equal((await page.request.get(`${baseUrl}/api/media/${id}`)).status(), 200);

    // Wait for the client component to hydrate before clicking; a visible SSR
    // button can otherwise receive a click before React attaches its handler.
    const [initialLocation] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith("/api/matching/location") && response.request().method() === "GET"),
      page.goto(`${baseUrl}/petory/matching`),
    ]);
    assert.equal(initialLocation.status(), 200, "could not load location sharing state");
    const [shareResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith("/api/matching/location") && response.request().method() === "PUT"),
      page.getByRole("button", { name: "ยินยอมแชร์ตำแหน่ง" }).click(),
    ]);
    assert.equal(shareResponse.status(), 200, `sharing location failed: ${await shareResponse.text()}`);
    assert.equal((await shareResponse.json()).shared, true);
    await page.getByRole("button", { name: "หยุดแชร์ตำแหน่ง" }).waitFor();
    assert.equal((await (await page.request.get(`${baseUrl}/api/matching/location`)).json()).shared, true);
    const [revokeResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith("/api/matching/location") && response.request().method() === "PUT"),
      page.getByRole("button", { name: "หยุดแชร์ตำแหน่ง" }).click(),
    ]);
    assert.equal(revokeResponse.status(), 200, `revoking location failed: ${await revokeResponse.text()}`);
    assert.equal((await revokeResponse.json()).shared, false);
    await page.getByRole("button", { name: "ยินยอมแชร์ตำแหน่ง" }).waitFor();
    assert.equal((await (await page.request.get(`${baseUrl}/api/matching/location`)).json()).shared, false);

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

/** Open the emailed link without a session and complete the reset form. */
export async function runPasswordResetSmoke(baseUrl, token, password) {
  const browser = await chromium.launch(process.platform === "darwin" ? { channel: "chrome" } : {});
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20_000);
    await page.goto(`${baseUrl}/petory/reset?token=${encodeURIComponent(token)}`);
    await page.getByPlaceholder("รหัสผ่านใหม่", { exact: true }).fill(password);
    await page.getByPlaceholder("ยืนยันรหัสผ่านใหม่").fill(password);
    await page.getByRole("button", { name: "ตั้งรหัสผ่านใหม่" }).click();
    await page.getByText("ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง").waitFor();
  } finally {
    await browser.close();
  }
}

/** Unmatch must persist on the server; cancellation/errors must leave the room intact. */
export async function runUnmatchSmoke(baseUrl, conversationId) {
  const browser = await chromium.launch(process.platform === "darwin" ? { channel: "chrome" } : {});
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20_000);
    await page.goto(`${baseUrl}/petory/login`);
    await page.getByPlaceholder("Email").fill("aom@petory.local");
    await page.getByPlaceholder("Password").fill("petory-demo-password-2026");
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL("**/petory/home");
    await page.goto(`${baseUrl}/petory/messages/${conversationId}`);
    const button = page.getByRole("button", { name: "ยกเลิก Match", exact: true });
    await button.waitFor();

    page.once("dialog", dialog => dialog.dismiss());
    await button.click();
    assert.equal((await page.request.get(`${baseUrl}/api/conversations/${conversationId}/messages`)).status(), 200);

    await page.route("**/api/matching/matches/*", route => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Simulated unmatch failure" }) }));
    page.once("dialog", dialog => dialog.accept());
    await button.click();
    await page.getByText("Simulated unmatch failure").waitFor();
    assert.equal((await page.request.get(`${baseUrl}/api/conversations/${conversationId}/messages`)).status(), 200);
    await page.unroute("**/api/matching/matches/*");

    page.once("dialog", dialog => dialog.accept());
    await button.click();
    await page.waitForURL(`${baseUrl}/petory/messages`);
    await page.reload();
    assert.equal((await page.request.get(`${baseUrl}/api/conversations/${conversationId}/messages`)).status(), 404);
    await mkdir("test-results", { recursive: true });
    await page.screenshot({ path: "test-results/unmatched.png", fullPage: true });
  } finally {
    await browser.close();
  }
}
