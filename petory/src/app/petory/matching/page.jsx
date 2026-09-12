"use client";
import { sx, Hoverable } from "../ui";
import { usePetory } from "../context";
import { userById } from "../helpers";
import { PERSONALITY_OPTIONS } from "../constants";
import Dropdown from "../components/Dropdown";

export default function MatchingPage() {
  const { state: s, ...a } = usePetory();
  const mf = s.matchFilters;

  const resolvedIds = s.passedPetIds.concat(s.interestedPetIds).concat(s.matches.map((m) => m.petId));
  let queue = s.pets.filter((p) => p.ownerId !== "me" && s.blockedUserIds.indexOf(p.ownerId) === -1 && resolvedIds.indexOf(p.id) === -1);
  queue = queue.filter((p) => {
    if (mf.species !== "all" && p.species !== mf.species) return false;
    if (mf.gender !== "any" && p.gender !== mf.gender) return false;
    if (mf.size !== "all" && p.size !== mf.size) return false;
    if (mf.personality.length && !mf.personality.some((x) => p.personality.indexOf(x) !== -1)) return false;
    if (mf.distance !== "anywhere" && p.distance > Number(mf.distance)) return false;
    return true;
  });
  const cp = queue[0];
  const stackRotations = [{ rotate: "rotate(-7deg) translateX(-14px)", z: 2 }, { rotate: "rotate(7deg) translateX(14px)", z: 1 }];
  const matchStackPets = queue.slice(1, 3).map((p, i) => ({ ...p, ...stackRotations[i] }));

  const myPetsForMatching = s.pets.filter((p) => p.ownerId === "me");
  const matchingPetId = s.matchingPetId || (myPetsForMatching[0] && myPetsForMatching[0].id) || "";
  const matchingPetName = (myPetsForMatching.find((p) => p.id === matchingPetId) || {}).name || "";
  const petDropdownOptions = myPetsForMatching.map((p) => ({
    label: p.name.charAt(0) + p.name.slice(1).toLowerCase(), onSelect: () => a.selectMatchingPet(p.id),
    optionStyle: "padding:9px 14px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;" + (p.id === matchingPetId ? "background:#FDEDEA;color:#E4412C" : "color:#201C16"),
  }));
  const matchingPurposeOptions = [["playmate", "หาเพื่อนเล่น"], ["mate", "หาคู่รัก"]].map(([val, label]) => ({
    label, onClick: () => a.setMatchingPurpose(val), bg: s.matchingPurpose === val ? "#2B5468" : "#fff", fg: s.matchingPurpose === val ? "#fff" : "#201C16",
  }));

  return (
    <div style={sx("min-height:calc(100vh - 68px);background:#C9E3F5;padding:clamp(20px,4vw,48px);display:flex;flex-direction:column;align-items:center")}>
      <div style={sx("display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 60px; margin-top: -20px")}>
        <div style={sx("display:flex;align-items:center;gap:14px")}>
          <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2rem,6vw,2.8rem);text-transform:uppercase;color:#2B5468;margin:0")}>Matching</h1>
        </div>
        <div style={sx("display:flex;align-items:center;gap:10px;flex-wrap:wrap")}>
          <Dropdown
            label={matchingPetName}
            open={s.petDropdownOpen}
            onToggle={a.togglePetDropdown}
            options={petDropdownOptions}
            arrowColor="#fff"
            buttonStyle="border:none;border-radius:100px;padding:10px 18px;font-weight:700;font-size:12px;cursor:pointer;color:#fff;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;background-color:#E4412C;display:flex;align-items:center;gap:8px"
            panelStyle="position:absolute;top:calc(100% + 6px);left:0;min-width:140px;background:#fff;border-radius:14px;box-shadow:rgba(0,0,0,0.19) 0px 10px 20px, rgba(0,0,0,0.23) 0px 6px 6px;padding:6px;z-index:10;display:flex;flex-direction:column;gap:2px"
          />
          <div style={sx("display:flex;background:#fff;border-radius:100px;padding:4px;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px")}>
            {matchingPurposeOptions.map((mo, i) => (
              <span key={i} onClick={mo.onClick} style={sx(`padding:8px 16px;border-radius:100px;font-weight:700;font-size:12px;cursor:pointer;background:${mo.bg};color:${mo.fg}`)}>{mo.label}</span>
            ))}
          </div>
          <button onClick={a.openMatchFilter} style={sx("border:none;background:#fff;border-radius:100px;padding:10px 18px;font-weight:700;font-size:12px;text-transform:uppercase;cursor:pointer;color:#2B5468;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px")}>Filters</button>
        </div>
      </div>
      {cp ? (
        <>
          <div style={sx("position:relative;width:100%;max-width:480px;margin-top:-28px")}>
            {matchStackPets.map((sp, i) => (
              <div key={i} style={sx(`position:absolute;top:0;left:0;right:0;height:340px;background:${sp.photo};border-radius:24px;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;transform:${sp.rotate};z-index:${sp.z};display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:12px;text-transform:uppercase;opacity:0.85`)}>{sp.name} PHOTO</div>
            ))}
            <Hoverable style="position:relative;z-index:5;width:100%;background:#fff;border:none;border-radius:24px;overflow:hidden;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;transition:transform 0.25s ease,box-shadow 0.25s ease" hoverStyle="transform:translateY(-8px) rotate(-1.2deg);box-shadow:rgba(0, 0, 0, 0.25) 0px 16px 32px, rgba(0, 0, 0, 0.22) 0px 8px 10px">
              <div style={sx(`height:340px;background:${cp.photo};display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:13px;text-transform:uppercase`)}>{cp.name} PHOTO</div>
              <div style={sx("padding:22px")}>
                <h2 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2rem,7vw,2.8rem);text-transform:uppercase;margin:0")}>{cp.name}</h2>
                <div style={sx("font-size:15px;color:#4a453c;margin-bottom:6px")}>{cp.breed}</div>
                <div style={sx("font-family:'Anton',sans-serif;font-size:13px;letter-spacing:0.04em;color:#E3402B;margin-bottom:14px")}>{cp.age} YEARS · {cp.gender.toUpperCase()} · {cp.distance} KM AWAY</div>
                <div style={sx("display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px")}>
                  {cp.personality.map((chip, i) => (
                    <span key={i} style={sx("border:none;background:#fff;border-radius:100px;padding:6px 14px;font-weight:700;font-size:11px;text-transform:uppercase;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px")}>{chip}</span>
                  ))}
                </div>
                <div style={sx("font-weight:800;font-size:12px;text-transform:uppercase;color:#8a8378;margin-bottom:6px")}>Interests: {cp.interests.join(", ")}</div>
                <div style={sx("font-size:13px;color:#8a8378")}>Owner: <span style={sx("font-weight:700;color:#201C16")}>{userById(s, cp.ownerId).name}</span></div>
              </div>
            </Hoverable>
          </div>
          <div style={sx("display:flex;gap:20px;margin-top:24px")}>
            <Hoverable as="button" onClick={() => a.interestPet(cp.id)} style="width:76px;height:76px;border-radius:50%;border:none;background:#E3402B;font-family:'Anton',sans-serif;font-size:11px;cursor:pointer;color:#fff;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;transition:transform 0.15s ease" hoverStyle="transform:scale(1.08)" activeStyle="transform:scale(0.8) rotate(-6deg)">LIKE</Hoverable>
            <Hoverable as="button" onClick={() => a.openReportUser(cp.ownerId)} style="width:56px;height:56px;align-self:center;border-radius:50%;border:none;background:#F0C93B;cursor:pointer;color:#201C16;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;transition:transform 0.15s ease;display:flex;align-items:center;justify-content:center" hoverStyle="transform:scale(1.08)" activeStyle="transform:scale(0.85)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </Hoverable>
            <Hoverable as="button" onClick={() => a.passPet(cp.id)} style="width:76px;height:76px;border-radius:50%;border:none;background:#fff;font-family:'Anton',sans-serif;font-size:13px;cursor:pointer;color:#201C16;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;transition:transform 0.15s ease" hoverStyle="transform:scale(1.08)" activeStyle="transform:scale(0.85)">PASS</Hoverable>
          </div>
        </>
      ) : (
        <div style={sx("text-align:center;padding:80px 20px;color:#2B5468")}>
          <div style={sx("font-family:'Anton',sans-serif;font-size:clamp(1.8rem,5vw,2.6rem);text-transform:uppercase")}>Your Next Best<br />Friend Is Out There.</div>
          <p style={sx("margin-top:12px;font-size:15px")}>ลองปรับ Filter หรือกลับมาดูใหม่ทีหลัง</p>
        </div>
      )}
    </div>
  );
}
