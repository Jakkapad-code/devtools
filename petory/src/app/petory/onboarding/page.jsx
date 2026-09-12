"use client";
import Link from "next/link";
import { sx } from "../ui";
import { usePetory } from "../context";

export default function OnboardingPage() {
  const { goAddPet } = usePetory();
  return (
    <div style={sx("min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#201C16;color:#F5F1E8;text-align:center")}>
      <div style={sx("max-width:520px")}>
        <div style={sx("font-family:'Anton',sans-serif;font-size:14px;color:#E3402B;letter-spacing:0.1em;margin-bottom:16px")}>STEP 1 OF 1</div>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.6rem,8vw,4.4rem);line-height:0.94;text-transform:uppercase;margin:0 0 20px")}>Find Their<br />Next Best<br />Friend</h1>
        <p style={sx("font-size:16px;color:#cfc8bb;margin:0 0 36px")}>เพิ่มข้อมูลสัตว์เลี้ยงของคุณ แล้วเริ่มแชร์เรื่องราว หาเพื่อนใหม่ และค้นหาข้อมูลดีๆ ได้ทันที</p>
        <button onClick={goAddPet} style={sx("background:#E3402B;color:#F5F1E8;font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;padding:16px 36px;border-radius:100px;border:none;cursor:pointer")}>Add Your First Pet</button>
        <div style={sx("margin-top:18px")}><Link href="/petory/home" style={sx("color:#cfc8bb;text-decoration:underline;cursor:pointer;font-size:14px")}>ข้ามไปก่อน ทำทีหลัง</Link></div>
      </div>
    </div>
  );
}
