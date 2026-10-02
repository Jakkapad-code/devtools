import { describe, expect, it, vi } from "vitest";
import { sendPasswordResetEmail } from "./reset-mail";

const mail = { provider: "resend", apiUrl: "https://api.resend.com/emails", apiKey: "test-key", from: "hello@petory.test" };

describe("sendPasswordResetEmail", () => {
  it("sends a text-only reset email through the configured adapter", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    await sendPasswordResetEmail("aom@petory.test", "https://petory.test/reset?token=secret", mail, fetchImpl);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe(mail.apiUrl);
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(options.body)).toMatchObject({ from: mail.from, to: ["aom@petory.test"] });
    expect(JSON.parse(options.body).text).toContain("token=secret");
  });

  it("rejects disabled mail and provider failures without printing a reset link", async () => {
    await expect(sendPasswordResetEmail("aom@petory.test", "https://petory.test/reset", { ...mail, provider: "disabled" })).rejects.toThrow("not configured");
    await expect(sendPasswordResetEmail("aom@petory.test", "https://petory.test/reset", mail, vi.fn().mockResolvedValue({ ok: false }))).rejects.toThrow("delivery failed");
  });
});
