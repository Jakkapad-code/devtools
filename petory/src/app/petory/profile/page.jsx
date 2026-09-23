"use client";
import { sx, Hoverable, ImageSlot } from "../ui";
import { usePetory } from "../context";
import { visiblePosts, hashColor, categoryLabel, postTitle, avatarSrc, avatarInitial } from "../helpers";

export default function ProfilePage() {
  const { state: s, ...a } = usePetory();

  if (!s.sessionReady) {
    return (
      <div style={sx("max-width:1100px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
        <div style={sx(`display:grid;gap:24px;align-items:start;grid-template-columns:${s.isMobile ? "minmax(0,1fr)" : "320px minmax(0,1fr)"}`)}>
          <div style={sx("height:360px;border-radius:24px;background:#FFFFFFA0")} />
          <div style={sx("display:flex;flex-direction:column;gap:24px")}>
            <div style={sx("height:220px;border-radius:24px;background:#FFFFFFA0")} />
            <div style={sx("height:160px;border-radius:24px;background:#FFFFFFA0")} />
          </div>
        </div>
      </div>
    );
  }

  const me = s.users.find((u) => u.id === "me");
  const myPets = s.pets.filter((p) => p.ownerId === "me");
  const myPosts = visiblePosts(s).filter((p) => p.authorId === "me");
  const savedPosts = visiblePosts(s).filter((p) => p.saved);
  const blockedUsers = s.blockedUserIds.map((id) => s.users.find((u) => u.id === id));
  const displayName = s.user?.display_name || "";
  const handle = displayName ? "@" + displayName.toLowerCase().replace(/[^a-z]/g, "") : "";

  return (
    <div style={sx("max-width:1100px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <div style={sx(`display:grid;gap:24px;align-items:start;grid-template-columns:${s.isMobile ? "minmax(0,1fr)" : "320px minmax(0,1fr)"}`)}>
        {/* One column, so the safety card follows the profile card instead of
            being pushed down past the whole posts column. */}
        <div style={sx("display:flex;flex-direction:column;gap:24px;min-width:0")}>
          <div style={sx("background:#fff;border-radius:24px;overflow:hidden;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px")}>
            <div style={sx("height: 64px; background-color: #452A1E")} />
            <div style={sx("padding:0 28px 28px;display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:-46px")}>
              <label title="อัปโหลดรูปโปรไฟล์" style={sx("width:96px;height:96px;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 12px rgba(32,28,22,0.18);position:relative;cursor:pointer")}>
                {avatarSrc(s.user?.avatarMediaId)
                  ? <ImageSlot shape="circle" placeholder="" src={avatarSrc(s.user?.avatarMediaId)} style="width:100%;height:100%" />
                  : <div style={sx(`width:100%;height:100%;border-radius:50%;background:${s.user?.id ? hashColor(s.user.id) : "#E3402B"};display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Anton',sans-serif;font-size:38px`)}>{avatarInitial(displayName)}</div>}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={a.pickImage("avatar", 1)} disabled={s.avatarPhotoPending} style={{ display: "none" }} />
                <span style={sx("position:absolute;bottom:-5px;right:-5px;background:#E3402B;color:#fff;border-radius:100px;padding:4px 7px;font-size:10px;font-weight:800")}>{s.avatarPhotoPending ? "..." : "แก้ไข"}</span>
              </label>
              {displayName
                ? <h1 style={sx("font-family: 'Anton',sans-serif; font-size: 24px; text-transform: uppercase; margin: 14px 0 0; color: #452A1E")}>{displayName}</h1>
                : <div style={sx("width:140px;height:24px;border-radius:8px;background:#F1EDE4;margin-top:14px")} />}
              <div style={sx("font-size:13px;color:#8a8378;margin-top:4px")}>{handle} · {me.location}</div>
              <div style={sx("display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px")}>
                <span style={sx("background:#F4C9D6;color:#201C16;font-weight:700;font-size:12px;padding:6px 14px;border-radius:100px")}>เลี้ยงสัตว์ {myPets.length} ตัว</span>
                <span style={sx("background:#CFEEDB;color:#201C16;font-weight:700;font-size:12px;padding:6px 14px;border-radius:100px")}>สมาชิกตั้งแต่ {me.memberSince}</span>
              </div>
              <div style={sx("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%;margin-top:18px")}>
                <div style={sx("border-radius:14px;padding:10px 4px;text-align:center;box-shadow:0 2px 8px rgba(32,28,22,0.08);background-color:#FFFCF6")}>
                  <div style={sx("font-weight:800;font-size:17px;color:#E3402B")}>{myPosts.length}</div>
                  <div style={sx("font-size:12px;font-weight:700")}>โพสต์</div>
                </div>
                <div onClick={a.goFollowers} style={sx("border-radius:14px;padding:10px 4px;text-align:center;box-shadow:0 2px 8px rgba(32,28,22,0.08);background-color:#FFFCF6;cursor:pointer")}>
                  <div style={sx("font-weight:800;font-size:17px;color:#E3402B")}>{s.user?.followerCount ?? 0}</div>
                  <div style={sx("font-size:12px;font-weight:700")}>ผู้ติดตาม</div>
                </div>
                <div onClick={a.goFollowing} style={sx("border-radius:14px;padding:10px 4px;text-align:center;box-shadow:0 2px 8px rgba(32,28,22,0.08);background-color:#FFFCF6;cursor:pointer")}>
                  <div style={sx("font-weight:800;font-size:17px;color:#E3402B")}>{s.user?.followingCount ?? 0}</div>
                  <div style={sx("font-size:12px;font-weight:700")}>กำลังติดตาม</div>
                </div>
              </div>
            </div>
            <div style={sx("padding:0 28px 28px")}>
              <Hoverable as="button" onClick={a.goEditProfile} style="margin-top: 18px; width: 100%; border: none; color: #fff; border-radius: 100px; padding: 12px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(227,64,43,0.3); background-color: #DD3E2A" hoverStyle="background-color:#c8351f">แก้ไขข้อมูลคนเลี้ยง</Hoverable>
            </div>
          </div>
          <div style={sx("background:#fff;border-radius:24px;padding:28px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px")}>
            <div style={sx("font-family:'Anton',sans-serif;font-size:12px;letter-spacing:0.04em;color:#E3402B;margin-bottom:6px")}>ความปลอดภัย</div>
            <h2 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 16px")}>ผู้ใช้ที่ถูกบล็อก ({blockedUsers.length})</h2>
            {blockedUsers.length === 0 && <p style={sx("font-size:13px;color:#8a8378;margin:0")}>ยังไม่มีผู้ใช้ที่ถูกบล็อก</p>}
            <div style={sx("display:flex;flex-direction:column;gap:2px")}>
              {blockedUsers.map((bu) => (
                <div key={bu.id} style={sx("display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #ece7db")}>
                  <div style={sx(`width:28px;height:28px;border-radius:50%;background:${bu.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;flex:none`)}>{bu.name.charAt(0)}</div>
                  <span style={sx("flex:1;font-size:13px;font-weight:700")}>{bu.name}</span>
                  <span onClick={() => a.unblockUser(bu.id)} style={sx("color:#E3402B;font-weight:800;font-size:12px;cursor:pointer")}>ปลดบล็อก</span>
                </div>
              ))}
            </div>
            <p style={sx("font-size:12px;color:#8a8378;margin:16px 0 0")}>คนที่ถูกบล็อกจะไม่เห็นโพสต์ของคุณ และไม่ปรากฏในหน้าจับคู่</p>
          </div>
        </div>

        <div style={sx("display:flex;flex-direction:column;gap:24px;margin-top:24px")}>
          <div style={sx("background:#fff;border-radius:24px;padding:28px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px")}>
            <div style={sx("display:flex;align-items:center;justify-content:space-between;margin-bottom:16px")}>
              <h2 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0")}>โพสต์ของฉัน</h2>
              <span onClick={() => a.openCreatePost(false)} style={sx("color:#E3402B;font-weight:800;font-size:13px;cursor:pointer")}>+ สร้างโพสต์</span>
            </div>
            {myPosts.length === 0 && <p style={sx("font-size:14px;color:#8a8378;margin:0")}>ยังไม่มีโพสต์</p>}
            <div style={sx("display:flex;flex-direction:column")}>
              {myPosts.map((post) => (
                <div key={post.id} onClick={() => a.openPostDetail(post.id)} style={sx("display:flex;align-items:center;gap:14px;padding:14px 0;border-top:1px solid #ece7db;cursor:pointer")}>
                  <div style={sx(`width:44px;height:44px;border-radius:12px;background:${hashColor(post.id)};flex:none`)} />
                  <div style={sx("flex:1;min-width:0")}>
                    <div style={sx("font-weight:800;font-size:14px")}>{postTitle(post)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); a.openEditPost(post.id); }} style={sx("border:1px solid #201C16;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer")}>Edit</button>
                </div>
              ))}
            </div>
          </div>
          <div style={sx("background:#fff;border-radius:24px;padding:28px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px")}>
            <h2 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 16px")}>โพสต์ที่บันทึกไว้</h2>
            {savedPosts.length === 0 && <p style={sx("font-size:14px;color:#8a8378;margin:0")}>ยังไม่มีโพสต์ที่บันทึกไว้</p>}
            <div style={sx("display:flex;flex-direction:column")}>
              {savedPosts.map((post) => (
                <div key={post.id} onClick={() => a.openPostDetail(post.id)} style={sx("display:flex;align-items:center;gap:14px;padding:14px 0;border-top:1px solid #ece7db;cursor:pointer")}>
                  <div style={sx(`width:44px;height:44px;border-radius:12px;background:${hashColor(post.id)};flex:none`)} />
                  <div style={sx("flex:1;min-width:0")}>
                    <div style={sx("font-weight:800;font-size:14px")}>{postTitle(post)}</div>
                    <div style={sx("font-size:12px;color:#8a8378;margin-top:2px")}>{categoryLabel(post)} · {post.time} · ❤ {post.likes}</div>
                  </div>
                  <span style={sx("color:#E3402B;font-weight:800;font-size:13px;cursor:pointer")}>ดู</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
