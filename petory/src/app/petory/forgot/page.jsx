"use client";
import Link from "next/link";
import { sx } from "../ui";
import { usePetory } from "../context";

export default function ForgotPage() {
  const { sendResetLink } = usePetory();
  return (
    <div style={sx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#C9E3F5")}>
      <div style={sx("max-width:420px;width:100%;text-align:center")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,7vw,3.6rem);line-height:0.94;text-transform:uppercase;color:#2B5468;margin:0 0 12px")}>Forgot<br />Password?</h1>
        <p style={sx("font-size:15px;color:#2B5468;margin:0 0 28px")}>กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
        <div style={sx("display:flex;flex-direction:column;gap:14px")}>
          <input placeholder="Email" style={sx("padding:16px;border-radius:14px;border:2px solid #2B5468;font-size:15px;background:#fff")} />
          <button onClick={sendResetLink} style={sx("background:#2B5468;color:#fff;font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;padding:16px;border-radius:100px;border:none;cursor:pointer")}>Send Reset Link</button>
          <Link href="/petory/login" style={sx("text-decoration:underline;font-weight:700;cursor:pointer;color:#2B5468")}>Back to Log In</Link>
        </div>
      </div>
    </div>
  );
}
