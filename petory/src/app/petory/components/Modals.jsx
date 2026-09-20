"use client";
import { sx, Hoverable, ImageSlot } from "../ui";
import { usePetory } from "../context";
import { PERSONALITY_OPTIONS } from "../constants";
import { petById } from "../helpers";
import ModalShell from "./ModalShell";
import ConfirmModal from "./ConfirmModal";
import Dropdown from "./Dropdown";

const USER_REASONS = ["Harassment", "Spam", "Fake Account", "Unsafe Behavior", "Inappropriate Behavior"];
const POST_REASONS = ["Spam", "Inappropriate Content", "Animal Abuse", "False Information", "Harassment"];

export default function Modals() {
  const { state: s, ...a } = usePetory();
  const m = s.modals;

  const mf = s.matchFilters;
  const distanceOpts = [["1", "1 KM"], ["5", "5 KM"], ["10", "10 KM"], ["25", "25 KM"], ["anywhere", "ANYWHERE"]];
  const speciesOpts = [["all", "ALL"], ["Dog", "DOG"], ["Cat", "CAT"]];
  const genderOpts = [["any", "ANY"], ["Male", "MALE"], ["Female", "FEMALE"]];
  const sizeOpts = [["all", "ALL"], ["Small", "SMALL"], ["Medium", "MEDIUM"], ["Large", "LARGE"]];
  const chip = (val, label, current, onClick) => ({ label, onClick: () => onClick(val), bg: current === val ? "#2B5468" : "#fff", fg: current === val ? "#fff" : "#2B5468" });

  const postPetOptions = [{ id: "", name: "เลือกสัตว์เลี้ยง (ไม่บังคับ)" }].concat(s.pets.filter((p) => p.ownerId === "me")).map((p) => ({
    label: p.name, onSelect: () => a.selectPostPet(p.id),
    optionStyle: "padding:10px 12px;border-radius:8px;font-size:14px;cursor:pointer;" + (p.id === s.postForm.petId ? "background:#FDEDEA;color:#E4402B;font-weight:700" : ""),
  }));
  const postPetLabel = (s.pets.find((p) => p.id === s.postForm.petId) || {}).name || "เลือกสัตว์เลี้ยง (ไม่บังคับ)";

  const newMatchPet = s.newMatchPetId ? petById(s, s.newMatchPetId) : null;
  const myFirstPetName = (s.pets.find((p) => p.ownerId === "me") || {}).name || "YOUR PET";

  return (
    <>
      {m.editProfile && (
        <ModalShell maxWidth={640}>
          <h2 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 20px")}>ข้อมูลคนเลี้ยง</h2>
          <div style={sx("display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:16px")}>
            <div>
              <div style={sx("font-size:12px;font-weight:700;color:#8a8378;margin-bottom:6px")}>ชื่อที่แสดง</div>
              <input placeholder="ชื่อที่แสดง" value={s.profileForm.name} onChange={a.onProfileName} style={sx("width:100%;box-sizing:border-box;padding:13px 16px;border-radius:12px;border:1px solid #d9d3c6;font-size:15px")} />
            </div>
            <div>
              <div style={sx("font-size:12px;font-weight:700;color:#8a8378;margin-bottom:6px")}>เบอร์โทร</div>
              <input placeholder="เบอร์โทร" value={s.profileForm.phone} onChange={a.onProfilePhone} style={sx("width:100%;box-sizing:border-box;padding:13px 16px;border-radius:12px;border:1px solid #d9d3c6;font-size:15px")} />
            </div>
            <div>
              <div style={sx("font-size:12px;font-weight:700;color:#8a8378;margin-bottom:6px")}>อีเมล</div>
              <input placeholder="อีเมล" value={s.profileForm.email} readOnly aria-readonly="true" style={sx("width:100%;box-sizing:border-box;padding:13px 16px;border-radius:12px;border:1px solid #d9d3c6;font-size:15px;background:#f4f0e7;color:#70695e")} />
            </div>
            <div>
              <div style={sx("font-size:12px;font-weight:700;color:#8a8378;margin-bottom:6px")}>จังหวัด</div>
              <input placeholder="จังหวัด" value={s.profileForm.location} onChange={a.onProfileLocation} style={sx("width:100%;box-sizing:border-box;padding:13px 16px;border-radius:12px;border:1px solid #d9d3c6;font-size:15px")} />
            </div>
          </div>
          <div style={sx("font-size:12px;font-weight:700;color:#8a8378;margin-bottom:6px")}>เกี่ยวกับฉัน</div>
          <div style={sx("display:flex;flex-direction:column;gap:14px")}>
            <textarea placeholder="เกี่ยวกับฉัน" value={s.profileForm.bio} onChange={a.onProfileBio} style={sx("padding:14px 16px;border-radius:12px;border:1px solid #d9d3c6;font-size:15px;min-height:100px;resize:vertical")} />
            <div style={sx("display:flex;gap:12px;margin-top:6px")}>
              <button disabled={s.profilePending} onClick={a.saveProfile} style={sx(`flex:1;background:#E3402B;color:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:15px;border-radius:100px;border:none;cursor:${s.profilePending ? "wait" : "pointer"};opacity:${s.profilePending ? "0.7" : "1"}`)}>{s.profilePending ? "Saving..." : "Save"}</button>
              <button onClick={a.closeEditProfile} style={sx("border:2px solid #201C16;background:#fff;font-weight:700;font-size:14px;text-transform:uppercase;padding:15px 24px;border-radius:100px;cursor:pointer")}>Cancel</button>
            </div>
          </div>
        </ModalShell>
      )}

      {m.createPost && (
        <ModalShell maxWidth={520}>
          <h2 style={sx("font-family:'Anton',sans-serif;font-size:28px;text-transform:uppercase;margin:0 0 18px")}>CREATE POST</h2>
          <div style={sx("display:flex;flex-direction:column;gap:14px")}>
            {s.postFormIsBlog && (
              <input placeholder="หัวข้อเรื่อง" value={s.postForm.title} onChange={a.onPostTitle} style={sx("padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px;font-weight:800")} />
            )}
            <div style={sx("height:140px;border-radius:14px;overflow:hidden")}>
              <ImageSlot shape="rect" placeholder="drag & drop or click to upload image" style="width:100%;height:100%" />
            </div>
            <textarea placeholder="เขียนแคปชั่น..." value={s.postForm.caption} onChange={a.onPostCaption} style={sx("padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px;min-height:80px;resize:vertical")} />
            <Dropdown label={postPetLabel} open={s.fieldDropdownOpen === "postPet"} onToggle={a.togglePostPetDropdown} options={postPetOptions}
              buttonStyle="width:100%;box-sizing:border-box;padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:14px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:space-between;text-align:left"
              panelStyle="position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border-radius:12px;border:2px solid #201C16;padding:6px;z-index:10;display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto" />
            <div style={sx("display:flex;gap:12px;margin-top:6px")}>
              <Hoverable as="button" onClick={a.submitPost} style="flex:1;background:#E3402B;color:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:15px;border-radius:100px;border:none;cursor:pointer;transition:transform 0.15s ease,box-shadow 0.15s ease" hoverStyle="transform:translateY(-2px);box-shadow:0 6px 14px rgba(227,64,43,0.4)" activeStyle="transform:scale(0.95)">Post</Hoverable>
              <button onClick={a.closeCreatePost} style={sx("border:none;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;background:#fff;font-weight:700;font-size:14px;text-transform:uppercase;padding:15px 22px;border-radius:100px;cursor:pointer")}>Cancel</button>
            </div>
          </div>
        </ModalShell>
      )}

      {m.matchFilter && (
        <ModalShell maxWidth={440}>
          <h2 style={sx("font-family:'Anton',sans-serif;font-size:26px;text-transform:uppercase;margin:0 0 18px")}>Filters</h2>
          <div style={sx("display:flex;flex-direction:column;gap:18px")}>
            <div>
              <div style={sx("font-weight:800;font-size:12px;text-transform:uppercase;color:#8a8378;margin-bottom:8px")}>Species</div>
              <div style={sx("display:flex;gap:8px")}>
                {speciesOpts.map(([val, label], i) => { const c = chip(val, label, mf.species, (v2) => a.setMatchFilter("species", v2)); return (
                  <span key={i} onClick={c.onClick} style={sx(`border:none;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px;border-radius:100px;padding:8px 16px;font-weight:700;font-size:12px;cursor:pointer;background:${c.bg};color:${c.fg}`)}>{c.label}</span>
                ); })}
              </div>
            </div>
            <div>
              <div style={sx("font-weight:800;font-size:12px;text-transform:uppercase;color:#8a8378;margin-bottom:8px")}>Distance</div>
              <div style={sx("display:flex;gap:8px;flex-wrap:wrap")}>
                {distanceOpts.map(([val, label], i) => { const c = chip(val, label, mf.distance, (v2) => a.setMatchFilter("distance", v2)); return (
                  <span key={i} onClick={c.onClick} style={sx(`border:none;border-radius:100px;padding:8px 14px;font-weight:700;font-size:12px;cursor:pointer;background:${c.bg};color:${c.fg};box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px`)}>{c.label}</span>
                ); })}
              </div>
            </div>
            <div>
              <div style={sx("font-weight:800;font-size:12px;text-transform:uppercase;color:#8a8378;margin-bottom:8px")}>Gender</div>
              <div style={sx("display:flex;gap:8px")}>
                {genderOpts.map(([val, label], i) => { const c = chip(val, label, mf.gender, (v2) => a.setMatchFilter("gender", v2)); return (
                  <span key={i} onClick={c.onClick} style={sx(`border:none;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px;border-radius:100px;padding:8px 16px;font-weight:700;font-size:12px;cursor:pointer;background:${c.bg};color:${c.fg}`)}>{c.label}</span>
                ); })}
              </div>
            </div>
            <div>
              <div style={sx("font-weight:800;font-size:12px;text-transform:uppercase;color:#8a8378;margin-bottom:8px")}>Size</div>
              <div style={sx("display:flex;gap:8px;flex-wrap:wrap")}>
                {sizeOpts.map(([val, label], i) => { const c = chip(val, label, mf.size, (v2) => a.setMatchFilter("size", v2)); return (
                  <span key={i} onClick={c.onClick} style={sx(`border:none;border-radius:100px;padding:8px 14px;font-weight:700;font-size:12px;cursor:pointer;background:${c.bg};color:${c.fg};box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px`)}>{c.label}</span>
                ); })}
              </div>
            </div>
            <div>
              <div style={sx("font-weight:800;font-size:12px;text-transform:uppercase;color:#8a8378;margin-bottom:8px")}>Personality</div>
              <div style={sx("display:flex;gap:8px;flex-wrap:wrap")}>
                {PERSONALITY_OPTIONS.map((label, i) => {
                  const active = mf.personality.indexOf(label) !== -1;
                  return (
                    <span key={i} onClick={() => a.toggleMatchPersonalityFilter(label)} style={sx(`border:none;border-radius:100px;padding:8px 14px;font-weight:700;font-size:12px;cursor:pointer;background:${active ? "#2B5468" : "#fff"};color:${active ? "#fff" : "#2B5468"};box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px`)}>{label.toUpperCase()}</span>
                  );
                })}
              </div>
            </div>
            <div style={sx("display:flex;gap:12px;margin-top:6px")}>
              <Hoverable as="button" onClick={a.closeMatchFilter} style="flex:1;background:#201C16;color:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:15px;border-radius:100px;border:none;cursor:pointer;transition:background 0.15s ease,transform 0.15s ease,box-shadow 0.15s ease;box-shadow:rgba(50, 50, 105, 0.15) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px" hoverStyle="background:#3a332a" activeStyle="background:#E3402B;transform:scale(0.96)">Apply</Hoverable>
              <Hoverable as="button" onClick={a.resetMatchFilter} activeStyle="transform:scale(0.94);background-color:#b81a00" style="transition: transform 0.15s ease, background-color 0.15s ease; border: none; box-shadow: rgba(50, 50, 105, 0.15) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px; font-weight: 700; font-size: 14px; text-transform: uppercase; padding: 15px 22px; border-radius: 100px; cursor: pointer; background-color: #E12200; color: #FFFFFF">Reset</Hoverable>
            </div>
          </div>
        </ModalShell>
      )}

      {m.mutualMatch && newMatchPet && (
        <div style={sx("position:fixed;inset:0;background:#F0C93B;display:flex;align-items:center;justify-content:center;z-index:110;padding:20px;text-align:center")}>
          <div style={sx("animation:celebratePop 0.5s ease-out")}>
            <div style={sx("font-family:'Anton',sans-serif;font-size:clamp(3rem,12vw,6.5rem);text-transform:uppercase;line-height:0.9;color:#201C16")}>It&apos;s A<br />Match!</div>
            <div style={sx("font-family:'Anton',sans-serif;font-size:clamp(1.4rem,5vw,2rem);color:#E3402B;margin:16px 0")}>{myFirstPetName} × {newMatchPet.name}</div>
            <p style={sx("font-size:16px;color:#201C16;margin:0 0 30px")}>&quot;Looks like they found a new friend.&quot;</p>
            <div style={sx("display:flex;gap:14px;justify-content:center;flex-wrap:wrap")}>
              <button onClick={a.startChatFromModal} style={sx("background:#201C16;color:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:16px 28px;border-radius:100px;border:none;cursor:pointer")}>Start Chat</button>
              <button onClick={a.closeMutualMatch} style={sx("border:2px solid #201C16;background:transparent;font-weight:800;font-size:14px;text-transform:uppercase;padding:16px 28px;border-radius:100px;cursor:pointer")}>Keep Exploring</button>
            </div>
          </div>
        </div>
      )}

      {m.reportUser && (
        <ModalShell>
          <h2 style={sx("font-family:'Anton',sans-serif;font-size:24px;text-transform:uppercase;margin:0 0 16px")}>Report User</h2>
          <div style={sx("display:flex;flex-direction:column;gap:8px;margin-bottom:20px")}>
            {USER_REASONS.map((r, i) => (
              <label key={i} style={sx("display:flex;align-items:center;gap:10px;font-size:14px;cursor:pointer")}><input type="radio" name="ru2" checked={s.reportReason === r} onChange={() => a.setReportReason(r)} /> {r}</label>
            ))}
          </div>
          <div style={sx("display:flex;gap:12px")}>
            <button onClick={a.submitReport} disabled={!s.reportReason} style={sx(`flex:1;background:#E3402B;color:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:14px;border-radius:100px;border:none;cursor:pointer;opacity:${s.reportReason ? 1 : 0.5}`)}>Submit</button>
            <button onClick={a.closeReportUser} style={sx("border:2px solid #201C16;background:#fff;font-weight:700;font-size:14px;text-transform:uppercase;padding:14px 20px;border-radius:100px;cursor:pointer")}>Cancel</button>
          </div>
        </ModalShell>
      )}

      {m.reportPost && (
        <ModalShell>
          <h2 style={sx("font-family:'Anton',sans-serif;font-size:24px;text-transform:uppercase;margin:0 0 16px")}>Report Post</h2>
          <div style={sx("display:flex;flex-direction:column;gap:8px;margin-bottom:20px")}>
            {POST_REASONS.map((r, i) => (
              <label key={i} style={sx("display:flex;align-items:center;gap:10px;font-size:14px;cursor:pointer")}><input type="radio" name="rp" checked={s.reportReason === r} onChange={() => a.setReportReason(r)} /> {r}</label>
            ))}
          </div>
          <div style={sx("display:flex;gap:12px")}>
            <button onClick={a.submitReport} style={sx("flex:1;background:#E3402B;color:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:14px;border-radius:100px;border:none;cursor:pointer")}>Submit</button>
            <button onClick={a.closeReportPost} style={sx("border:2px solid #201C16;background:#fff;font-weight:700;font-size:14px;text-transform:uppercase;padding:14px 20px;border-radius:100px;cursor:pointer")}>Cancel</button>
          </div>
        </ModalShell>
      )}

      {m.block && <ConfirmModal title="Block This User?" body="คุณจะไม่เห็นเนื้อหาของผู้ใช้นี้อีก และจะไม่สามารถแชทหรือโต้ตอบกันได้" confirmLabel="Block" onConfirm={a.confirmBlock} onCancel={a.closeBlock} />}
      {m.logoutConfirm && <ConfirmModal title="Log Out?" body="แน่ใจไหมว่าต้องการออกจากระบบ" confirmLabel="Log Out" onConfirm={a.confirmLogout} onCancel={a.closeLogoutConfirm} danger={false} />}
      {m.deletePost && <ConfirmModal title="Delete This Post?" body="การลบไม่สามารถย้อนกลับได้" confirmLabel="Delete" onConfirm={a.confirmDeletePost} onCancel={a.closeDeletePost} />}
      {m.deletePet && <ConfirmModal title="Delete This Pet?" body="การลบไม่สามารถย้อนกลับได้" confirmLabel="Delete" onConfirm={a.confirmDeletePet} onCancel={a.closeDeletePet} />}
    </>
  );
}
