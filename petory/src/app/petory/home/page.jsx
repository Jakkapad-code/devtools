"use client";
import { sx, Hoverable, ImageSlot } from "../ui";
import { usePetory } from "../context";
import { visiblePosts, mapPost, hashColor, withRecommended, avatarSrc } from "../helpers";
import HomePostCard from "../components/HomePostCard";

export default function HomePage() {
  const { state: s, ...a } = usePetory();

  if (!s.sessionReady) {
    return (
      <div style={sx("max-width: 100%; margin: 0 auto; padding: clamp(20px,4vw,40px) clamp(20px,4vw,32px) 140px; display: flex; flex-wrap: wrap; justify-content: center; gap: 28px; align-items: flex-start; background-color: #FAF7EFF0")}>
        <div style={sx("flex: 1 1 440px; max-width: 620px; min-width: 0; display: flex; flex-direction: column; gap: 22px")}>
          {[0, 1, 2].map((i) => <div key={i} style={sx("height:260px;border-radius:22px;background:#FFFFFFA0")} />)}
        </div>
        <aside style={sx("flex: 0 1 360px; min-width: 0; max-width: 380px; display: flex; flex-direction: column; gap: 20px; align-self: flex-start; position: sticky; top: 88px")}>
          <div style={sx("height:150px;border-radius:22px;background:#FFFFFFA0")} />
        </aside>
      </div>
    );
  }

  const storyPosts = visiblePosts(s).filter((p) => p.category === "story");
  const homePosts = withRecommended(s, storyPosts).map((p) => mapPost(s, a, p)).map((p) => ({
    ...p,
    likeFill: p.liked ? "#E3402B" : "none", saveFill: p.saved ? "#E3402B" : "none",
    commentsOpen: s.openComments.includes(p.id),
    commentsToggleLabel: s.openComments.includes(p.id) ? "ซ่อนความคิดเห็น" : "แสดงความคิดเห็น",
    commentDraft: s.commentDrafts[p.id] || "",
    comments: p.comments.map((c) => ({ ...c, initial: c.user.charAt(0) })),
    onToggleComments: () => a.toggleComments(p.id),
    onCommentChange: (e) => a.onCommentDraft(p.id, e),
    onCommentKeyDown: (e) => { if (e.key === "Enter") a.submitComment(p.id); },
    onCommentSubmit: () => a.submitComment(p.id),
  }));

  const myPostsCount = visiblePosts(s).filter((p) => p.authorId === "me").length;
  const displayName = s.user?.display_name || "";
  const avatarColor = s.user?.id ? hashColor(s.user.id) : "#E3402B";
  const homeProfile = { name: displayName, handle: displayName ? "@" + displayName.toLowerCase().replace(/[^a-z]/g, "") : "", color: avatarColor, avatarSrc: avatarSrc(s.user?.avatarMediaId), posts: myPostsCount, followers: s.user?.followerCount ?? 0, following: s.user?.followingCount ?? 0 };
  const trendingTags = ["อาหาร", "Pet Friendly", "การฝึก", "สุขภาพ", "มือใหม่"];
  const suggestedOwners = s.suggestedUsers.slice(0, 3).map((u) => ({ id: u.id, name: u.displayName, initial: u.displayName.charAt(0), color: hashColor(u.id), avatarSrc: avatarSrc(u.avatarMediaId) }));
  const createPostBtnAnim = s.createPostBtnPop ? "animation:createPostPop 0.28s ease" : "";

  return (
    <div style={sx("max-width: 100%; margin: 0 auto; padding: clamp(20px,4vw,40px) clamp(20px,4vw,32px) 140px; display: flex; flex-wrap: wrap; justify-content: center; gap: 28px; align-items: flex-start; background-color: #FAF7EFF0")}>
      <div style={sx("flex: 1 1 440px; max-width: 620px; min-width: 0; display: flex; flex-direction: column; gap: 34px")}>
        <div style={sx("display:flex;flex-direction:column;gap:22px")}>
          {homePosts.map((post) => <HomePostCard key={post.id} post={post} />)}
        </div>
      </div>
      {/* The offset is a margin, not a transform: flex can then wrap the column
          instead of letting it hang past the viewport on narrow screens. */}
      <aside style={sx(`flex: 0 1 360px; min-width: 0; max-width: 380px; display: flex; flex-direction: column; gap: 20px; align-self: flex-start; position: sticky; top: 88px; padding: 14px; margin-top: -14px; margin-right: -14px; margin-bottom: -14px; margin-left: ${s.isMobile ? "-14px" : "90px"}`)}>
        <div style={sx("border: none; border-radius: 22px; padding: 20px; background-color: #FFFFFFED; box-shadow: rgba(0, 0, 0, 0.25) 0px 0.0625em 0.0625em, rgba(0, 0, 0, 0.25) 0px 0.125em 0.5em, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset")}>
          <div onClick={a.goProfile} style={sx("display:flex;align-items:center;gap:12px;margin-bottom:16px;cursor:pointer")}>
            <div style={sx(`width:48px;height:48px;border-radius:50%;background:${homeProfile.color};flex:none;overflow:hidden;box-shadow:0 2px 8px rgba(32,28,22,0.08)`)}>
              {homeProfile.avatarSrc && <ImageSlot shape="circle" placeholder="" src={homeProfile.avatarSrc} style="width:100%;height:100%" />}
            </div>
            <div style={sx("min-width:0")}>
              {homeProfile.name
                ? <div style={sx("font-weight:800;font-size:15px")}>{homeProfile.name}</div>
                : <div style={sx("width:96px;height:15px;border-radius:6px;background:#EFEAE2")} />}
              <div style={sx("font-size:13px;color:#8a8378")}>{homeProfile.handle}</div>
            </div>
          </div>
          <div style={sx("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px")}>
            <div style={sx("border-radius: 14px; padding: 10px 4px; text-align: center; box-shadow: 0 2px 8px rgba(32,28,22,0.08); background-color: #EFEAE2")}>
              <div style={sx("font-weight: 800; font-size: 17px; color: #7C6510")}>{homeProfile.posts}</div>
              <div style={sx("font-size:12px;font-weight:700")}>โพสต์</div>
            </div>
            <div onClick={a.goFollowers} style={sx("border-radius: 14px; padding: 10px 4px; text-align: center; box-shadow: 0 2px 8px rgba(32,28,22,0.08); background-color: #EFEAE2; cursor: pointer")}>
              <div style={sx("font-weight: 800; font-size: 17px; color: #7C6510")}>{homeProfile.followers}</div>
              <div style={sx("font-size:12px;font-weight:700")}>ผู้ติดตาม</div>
            </div>
            <div onClick={a.goFollowing} style={sx("border-radius: 14px; padding: 10px 4px; text-align: center; box-shadow: 0 2px 8px rgba(32,28,22,0.08); background-color: #EFEAE2; cursor: pointer")}>
              <div style={sx("font-weight: 800; font-size: 17px; color: #7C6510")}>{homeProfile.following}</div>
              <div style={sx("font-size:12px;font-weight:700")}>ติดตาม</div>
            </div>
          </div>
        </div>

        <div style={sx("border: none; border-radius: 22px; padding: 20px; background-color: #FFFFFFED; box-shadow: rgba(0, 0, 0, 0.25) 0px 0.0625em 0.0625em, rgba(0, 0, 0, 0.25) 0px 0.125em 0.5em, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset")}>
          <div style={sx("font-weight:800;font-size:15px;margin-bottom:14px")}>กำลังเป็นที่นิยม</div>
          <div style={sx("display:flex;flex-wrap:wrap;gap:10px;justify-content:center")}>
            {trendingTags.map((tag, i) => (
              <Hoverable key={i} as="span" onClick={a.goExplore} style="background:#FFFFFF;color:#2B2B2B;border:none;border-radius:100px;padding:9px 16px;box-shadow:0 2px 8px rgba(32,28,22,0.08);font-weight:700;font-size:13px;cursor:pointer;transition:background 0.15s ease,color 0.15s ease" hoverStyle="background:#E3402B;color:#fff">
                {tag}
              </Hoverable>
            ))}
          </div>
        </div>

        <div style={sx("border: none; border-radius: 22px; padding: 20px; background-color: #FFFFFFED; box-shadow: rgba(0, 0, 0, 0.25) 0px 0.0625em 0.0625em, rgba(0, 0, 0, 0.25) 0px 0.125em 0.5em, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset")}>
          <div style={sx("font-weight:800;font-size:15px;margin-bottom:14px")}>แนะนำสำหรับคุณ</div>
          <div style={sx("display:flex;flex-direction:column;gap:12px")}>
            {suggestedOwners.map((sug) => (
              <div key={sug.id} style={sx("display:flex;align-items:center;gap:12px;border:none;border-radius:16px;padding:10px 12px;background:#fff;box-shadow:0 2px 8px rgba(32,28,22,0.08)")}>
                <div onClick={() => a.openUserProfile(sug.id)} style={sx(`width:44px;height:44px;border-radius:50%;background:${sug.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;flex:none;cursor:pointer;overflow:hidden;box-shadow:0 2px 8px rgba(32,28,22,0.08)`)}>{sug.avatarSrc ? <ImageSlot shape="circle" placeholder="" src={sug.avatarSrc} style="width:100%;height:100%" /> : sug.initial}</div>
                <div style={sx("flex:1;min-width:0")}>
                  <div style={sx("font-weight:800;font-size:14px")}>{sug.name}</div>
                  <div style={sx("font-size:12px;color:#8a8378")}>คนเลี้ยงสัตว์ใกล้คุณ</div>
                </div>
                <Hoverable as="button" onClick={() => a.toggleFollow(sug.id)} style="background:#fff;border:none;border-radius:100px;padding:8px 14px;box-shadow:0 2px 8px rgba(32,28,22,0.08);font-weight:800;font-size:12px;cursor:pointer;flex:none;transition:background 0.15s ease,color 0.15s ease" hoverStyle="background:#E3402B;color:#fff">ติดตาม</Hoverable>
              </div>
            ))}
          </div>
        </div>
        <Hoverable as="button" onClick={a.onCreatePostBtnClick} style={"width: 327px; align-self: center; background: #E3402B; color: #fff; border: none; border-radius: 100px; padding: 14px 30px; font-weight: 800; font-size: 14px; letter-spacing: 0.03em; text-transform: uppercase; cursor: pointer; box-shadow: 0 6px 18px rgba(32,28,22,0.25); transition: transform 0.15s ease; height: 47px;" + createPostBtnAnim} hoverStyle="transform:scale(1.03)" activeStyle="transform:scale(0.97)">
          + สร้างโพสต์
        </Hoverable>
      </aside>
    </div>
  );
}
