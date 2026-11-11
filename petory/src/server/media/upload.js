// Multipart includes boundaries and headers in addition to the file itself.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export class UploadError extends Error {
  constructor(message, status = 422) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

/** Bound the actual stream, not just the untrusted Content-Length header. */
export async function readUploadForm(request, maxFileBytes) {
  const maxBodyBytes = maxFileBytes + MULTIPART_OVERHEAD_BYTES;
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) {
    throw new UploadError("Invalid Content-Length", 400);
  }
  if (length !== null && Number(length) > maxBodyBytes) {
    throw new UploadError("Upload request is too large", 413);
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    throw new UploadError("Expected multipart form data", 400);
  }
  if (!request.body) throw new UploadError("An image file is required");

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBodyBytes) {
        // Do not wait on cancellation: some request streams wait for the peer.
        void reader.cancel().catch(() => {});
        throw new UploadError("Upload request is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const bounded = new Request("http://localhost/", {
      method: "POST",
      headers: { "content-type": contentType },
      body: new Blob(chunks),
    });
    return await bounded.formData();
  } catch {
    throw new UploadError("Invalid multipart form data", 400);
  }
}
