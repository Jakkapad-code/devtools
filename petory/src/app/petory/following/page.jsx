"use client";
import { sx } from "../ui";
import { usePetory } from "../context";
import { userById } from "../helpers";
import BackLink from "../components/BackLink";

export default function FollowingPage() {
  const { state: s, ...a } = usePetory();
  const followingUsers = s.followingIds.map((id) => userById(s, id));

  return (
    <div style={sx("max-width:700px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <BackLink fallbackHref="/petory/profile" style="font-weight:800;font-size:15px;color:#E3402B;cursor:pointer" />
      <div style={sx("background:#fff;border-radius:24px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px;padding:28px;margin-top:20px")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 16px")}>กำลังติดตาม ({followingUsers.length})</h1>
        {followingUsers.length === 0 && <p style={sx("font-size:14px;color:#8a8378;margin:0")}>คุณยังไม่ได้ติดตามใคร</p>}
        <div style={sx("display:flex;flex-direction:column")}>
          {followingUsers.map((fu) => (
            <div key={fu.id} style={sx("display:flex;align-items:center;gap:14px;padding:14px 0;border-top:1px solid #ece7db")}>
              <div onClick={() => a.openUserProfile(fu.id)} style={sx(`width:44px;height:44px;border-radius:50%;background:${fu.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;flex:none;cursor:pointer`)}>{fu.name.charAt(0)}</div>
              <div onClick={() => a.openUserProfile(fu.id)} style={sx("flex:1;min-width:0;cursor:pointer")}>
                <div style={sx("font-weight:800;font-size:14px")}>{fu.name}</div>
                <div style={sx("font-size:12px;color:#8a8378")}>{fu.location}</div>
              </div>
              <button onClick={() => a.unfollowUser(fu.id)} style={sx("border:1px solid #201C16;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer")}>เลิกติดตาม</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
