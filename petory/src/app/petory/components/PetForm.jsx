"use client";
import { sx, ImageSlot } from "../ui";
import { usePetory } from "../context";
import Dropdown from "./Dropdown";

const FIELD_BUTTON = "width:100%;box-sizing:border-box;padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:14px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:space-between;text-align:left";
const FIELD_PANEL = "position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border-radius:12px;border:2px solid #201C16;padding:6px;z-index:10;display:flex;flex-direction:column;gap:2px";

function fieldOptions(values, current, onSelect) {
  return values.map((val) => ({
    label: val, onSelect: () => onSelect(val),
    optionStyle: "padding:10px 12px;border-radius:8px;font-size:14px;cursor:pointer;" + (val === current ? "background:#FDEDEA;color:#E4402B;font-weight:700" : ""),
  }));
}

export default function PetForm({ title, submitLabel, photoPlaceholder }) {
  const { state: s, ...a } = usePetory();
  const f = s.petForm;

  return (
    <div style={sx("max-width:640px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,8vw,4rem);line-height:0.9;text-transform:uppercase;margin:0 0 24px")}>{title}</h1>
      <div style={sx("display:flex;flex-direction:column;gap:16px")}>
        <div style={sx("height:160px;border-radius:16px;overflow:hidden")}>
          <ImageSlot shape="rect" placeholder={photoPlaceholder} style="width:100%;height:100%" />
        </div>
        <input placeholder="Pet Name" value={f.name} onChange={a.onPetName} style={sx("padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px")} />
        <div style={sx("display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px")}>
          <Dropdown label={f.species} open={s.fieldDropdownOpen === "species"} onToggle={a.toggleSpeciesFieldDropdown} options={fieldOptions(["Dog", "Cat", "Other"], f.species, a.selectPetSpecies)} buttonStyle={FIELD_BUTTON} panelStyle={FIELD_PANEL} />
          <Dropdown label={f.gender} open={s.fieldDropdownOpen === "gender"} onToggle={a.toggleGenderFieldDropdown} options={fieldOptions(["Male", "Female"], f.gender, a.selectPetGender)} buttonStyle={FIELD_BUTTON} panelStyle={FIELD_PANEL} />
          <Dropdown label={f.size} open={s.fieldDropdownOpen === "size"} onToggle={a.toggleSizeFieldDropdown} options={fieldOptions(["Small", "Medium", "Large"], f.size, a.selectPetSize)} buttonStyle={FIELD_BUTTON} panelStyle={FIELD_PANEL} />
        </div>
        <div style={sx("display:grid;grid-template-columns:2fr 1fr;gap:12px")}>
          <input placeholder="Breed" value={f.breed} onChange={a.onPetBreed} style={sx("padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px")} />
          <input placeholder="Age" type="number" value={f.age} onChange={a.onPetAge} style={sx("padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px")} />
        </div>
        <div style={sx("font-weight:800;font-size:13px;text-transform:uppercase;color:#8a8378")}>Personality</div>
        <div style={sx("display:flex;gap:10px;flex-wrap:wrap")}>
          {["Friendly", "Playful", "Energetic", "Calm", "Social"].map((label) => {
            const active = f.personality.indexOf(label) !== -1;
            return (
              <span key={label} onClick={() => a.togglePetPersonality(label)} style={sx(`border:2px solid #201C16;border-radius:100px;padding:8px 16px;font-weight:700;font-size:12px;text-transform:uppercase;cursor:pointer;background:${active ? "#201C16" : "#fff"};color:${active ? "#fff" : "#201C16"}`)}>{label}</span>
            );
          })}
        </div>
        <textarea placeholder="Bio" value={f.bio} onChange={a.onPetBio} style={sx("padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px;min-height:90px;resize:vertical")} />
        <input placeholder="Interests (คั่นด้วยลูกจุลภาค เช่น Walks, Park, Fetch)" value={f.interestsRaw} onChange={a.onPetInterests} style={sx("padding:14px 16px;border-radius:12px;border:2px solid #201C16;font-size:15px")} />
        <div style={sx("display:flex;gap:12px;margin-top:8px")}>
          <button disabled={s.petPending} onClick={a.savePet} style={sx(`flex:1;background:#E3402B;color:#fff;font-weight:800;font-size:14px;letter-spacing:0.03em;text-transform:uppercase;padding:15px;border-radius:100px;border:none;cursor:${s.petPending ? "wait" : "pointer"};opacity:${s.petPending ? "0.7" : "1"}`)}>{s.petPending ? "Saving..." : submitLabel}</button>
          <button onClick={a.cancelPetForm} style={sx("border:2px solid #201C16;background:#fff;font-weight:700;font-size:14px;text-transform:uppercase;padding:15px 24px;border-radius:100px;cursor:pointer")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
