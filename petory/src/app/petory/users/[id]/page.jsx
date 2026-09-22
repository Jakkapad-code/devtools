"use client";
import { use, useEffect, useState } from "react";
import { sx, Hoverable } from "../../ui";
import { usePetory } from "../../context";
import { visiblePosts, hashColor, postTitle } from "../../helpers";
import BackLink from "../../components/BackLink";
import { socialClient } from "@/features/auth/client";

export default function UserProfilePage({ params }) {
  const { id } = use(params);
  const { state: s, ...a } = usePetory();
  // undefined while loading, null when the account does not exist.
  const [account, setAccount] = useState(undefined);
  const [pets, setPets] = useState([]);

  useEffect(() => {
    let active = true;
    void socialClient.user(id)
      .then(({ user, pets: ownedPets }) => {
        if (!active) return;
        setAccount(user);
        setPets(ownedPets.map((pet) => ({ ...pet, photo: hashColor(pet.id) })));
      })
      .catch(() => { if (active) setAccount(null); });
    return () => { active = false; };
  }, [id]);

  if (account === undefined) {
    return (
      <div style={sx("max-width:900px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
        <div style={sx("height:220px;border-radius:24px;background:#FFFFFFA0;margin-top:44px")} />
      </div>
    );
  }
  if (!account) return <div style={sx("max-width:900px;margin:0 auto;padding:48px;text-align:center")}>ไม่พบผู้ใช้นี้</div>;

  const u = { id: account.id, name: account.displayName, color: hashColor(account.id), bio: account.bio || "", location: account.locationLabel || "" };

  const posts = visiblePosts(s).filter((p) => p.authorId === u.id);
  const isFollowing = s.followingIds.includes(u.id);
  const isBlocked = s.blockedUserIds.includes(u.id);
  const followBtnStyle = isFollowing
    ? "border:1px solid #201C16;background:#fff;color:#201C16;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer"
    : "border:none;background:#E3402B;color:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer";

  return (
    <div style={sx("max-width:900px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <BackLink fallbackHref="/petory/home" style="font-weight:800;font-size:15px;color:#E3402B;cursor:pointer" />
      <div style={sx("background:#fff;border-radius:24px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px;padding:28px;margin-top:20px")}>
        <div style={sx("display:flex;align-items:center;gap:28px;margin-bottom:20px;flex-wrap:wrap")}>
          <div style={sx(`width:96px;height:96px;border-radius:50%;background:${u.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:32px;flex:none;border:3px solid #fff;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px`)}>{u.name.charAt(0)}</div>
          <div style={sx("flex:1;min-width:200px")}>
            <div style={sx("display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px")}>
              <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(1.6rem,4vw,2rem);text-transform:uppercase;margin:0")}>{u.name}</h1>
              <button onClick={() => a.toggleFollow(u.id)} style={sx(followBtnStyle)}>{isFollowing ? "กำลังติดตาม" : "+ ติดตาม"}</button>
              <button onClick={() => a.openReportUser(u.id)} style={sx("border:1px solid #201C16;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer")}>Report</button>
              <button onClick={() => (isBlocked ? a.unblockUser(u.id) : a.openBlock(u.id))} style={sx("border:1px solid #201C16;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer")}>{isBlocked ? "Unblock" : "Block"}</button>
            </div>
            <div style={sx("display:flex;gap:28px")}>
              <div><span style={sx("font-weight:800;font-size:16px")}>{posts.length}</span> <span style={sx("font-size:14px;color:#4a453c")}>โพสต์</span></div>
              <div><span style={sx("font-weight:800;font-size:16px")}>{pets.length}</span> <span style={sx("font-size:14px;color:#4a453c")}>สัตว์เลี้ยง</span></div>
            </div>
          </div>
        </div>
        <h2 style={sx("font-family:'Anton',sans-serif;font-size:16px;text-transform:uppercase;margin:0;padding-top:16px;border-top:1px solid #ece7db")}>สัตว์เลี้ยง</h2>
        <div style={sx("display:flex;flex-wrap:wrap;gap:20px;padding:16px 0 20px")}>
          {pets.map((pet) => (
            <div key={pet.id} onClick={() => a.openPetProfile(pet.id)} style={sx("display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;width:76px")}>
              <div style={sx(`width:64px;height:64px;border-radius:50%;background:${pet.photo};flex:none;border:2px solid #ece7db`)} />
              <span style={sx("font-weight:700;font-size:12px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%")}>{pet.name}</span>
            </div>
          ))}
        </div>
        {posts.length === 0 && <p style={sx("font-size:14px;color:#8a8378;margin:24px 0;text-align:center")}>ยังไม่มีโพสต์</p>}
        <div style={sx("border-top:1px solid #ece7db;display:flex;justify-content:flex-start;padding:14px 0;margin-bottom:2px")}>
          <span style={sx("font-weight: 800; font-size: 16px; letter-spacing: 0.05em; text-transform: uppercase; padding-bottom: 10px; margin-bottom: -15px; text-decoration-line: none")}>โพสต์</span>
        </div>
        <div style={sx("display:grid;grid-template-columns:repeat(3,1fr);gap:4px")}>
          {posts.map((post) => (
            <Hoverable key={post.id} onClick={() => a.openPostDetail(post.id)} style={`position: relative; aspect-ratio: 1; background: ${hashColor(post.id)}; cursor: pointer; overflow: hidden; display: flex; align-items: flex-end; padding: 10px; border-radius: 3px; opacity: 1`} hoverStyle="opacity:0.9">
              <span style={sx("color:#fff;font-weight:800;font-size:12px;line-height:1.3;text-shadow:0 1px 4px rgba(0,0,0,0.5)")}>{postTitle(post)}</span>
            </Hoverable>
          ))}
        </div>
      </div>
    </div>
  );
}
