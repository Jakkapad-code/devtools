import { describe, expect, it, vi } from "vitest";
import { readUploadForm } from "./upload";

const maxBytes = 2 * 1024 * 1024;

function streamingRequest(chunks, headers = {}) {
  let index = 0;
  const cancel = vi.fn();
  const body = new ReadableStream({
    pull(controller) {
      if (index === chunks.length) return controller.close();
      controller.enqueue(chunks[index++]);
    },
    cancel,
  });
  return { request: new Request("http://localhost", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test", ...headers }, body, duplex: "half" }), cancel };
}

describe("bounded multipart uploads", () => {
  it("accepts a file at the 2 MiB limit including multipart overhead", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array(maxBytes)], "image.png", { type: "image/png" }));
    const request = new Request("http://localhost", { method: "POST", body: form });
    const result = await readUploadForm(request, maxBytes);
    expect(result.get("file").size).toBe(maxBytes);
  });
  it("rejects an oversized declared length before reading", async () => {
    const { request } = streamingRequest([], { "content-length": String(maxBytes + 65537) });
    await expect(readUploadForm(request, maxBytes)).rejects.toMatchObject({ status: 413 });
    expect(request.bodyUsed).toBe(false);
  });
  it.each([{}, { "content-length": "1" }])("bounds actual bytes even when length is absent or understated: %j", async (headers) => {
    const { request, cancel } = streamingRequest([new Uint8Array(maxBytes), new Uint8Array(65537)], headers);
    await expect(readUploadForm(request, maxBytes)).rejects.toMatchObject({ status: 413 });
    expect(cancel).toHaveBeenCalled();
  });
  it("rejects invalid Content-Length and malformed multipart", async () => {
    const invalidLength = streamingRequest([], { "content-length": "not-a-number" }).request;
    await expect(readUploadForm(invalidLength, maxBytes)).rejects.toMatchObject({ status: 400 });
    const invalidForm = streamingRequest([new TextEncoder().encode("garbage")]).request;
    await expect(readUploadForm(invalidForm, maxBytes)).rejects.toMatchObject({ status: 400 });
  });
});
