import { describe, expect, it } from "vitest";
import { demoPhotoByTitle, validateDemoPhotos } from "./demo-photos.mjs";

describe("recipe and clinic demo photos", () => {
  it("has six recipe and four clinic JPEG files with distinct contents", async () => {
    const files = [...demoPhotoByTitle.values()];
    expect(files.filter((file) => file.startsWith("recipe-"))).toHaveLength(6);
    expect(files.filter((file) => file.startsWith("clinic-"))).toHaveLength(4);
    expect(await validateDemoPhotos()).toBe(10);
  });
});
