"use client";
import { sx, ImageSlot } from "../ui";
import { usePetory } from "../context";
import Dropdown from "./Dropdown";

const FIELD_BUTTON = "width:100%;box-sizing:border-box;padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:14px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:space-between;text-align:left";
const FIELD_PANEL = "position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border-radius:12px;border:2px solid #201C16;padding:6px;z-index:10;display:flex;flex-direction:column;gap:2px";
const INPUT = "width:100%;box-sizing:border-box;padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px;background:#fff";
const LABEL = "display:block;font-weight:800;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a8378;margin-bottom:6px";

function fieldOptions(values, current, onSelect) {
  return values.map((val) => ({
    label: val, onSelect: () => onSelect(val),
    optionStyle: "padding:10px 12px;border-radius:8px;font-size:14px;cursor:pointer;" + (val === current ? "background:#FDEDEA;color:#E4402B;font-weight:700" : ""),
  }));
}

/** Small uppercase caption above a field, so the card reads as labelled rows. */
function Field({ label, children }) {
  return (
    <div style={sx("min-width:0")}>
      <span style={sx(LABEL)}>{label}</span>
      {children}
    </div>
  );
}

export default function PetForm({ title, submitLabel, photoPlaceholder }) {
  const { state: s, ...a } = usePetory();
  const f = s.petForm;

  return (
    <div style={sx("max-width:680px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(16px,4vw,48px) 120px")}>
      <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,8vw,4rem);line-height:0.9;text-transform:uppercase;margin:0 0 8px")}>{title}</h1>
      <p style={sx("margin:0 0 24px;color:#8a8378;font-size:14px")}>กรอกข้อมูลน้อง ๆ ให้ครบเพื่อให้เจอเพื่อนที่ใช่</p>

      <div style={sx("background:#fff;border:2px solid #201C16;border-radius:24px;padding:clamp(18px,4vw,28px);box-shadow:8px 8px 0 rgba(32,28,22,0.12);display:flex;flex-direction:column;gap:18px")}>
        <label title="อัปโหลดรูปสัตว์เลี้ยง" style={sx(`height:200px;border-radius:18px;overflow:hidden;position:relative;display:block;cursor:pointer;border:2px ${f.photoMediaId ? "solid" : "dashed"} #C9BFAE;background:#F6F1E8`)}>
          <ImageSlot shape="rect" placeholder={photoPlaceholder} src={f.photoMediaId ? `/api/media/${f.photoMediaId}` : undefined} style="width:100%;height:100%" />
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={a.uploadPetPhoto} disabled={s.petPhotoPending} style={{ display: "none" }} />
          <span style={sx("position:absolute;right:12px;bottom:12px;background:#E3402B;color:#fff;border-radius:100px;padding:8px 16px;font-size:12px;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,0.18)")}>
            {s.petPhotoPending ? "กำลังอัปโหลด..." : f.photoMediaId ? "เปลี่ยนรูป" : "เพิ่มรูป"}
          </span>
        </label>

        <Field label="Pet Name">
          <input placeholder="เช่น Mochi" value={f.name} onChange={a.onPetName} style={sx(INPUT)} />
        </Field>

        <div style={sx("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px")}>
          <Field label="Species">
            <Dropdown label={f.species} open={s.fieldDropdownOpen === "species"} onToggle={a.toggleSpeciesFieldDropdown} options={fieldOptions(["Dog", "Cat", "Other"], f.species, a.selectPetSpecies)} buttonStyle={FIELD_BUTTON} panelStyle={FIELD_PANEL} />
          </Field>
          <Field label="Gender">
            <Dropdown label={f.gender} open={s.fieldDropdownOpen === "gender"} onToggle={a.toggleGenderFieldDropdown} options={fieldOptions(["Male", "Female"], f.gender, a.selectPetGender)} buttonStyle={FIELD_BUTTON} panelStyle={FIELD_PANEL} />
          </Field>
          <Field label="Size">
            <Dropdown label={f.size} open={s.fieldDropdownOpen === "size"} onToggle={a.toggleSizeFieldDropdown} options={fieldOptions(["Small", "Medium", "Large"], f.size, a.selectPetSize)} buttonStyle={FIELD_BUTTON} panelStyle={FIELD_PANEL} />
          </Field>
        </div>

        <div style={sx("display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px")}>
          <Field label="Breed">
            <input placeholder="Shiba Inu" value={f.breed} onChange={a.onPetBreed} style={sx(INPUT)} />
          </Field>
          <Field label="Age">
            <input placeholder="ปี" type="number" value={f.age} onChange={a.onPetAge} style={sx(INPUT)} />
          </Field>
          <Field label="น้ำหนัก">
            <input placeholder="กก." title="น้ำหนัก (กก.)" type="number" step="0.1" min="0" value={f.weight} onChange={a.onPetWeight} style={sx(INPUT)} />
          </Field>
        </div>

        <hr style={sx("border:none;border-top:1px dashed #D8CFC0;margin:2px 0")} />

        <div>
          <span style={sx(LABEL)}>Personality</span>
          <div style={sx("display:flex;gap:10px;flex-wrap:wrap")}>
            {["Friendly", "Playful", "Energetic", "Calm", "Social"].map((label) => {
              const active = f.personality.indexOf(label) !== -1;
              return (
                <span key={label} onClick={() => a.togglePetPersonality(label)} style={sx(`border:2px solid #201C16;border-radius:100px;padding:8px 16px;font-weight:700;font-size:12px;text-transform:uppercase;cursor:pointer;background:${active ? "#201C16" : "#fff"};color:${active ? "#fff" : "#201C16"}`)}>{label}</span>
              );
            })}
          </div>
        </div>

        <Field label="Bio">
          <textarea placeholder="เล่าเรื่องน้องสั้น ๆ" value={f.bio} onChange={a.onPetBio} style={sx(INPUT + ";min-height:100px;resize:vertical;font-family:inherit")} />
        </Field>

        <Field label="Interests">
          <input placeholder="คั่นด้วยลูกน้ำ เช่น Walks, Park, Fetch" value={f.interestsRaw} onChange={a.onPetInterests} style={sx(INPUT)} />
        </Field>

        <div style={sx("display:flex;gap:12px;margin-top:4px;flex-wrap:wrap")}>
          <button disabled={s.petPending} onClick={a.savePet} style={sx(`flex:1;min-width:160px;background:#E3402B;color:#fff;font-weight:800;font-size:14px;letter-spacing:0.03em;text-transform:uppercase;padding:15px;border-radius:100px;border:none;cursor:${s.petPending ? "wait" : "pointer"};opacity:${s.petPending ? "0.7" : "1"}`)}>{s.petPending ? "Saving..." : submitLabel}</button>
          <button onClick={a.cancelPetForm} style={sx("border:2px solid #201C16;background:#fff;font-weight:700;font-size:14px;text-transform:uppercase;padding:15px 24px;border-radius:100px;cursor:pointer")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
