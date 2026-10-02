/** A small HTTP adapter keeps real delivery out of tests and client bundles. */
export async function sendPasswordResetEmail(email, resetUrl, mail, fetchImpl = fetch) {
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
      subject: "ตั้งรหัสผ่าน Petory ใหม่",
      text: `เปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่: ${resetUrl}\nหากคุณไม่ได้ขอเปลี่ยนรหัสผ่าน ให้ข้ามอีเมลนี้`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Password reset mail delivery failed");
}
