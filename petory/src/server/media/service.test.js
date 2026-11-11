import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/pool", () => ({ getPool: vi.fn(), query: vi.fn() }));
vi.mock("@/server/config/config.app", () => ({ getAppConfig: vi.fn() }));

import { getAppConfig } from "@/server/config/config.app";
import { readValidatedImage } from "./service";

describe("image validation", () => {
  beforeEach(() => getAppConfig.mockReturnValue({ maxMediaBytes: 2 * 1024 * 1024, acceptedMediaTypes: ["image/jpeg", "image/png", "image/webp"] }));
  it("accepts a PNG at the configured limit", async () => {
    const bytes = new Uint8Array(2 * 1024 * 1024);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const image = await readValidatedImage(new File([bytes], "a.png", { type: "image/png" }));
    expect(image.bytes.length).toBe(bytes.length);
    expect(image.mimeType).toBe("image/png");
  });
  it("rejects an oversized file and a spoofed MIME type", async () => {
    const tooLarge = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "a.png", { type: "image/png" });
    await expect(readValidatedImage(tooLarge)).rejects.toMatchObject({ status: 422 });
    const spoofed = new File(["not an image"], "a.png", { type: "image/png" });
    await expect(readValidatedImage(spoofed)).rejects.toMatchObject({ status: 422 });
  });
});
