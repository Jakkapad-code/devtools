"use client";
import { useState } from "react";
import Link from "next/link";
import { sx } from "../ui";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      setMessage(response.ok
        ? "หากอีเมลนี้มีบัญชี เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้"
        : result.error || "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } catch {
      setMessage("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={sx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#C9E3F5")}>
      <div style={sx("max-width:420px;width:100%;text-align:center")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,7vw,3.6rem);line-height:0.94;text-transform:uppercase;color:#2B5468;margin:0 0 12px")}>Forgot<br />Password?</h1>
        <p style={sx("font-size:15px;color:#2B5468;margin:0 0 28px")}>กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
        <form onSubmit={submit} style={sx("display:flex;flex-direction:column;gap:14px")}>
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" style={sx("padding:16px;border-radius:14px;border:2px solid #2B5468;font-size:15px;background:#fff")} />
          <button type="submit" disabled={pending} style={sx("background:#2B5468;color:#fff;font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;padding:16px;border-radius:100px;border:none;cursor:pointer")}>{pending ? "กำลังส่ง..." : "Send Reset Link"}</button>
          {message && <p role="status" style={sx("color:#2B5468;font-size:14px;margin:0")}>{message}</p>}
          <Link href="/petory/login" style={sx("text-decoration:underline;font-weight:700;cursor:pointer;color:#2B5468")}>Back to Log In</Link>
        </form>
      </div>
    </div>
  );
}
