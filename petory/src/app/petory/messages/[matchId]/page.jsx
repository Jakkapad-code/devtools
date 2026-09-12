"use client";
import { use } from "react";
import Link from "next/link";
import { sx } from "../../ui";
import { usePetory } from "../../context";
import { userById, petById } from "../../helpers";

export default function ChatPage({ params }) {
  const { matchId } = use(params);
  const { state: s, ...a } = usePetory();
  const m = s.matches.find((mm) => mm.id === matchId);
  if (!m) return null;

  const pet = petById(s, m.petId);
  const owner = userById(s, pet.ownerId);
  const messages = m.messages.map((msg) => ({ ...msg, itemAlign: msg.from === "me" ? "flex-end" : "flex-start", bg: msg.from === "me" ? "#E3402B" : "#F9DA6B", showPaw: msg.from !== "me" }));

  return (
    <>
      <div style={sx("display: flex; align-items: center; gap: 12px; padding: 16px clamp(16px,3vw,24px); box-shadow: rgba(0,0,0,0.07) 0px 2px 5px, rgba(0,0,0,0.09) 0px 2px 4px; clip-path: inset(0 0 -14px 0); z-index: 3; background-color: #DDD1BB2A")}>
        {s.isMobile && <Link href="/petory/messages" style={sx("cursor:pointer;font-weight:700;font-size:20px")}>←</Link>}
        <div style={sx(`width:38px;height:38px;border-radius:50%;background:${pet.photo};box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px`)} />
        <div style={sx("flex:1")}>
          <div style={sx("font-weight:800;font-size:15px")}>{pet.name}</div>
          <div style={sx("font-size:12px;color:#8a8378")}>Owner: {owner.name}</div>
        </div>
        <div style={sx("display:flex;gap:8px")}>
          <button onClick={() => a.openReportUser(owner.id)} style={sx("border:none;color:#fff;background:#201C16;border-radius:100px;padding:8px 16px;font-weight:700;font-size:11px;text-transform:uppercase;cursor:pointer")}>Report</button>
          <button onClick={() => a.openBlock(owner.id)} style={sx("border:none;color:#fff;background:#201C16;border-radius:100px;padding:8px 16px;font-weight:700;font-size:11px;text-transform:uppercase;cursor:pointer")}>Block</button>
          <button onClick={() => a.unmatch(m.id)} style={sx("border:none;color:#E3402B;background:#fff;border-radius:100px;padding:8px 14px;font-weight:700;font-size:11px;text-transform:uppercase;cursor:pointer;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px")}>Unmatch</button>
        </div>
      </div>
      <div style={sx("flex: 1; overflow-y: auto; padding: 20px clamp(16px,3vw,24px); display: flex; flex-direction: column; gap: 12px; background-color: #FFFFFF")}>
        <div style={sx("align-self:center;color:#8a8378;font-size:12px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;margin-bottom:6px")}>Matched {m.matchedAt}</div>
        {messages.map((msg, i) => (
          <div key={i} style={sx(`display:flex;flex-direction:column;align-items:${msg.itemAlign}`)}>
            <div style={sx(`position:relative;max-width:70%;background:${msg.bg};color:#201C16;border-radius:16px;padding:10px 16px;font-size:14px`)}>
              {msg.text}
              {msg.showPaw && (
                <span style={sx("position:absolute;bottom:-6px;left:-6px;width:16px;height:16px;opacity:0.55")}>
                  <span style={sx("position:relative;display:block;width:100%;height:100%")}>
                    <span style={sx(`position:absolute;bottom:0;left:3px;width:9px;height:6px;background:#201C16;border-radius:50%`)} />
                    <span style={sx(`position:absolute;top:0;left:0;width:4px;height:4px;background:#201C16;border-radius:50%`)} />
                    <span style={sx(`position:absolute;top:-1px;left:6px;width:4px;height:4px;background:#201C16;border-radius:50%`)} />
                    <span style={sx(`position:absolute;top:0;left:12px;width:4px;height:4px;background:#201C16;border-radius:50%`)} />
                  </span>
                </span>
              )}
            </div>
            <span style={sx("font-size:11px;color:#8a8378;margin-top:4px;padding:0 4px")}>{msg.time}</span>
          </div>
        ))}
      </div>
      <div style={sx("display: flex; gap: 10px; padding: 16px clamp(16px,3vw,24px); box-shadow: rgba(0,0,0,0.07) 0px -2px 5px, rgba(0,0,0,0.09) 0px -2px 4px; clip-path: inset(-14px 0 0 0); z-index: 3; background-color: #F6F1E8")}>
        <input placeholder="พิมพ์ข้อความ..." value={s.chatDraft} onChange={a.onChatDraft} onKeyDown={a.onChatKeyDown(m.id)} style={sx("flex:1;padding:13px 16px;border-radius:100px;border:none;font-size:14px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px")} />
        <button onClick={() => a.sendMessage(m.id)} style={sx("background:#E3402B;color:#fff;border:none;border-radius:100px;padding:13px 22px;font-weight:800;font-size:13px;text-transform:uppercase;cursor:pointer")}>Send</button>
      </div>
    </>
  );
}
