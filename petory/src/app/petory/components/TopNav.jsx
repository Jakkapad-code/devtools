"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { sx } from "../ui";
import { LOGO } from "../ui";
import { usePetory } from "../context";

function topKeyFor(pathname) {
  if (pathname.startsWith("/petory/home")) return "home";
  if (pathname.startsWith("/petory/explore")) return "explore";
  if (pathname.startsWith("/petory/matching")) return "matching";
  if (pathname.startsWith("/petory/messages")) return "messages";
  if (pathname.startsWith("/petory/pets")) return "myPets";
  return null;
}

const pill = (active) => (active
  ? "background:#E3402B;color:#fff;padding:7px 15px;border-radius:16px 16px 6px 6px;display:inline-block;transition:all 0.2s ease"
  : "padding:7px 15px;border-radius:16px 16px 6px 6px;display:inline-block;color:#201C16;transition:all 0.2s ease");
const paw = (active) => (active
  ? "display:inline-block;margin-right:5px;animation:pawPulse 1s ease-in-out infinite;color:transparent;text-shadow:0 0 0 #F0C93B"
  : "display:none");

export default function TopNav() {
  const pathname = usePathname();
  const { openLogoutConfirm } = usePetory();
  const activeKey = topKeyFor(pathname);

  const item = (key, label, href) => (
    <Link href={href} style={sx("font-weight:700;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer")}>
      <span style={sx(pill(activeKey === key))}><span style={sx(paw(activeKey === key))}>🐾</span>{label}</span>
    </Link>
  );

  return (
    <nav style={sx("display:flex;align-items:center;gap:12px;padding:16px clamp(16px,2.5vw,32px);background:#F5F1E8;position:sticky;top:0;z-index:40;flex-wrap:nowrap;box-shadow:rgba(0,0,0,0.16) 0px 3px 6px, rgba(0,0,0,0.23) 0px 3px 6px")}>
      <Link href="/petory/home" style={sx("display:flex;align-items:center;gap:8px;cursor:pointer;flex:none")}>
        <Image src={LOGO} alt="Petory" width={55} height={46} style={{ height: 46, width: "auto" }} priority />
      </Link>
      <div style={sx("display:flex;align-items:center;gap:10px;flex:none;margin-left:16px")}>
        {item("home", "Home", "/petory/home")}
        {item("explore", "Explore", "/petory/explore")}
        {item("matching", "Matching", "/petory/matching")}
        {item("messages", "Messages", "/petory/messages")}
        {item("myPets", "My Pets", "/petory/pets")}
      </div>
      <div style={sx("display:flex;align-items:center;gap:10px;flex:none;margin-left:auto")}>
        <Link href="/petory/profile" style={sx("width:32px;height:32px;border-radius:50%;border:2px solid #201C16;overflow:hidden;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;background:#F5F1E8")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#201C16" strokeWidth="2" /><path d="M4.5 19.5c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" stroke="#201C16" strokeWidth="2" strokeLinecap="round" /></svg>
        </Link>
        <button onClick={openLogoutConfirm} style={sx("color: #FFFFFF; font-weight: 800; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; padding: 10px 18px; border-radius: 100px; border: 2px solid #201C16; cursor: pointer; background-color: #E4412C; border-color: #000000")}>Logout</button>
      </div>
    </nav>
  );
}
