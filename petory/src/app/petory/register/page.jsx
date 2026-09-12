"use client";
import Link from "next/link";
import { sx } from "../ui";
import { usePetory } from "../context";

export default function RegisterPage() {
  const { state, onRegName, onRegEmail, onRegPassword, onRegConfirm, register } = usePetory();
  return (
    <div style={sx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#F4C9D6")}>
      <div style={sx("max-width:420px;width:100%")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,7vw,3.8rem);line-height:0.94;text-transform:uppercase;margin:0 0 12px")}>Join<br />Petory</h1>
        <p style={sx("font-size:15px;color:#3d2530;margin:0 0 28px")}>สร้างบัญชีเพื่อเริ่มหาเพื่อนให้สัตว์เลี้ยงของคุณ</p>
        <div style={sx("display:flex;flex-direction:column;gap:14px")}>
          <input placeholder="Name" value={state.registerForm.name} onChange={onRegName} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
          <input placeholder="Email" value={state.registerForm.email} onChange={onRegEmail} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
          <input placeholder="Password" type="password" value={state.registerForm.password} onChange={onRegPassword} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
          <input placeholder="Confirm Password" type="password" value={state.registerForm.confirm} onChange={onRegConfirm} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
          <button onClick={register} style={sx("margin-top:8px;background:#201C16;color:#F5F1E8;font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;padding:16px;border-radius:100px;border:none;cursor:pointer")}>Create Account</button>
          <div style={sx("text-align:center;font-size:14px;margin-top:6px")}>มีบัญชีอยู่แล้ว? <Link href="/petory/login" style={sx("text-decoration:underline;font-weight:700;cursor:pointer")}>Log In</Link></div>
        </div>
      </div>
    </div>
  );
}
