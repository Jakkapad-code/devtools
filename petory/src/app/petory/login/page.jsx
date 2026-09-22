"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { sx, Hoverable, LOGO, DOG1, DOG2 } from "../ui";
import { usePetory } from "../context";

export default function LoginPage() {
  const { state, onLoginEmail, onLoginPassword, onToggleRemember, loadRememberedEmail, goForgot, loginBtnClick } = usePetory();

  useEffect(() => {
    loadRememberedEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={sx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;position:relative;overflow:hidden")}>
      <Image src={DOG1} alt="" width={591} height={420} aria-hidden="true" style={sx("position: fixed; width: 591px; height: 420px; z-index: 0; pointer-events: none; left: -161px; top: -30px; transform: rotate(120deg) scaleX(-1); transform-origin: 50% 50%")} />
      <Image src={DOG2} alt="" width={230} height={273} aria-hidden="true" style={sx("position: fixed; width: 230px; height: 273px; z-index: 0; pointer-events: none; right: -40px; bottom: -50px")} />
      <div style={sx("position:relative;z-index:1;max-width:420px;width:100%")}>
        <Image src={LOGO} alt="Petory" width={142} height={120} priority style={{ height: 120, width: "auto", display: "block", margin: "0 auto 20px" }} />
        <Hoverable
          as="h1"
          style="font-family:'Anton',sans-serif;font-size:clamp(2.6rem,8vw,4.2rem);line-height:0.94;text-transform:uppercase;margin:0 0 12px;cursor:default;transition:color 0.2s ease"
          hoverStyle="color:#E3402B;animation:loginTitleJump 0.5s ease"
        >
          Welcome Back !<br />
        </Hoverable>
          <div style={sx("display:flex;flex-direction:column;gap:14px;margin-top:24px")}>
            <input placeholder="Email" value={state.loginForm.email} onChange={onLoginEmail} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
            <input placeholder="Password" type="password" value={state.loginForm.password} onChange={onLoginPassword} style={sx("padding:16px;border-radius:14px;border:2px solid #201C16;font-size:15px;background:#fff")} />
            {state.authError && <p role="alert" style={sx("margin:0;color:#B42318;font-weight:700;font-size:13px")}>{state.authError}</p>}
          <div style={sx("display:flex;justify-content:space-between;align-items:center;font-size:13px")}>
            <label style={sx("display:flex;align-items:center;gap:6px;cursor:pointer")}><input type="checkbox" checked={state.rememberMe} onChange={onToggleRemember} /> Remember Me</label>
            <span onClick={goForgot} style={sx("text-decoration:underline;cursor:pointer;font-weight:600")}>Forgot Password?</span>
          </div>
          <Hoverable
            as="button"
            onClick={loginBtnClick}
            disabled={state.authPending}
            style={"margin-top:8px;background:#E3402B;color:#F5F1E8;font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;padding:16px;border-radius:100px;border:none;cursor:pointer;transition:transform 0.15s ease,box-shadow 0.15s ease;" + (state.loginBtnPop ? "animation:createPostPop 0.28s ease" : "")}
            hoverStyle="transform:translateY(-2px);box-shadow:0 6px 14px rgba(227,64,43,0.4)"
            activeStyle="transform:scale(0.95)"
          >
            {state.authPending ? "Logging in..." : "Log In"}
          </Hoverable>
          <div style={sx("text-align:center;font-size:14px;margin-top:6px")}>ยังไม่มีบัญชี? <Link href="/petory/register" style={sx("text-decoration:underline;font-weight:700;cursor:pointer;color:#E3402B")}>Register</Link></div>
        </div>
      </div>
    </div>
  );
}
