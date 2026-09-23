"use client";
import { useEffect, useState } from "react";
import { sx, ImageSlot } from "../ui";
import { usePetory } from "../context";
import BackLink from "../components/BackLink";
import { socialClient } from "@/features/auth/client";

export default function FollowersPage() {
  const a = usePetory();
  const [followers, setFollowers] = useState([]);
  useEffect(() => { let active = true; void socialClient.followers().then(({ users }) => { if (active) setFollowers(users.map((user) => ({ id: user.id, name: user.displayName, location: user.locationLabel || "", avatarSrc: user.avatarMediaId ? `/api/media/${user.avatarMediaId}` : undefined, following: user.following, color: "#2B5468" }))); }).catch(() => { if (active) setFollowers([]); }); return () => { active = false; }; }, []);

  return (
    <div style={sx("max-width:700px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <BackLink fallbackHref="/petory/home" style="font-weight:800;font-size:15px;color:#E3402B;cursor:pointer" />
      <div style={sx("background:#fff;border-radius:24px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px;padding:28px;margin-top:20px")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 16px")}>ผู้ติดตาม ({followers.length})</h1>
        {followers.length === 0 && <p style={sx("font-size:14px;color:#8a8378;margin:0")}>ยังไม่มีใครติดตามคุณ</p>}
        <div style={sx("display:flex;flex-direction:column")}>
          {followers.map((fu) => (
            <div key={fu.id} style={sx("display:flex;align-items:center;gap:14px;padding:14px 0;border-top:1px solid #ece7db")}>
              <div onClick={() => a.openUserProfile(fu.id)} style={sx(`width:44px;height:44px;border-radius:50%;background:${fu.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;flex:none;cursor:pointer;overflow:hidden`)}>{fu.avatarSrc ? <ImageSlot shape="circle" placeholder="" src={fu.avatarSrc} style="width:100%;height:100%" /> : fu.name.charAt(0)}</div>
              <div onClick={() => a.openUserProfile(fu.id)} style={sx("flex:1;min-width:0;cursor:pointer")}>
                <div style={sx("font-weight:800;font-size:14px")}>{fu.name}</div>
                <div style={sx("font-size:12px;color:#8a8378")}>{fu.location}</div>
              </div>
              {!fu.following && (
                <button onClick={async () => { await a.toggleFollow(fu.id); setFollowers((users) => users.map((user) => user.id === fu.id ? { ...user, following: true } : user)); }} style={sx("border:1px solid #201C16;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer")}>ติดตามกลับ</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
