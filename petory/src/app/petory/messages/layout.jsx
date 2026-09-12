"use client";
import { usePathname } from "next/navigation";
import { sx } from "../ui";
import { usePetory } from "../context";
import { userById, petById } from "../helpers";

export default function MessagesLayout({ children }) {
  const pathname = usePathname();
  const { state: s, openChat } = usePetory();
  const activeMatchId = pathname.startsWith("/petory/messages/") ? pathname.split("/petory/messages/")[1] : null;

  const matchList = s.matches
    .filter((m) => { const pet = petById(s, m.petId); return pet && s.blockedUserIds.indexOf(pet.ownerId) === -1; })
    .slice().sort((a2, b2) => (b2.updatedAt || 0) - (a2.updatedAt || 0))
    .map((m) => {
      const pet = petById(s, m.petId);
      const owner = userById(s, pet.ownerId);
      const last = m.messages.length ? m.messages[m.messages.length - 1].text : "เริ่มการสนทนาได้เลย!";
      return { ...m, petName: pet.name, ownerName: owner.name, photoBg: pet.photo, lastMessage: last, rowBorder: m.id === activeMatchId ? "#E3402B" : "transparent" };
    });
  const matchesEmpty = matchList.length === 0;
  const showList = !s.isMobile || !activeMatchId;
  const showChat = !s.isMobile || !!activeMatchId;
  const listWidth = s.isMobile ? "100%" : "340px";

  return (
    <div style={sx("width:100%;margin:0 auto;height:calc(100vh - 68px);display:flex")}>
      {showList && (
        <div style={sx(`width: ${listWidth}; flex: none; overflow-y: auto; padding: clamp(20px,4vw,32px) clamp(16px,3vw,24px); box-shadow: rgba(0,0,0,0.07) 2px 0px 5px, rgba(0,0,0,0.09) 2px 0px 4px; clip-path: inset(0 -14px 0 0); z-index: 4; background-color: #BAA278A7`)}>
          <h1 style={sx("font-family: 'Anton',sans-serif; font-size: clamp(1.8rem,5vw,2.6rem); line-height: 0.9; text-transform: uppercase; margin: 0 0 18px; color: #57462B; font-weight: 800")}>Messages</h1>
          {matchesEmpty && (
            <div style={sx("padding:40px 4px")}>
              <div style={sx("font-family:'Anton',sans-serif;font-size:clamp(1.4rem,4vw,1.8rem);text-transform:uppercase")}>No Conversations Yet.</div>
              <p style={sx("color:#4a453c;margin-top:10px;font-size:14px")}>เมื่อเกิด Match การสนทนาจะปรากฏที่นี่</p>
            </div>
          )}
          <div style={sx("display:flex;flex-direction:column;gap:10px")}>
            {matchList.map((row) => (
              <div key={row.id} onClick={() => openChat(row.id)} style={sx(`display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border: 2px solid ${row.rowBorder}; border-radius: 18px; box-shadow: rgba(17, 17, 26, 0.1) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 48px; background: #fff`)}>
                <div style={sx(`width:44px;height:44px;border-radius:50%;background:${row.photoBg};flex:none;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px`)} />
                <div style={sx("flex:1;min-width:0")}>
                  <div style={sx("font-weight:800;font-size:14px")}>{row.petName} <span style={sx("font-weight:500;color:#8a8378;font-size:12px")}>· {row.ownerName}</span></div>
                  <div style={sx("font-size:12px;color:#4a453c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{row.lastMessage}</div>
                </div>
                <div style={sx("font-size:11px;color:#8a8378;flex:none")}>{row.matchedAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showChat && <div style={sx("flex:1;min-width:0;display:flex;flex-direction:column")}>{children}</div>}
    </div>
  );
}
