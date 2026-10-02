"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sx } from "../ui";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (pending) return;
    if (password !== confirm) { setMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (response.ok) { setDone(true); setMessage("ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง"); }
      else setMessage(result.error || "ตั้งรหัสผ่านไม่สำเร็จ");
    } catch {
      setMessage("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={sx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#C9E3F5")}>
      <div style={sx("max-width:420px;width:100%;text-align:center")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,7vw,3.6rem);line-height:0.94;text-transform:uppercase;color:#2B5468;margin:0 0 12px")}>Reset<br />Password</h1>
        {!token && <p role="alert" style={sx("color:#A52B20")}>ลิงก์ตั้งรหัสผ่านไม่ถูกต้อง</p>}
        {token && !done && <form onSubmit={submit} style={sx("display:flex;flex-direction:column;gap:14px;margin-top:28px")}>
          <input type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="รหัสผ่านใหม่" style={sx("padding:16px;border-radius:14px;border:2px solid #2B5468;font-size:15px;background:#fff")} />
          <input type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="ยืนยันรหัสผ่านใหม่" style={sx("padding:16px;border-radius:14px;border:2px solid #2B5468;font-size:15px;background:#fff")} />
          <button type="submit" disabled={pending} style={sx("background:#2B5468;color:#fff;font-weight:800;font-size:15px;padding:16px;border-radius:100px;border:none;cursor:pointer")}>{pending ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}</button>
        </form>}
        {message && <p role="status" style={sx("color:#2B5468;font-size:14px;margin:18px 0")}>{message}</p>}
        <Link href="/petory/login" style={sx("display:inline-block;margin-top:16px;text-decoration:underline;font-weight:700;color:#2B5468")}>กลับไปหน้าเข้าสู่ระบบ</Link>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return <Suspense fallback={<div style={sx("min-height:100vh;background:#C9E3F5")} />}><ResetForm /></Suspense>;
}
