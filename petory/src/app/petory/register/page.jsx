"use client";
import Link from "next/link";
import { sx } from "../ui";
import { usePetory } from "../context";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/schema";

export default function RegisterPage() {
  const { state, onRegName, onRegEmail, onRegPassword, onRegConfirm, register } = usePetory();
  const passwordTooShort = state.registerForm.password.length > 0 && state.registerForm.password.length < PASSWORD_MIN_LENGTH;
  return (
    <div style={sx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#F4C9D6")}>
      <div style={sx("max-width:420px;width:100%")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,7vw,3.8rem);line-height:0.94;text-transform:uppercase;margin:0 0 12px")}>Join<br />Petory</h1>
        <p style={sx("font-size:15px;color:#3d2530;margin:0 0 28px")}>สร้างบัญชีเพื่อเริ่มหาเพื่อนให้สัตว์เลี้ยงของคุณ</p>
        <div style={sx("display:flex;flex-direction:column;gap:14px")}>
          <input placeholder="Name" value={state.registerForm.name} onChange={onRegName} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
          <input placeholder="Email" value={state.registerForm.email} onChange={onRegEmail} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
          <div style={sx("display:flex;flex-direction:column;gap:6px")}>
            <input placeholder="Password" type="password" value={state.registerForm.password} onChange={onRegPassword} aria-describedby="password-hint" style={sx(`padding:16px;border-radius:14px;border:2px solid ${passwordTooShort ? "#B42318" : "#201C16"};font-size:15px;background:#fff`)} />
            <span id="password-hint" style={sx(`font-size:12px;padding-left:4px;font-weight:${passwordTooShort ? "700" : "600"};color:${passwordTooShort ? "#B42318" : "#3d2530"}`)}>
              รหัสผ่านต้องมีอย่างน้อย {PASSWORD_MIN_LENGTH} ตัวอักษร{passwordTooShort ? ` (ตอนนี้ ${state.registerForm.password.length} ตัว)` : ""}
            </span>
          </div>
          <input placeholder="Confirm Password" type="password" value={state.registerForm.confirm} onChange={onRegConfirm} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
          {state.authError && <p role="alert" style={sx("margin:0;color:#B42318;font-weight:700;font-size:13px")}>{state.authError}</p>}
          <button onClick={register} disabled={state.authPending} style={sx("margin-top:8px;background:#201C16;color:#F5F1E8;font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;padding:16px;border-radius:100px;border:none;cursor:pointer")}>{state.authPending ? "Creating account..." : "Create Account"}</button>
          <div style={sx("text-align:center;font-size:14px;margin-top:6px")}>มีบัญชีอยู่แล้ว? <Link href="/petory/login" style={sx("text-decoration:underline;font-weight:700;cursor:pointer")}>Log In</Link></div>
        </div>
      </div>
    </div>
  );
}
