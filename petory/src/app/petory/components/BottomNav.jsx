"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sx } from "../ui";

function bottomKeyFor(pathname) {
  if (pathname.startsWith("/petory/home")) return "home";
  if (pathname.startsWith("/petory/explore")) return "explore";
  if (pathname.startsWith("/petory/matching")) return "matching";
  if (pathname.startsWith("/petory/messages")) return "messages";
  if (pathname.startsWith("/petory/profile") || pathname.startsWith("/petory/pets")) return "profile";
  return null;
}

const pillSm = (active) => (active
  ? "background:#E3402B;color:#fff;padding:5px 11px;border-radius:12px 12px 4px 4px;display:inline-block;transition:all 0.2s ease"
  : "padding:5px 11px;border-radius:12px 12px 4px 4px;display:inline-block;color:#201C16;transition:all 0.2s ease");
const pawSm = (active) => (active
  ? "display:inline-block;margin-right:4px;animation:pawPulse 1s ease-in-out infinite;color:transparent;text-shadow:0 0 0 #F0C93B"
  : "display:none");

export default function BottomNav() {
  const pathname = usePathname();
  const activeKey = bottomKeyFor(pathname);

  const item = (key, label, href) => (
    <Link href={href} style={sx("font-weight:700;font-size:11px;letter-spacing:0.03em;text-transform:uppercase;cursor:pointer")}>
      <span style={sx(pillSm(activeKey === key))}><span style={sx(pawSm(activeKey === key))}>🐾</span>{label}</span>
    </Link>
  );

  return (
    <div style={sx("position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;align-items:center;background:#F5F1E8;border-top:2px solid #201C16;padding:10px 4px;z-index:40")}>
      {item("home", "Home", "/petory/home")}
      {item("explore", "Explore", "/petory/explore")}
      {item("matching", "Match", "/petory/matching")}
      {item("messages", "Chat", "/petory/messages")}
      {item("profile", "Profile", "/petory/profile")}
    </div>
  );
}
