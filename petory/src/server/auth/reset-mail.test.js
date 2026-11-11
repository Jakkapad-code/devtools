import { describe, expect, it, vi } from "vitest";
import { createServer } from "node:net";
import nodemailer from "nodemailer";
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

  it("sends Gmail mail through a local fake SMTP server, with TLS required in real configuration", async () => {
    let received = "";
    const server = createServer((socket) => {
      socket.write("220 localhost ESMTP\r\n");
      let pending = "";
      let inData = false;
      socket.on("data", (chunk) => {
        pending += chunk.toString();
        let newline;
        while ((newline = pending.indexOf("\r\n")) !== -1) {
          const line = pending.slice(0, newline);
          pending = pending.slice(newline + 2);
          if (inData) {
            if (line === ".") {
              inData = false;
              socket.write("250 Message accepted\r\n");
            } else received += `${line}\n`;
          } else if (/^EHLO /i.test(line)) socket.write("250-localhost\r\n250 AUTH PLAIN LOGIN\r\n");
          else if (/^AUTH PLAIN /i.test(line)) socket.write("235 Authentication successful\r\n");
          else if (/^(MAIL FROM|RCPT TO):/i.test(line)) socket.write("250 OK\r\n");
          else if (line === "DATA") { inData = true; socket.write("354 End with dot\r\n"); }
          else if (line === "QUIT") socket.end("221 Bye\r\n");
          else socket.write("500 Unsupported command\r\n");
        }
      });
    });
    await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
    try {
      const gmail = { provider: "gmail", from: "sender@gmail.com", gmailUser: "sender@gmail.com", gmailAppPassword: "fake-password" };
      const createTransport = vi.fn((options) => {
        expect(options).toMatchObject({ host: "smtp.gmail.com", port: 465, secure: true });
        return nodemailer.createTransport({ ...options, host: "127.0.0.1", port: server.address().port, secure: false, ignoreTLS: true });
      });
      await sendPasswordResetEmail("recipient@example.test", "https://petory.test/reset?token=test-token", gmail, fetch, createTransport);
      expect(received).toContain("recipient@example.test");
      const encodedBody = received.split("\n\n")[1];
      expect(Buffer.from(encodedBody.replaceAll("\n", ""), "base64").toString("utf8")).toContain("token=test-token");
      expect(createTransport).toHaveBeenCalledOnce();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("hides SMTP transport errors that may contain credentials", async () => {
    const close = vi.fn();
    const transport = { sendMail: vi.fn().mockRejectedValue(new Error("fake-secret")), close };
    await expect(sendPasswordResetEmail("a@b.test", "https://petory.test/reset", { provider: "gmail" }, fetch, () => transport))
      .rejects.toThrow(/^Password reset mail delivery failed$/);
    expect(close).toHaveBeenCalledOnce();
  });
});
