import nodemailer from "nodemailer";

/** Mail is sent on the server only. Credentials and reset links are never logged. */
export async function sendPasswordResetEmail(email, resetUrl, mail, fetchImpl = fetch, createTransport = nodemailer.createTransport) {
  const subject = "ตั้งรหัสผ่าน Petory ใหม่";
  const text = `เปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่: ${resetUrl}\nหากคุณไม่ได้ขอเปลี่ยนรหัสผ่าน ให้ข้ามอีเมลนี้`;
  if (mail.provider === "gmail") {
    const transport = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: mail.gmailUser, pass: mail.gmailAppPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
    try {
      await transport.sendMail({ from: mail.from, to: email, subject, text });
    } catch {
      throw new Error("Password reset mail delivery failed");
    } finally {
      transport.close();
    }
    return;
  }
  if (mail.provider !== "resend") throw new Error("Password reset mail is not configured");
  const response = await fetchImpl(mail.apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mail.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mail.from,
      to: [email],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Password reset mail delivery failed");
}
