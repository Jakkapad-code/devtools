"use client";
import { sx, Hoverable, ImageSlot } from "../ui";
import { usePetory } from "../context";

const TILTS = ["rotate(-1.5deg)", "rotate(1.5deg)", "rotate(-0.5deg)", "rotate(2deg)"];

export default function MyPetsPage() {
  const { state: s, goAddPet, openPetProfile } = usePetory();
  const myPets = s.pets.filter((p) => p.ownerId === "me").map((p, i) => ({ ...p, tilt: TILTS[i % TILTS.length] }));

  return (
    <div style={sx("max-width:1100px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <div style={sx("display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:32px")}>
        <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.8rem,9vw,5.5rem);line-height:0.9;text-transform:uppercase;margin:0")}>My Pets</h1>
        <Hoverable as="button" onClick={goAddPet} style="padding:14px 24px;border-radius:100px;border:none;background:#E3402B;color:#fff;font-weight:800;font-size:13px;letter-spacing:0.03em;text-transform:uppercase;cursor:pointer;transition:background 0.15s ease,transform 0.15s ease" hoverStyle="background:#201C16;transform:translateY(-2px)" activeStyle="transform:scale(0.95)">+ Add Pet</Hoverable>
      </div>
      <div style={sx("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px")}>
        {myPets.map((pet) => (
          <Hoverable key={pet.id} onClick={() => openPetProfile(pet.id)} style={`cursor:pointer;transform:${pet.tilt};border:none;border-radius:20px;overflow:hidden;background:#fff;box-shadow:rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;transition:transform 0.2s ease,box-shadow 0.2s ease`} hoverStyle="transform:scale(1.03);box-shadow:rgba(0, 0, 0, 0.25) 0px 16px 32px, rgba(0, 0, 0, 0.22) 0px 8px 10px" activeStyle="transform:scale(0.97)">
            <div style={sx(`height:200px;background:${pet.photo};display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:12px;text-transform:uppercase`)}><ImageSlot shape="rect" placeholder={`${pet.name} PHOTO`} src={pet.photoSrc} style="width:100%;height:100%" /></div>
            <div style={sx("padding:16px")}>
              <div style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase")}>{pet.name}</div>
              <div style={sx("font-size:13px;color:#4a453c")}>{pet.breed}</div>
              <div style={sx("font-size:12px;color:#8a8378;margin-top:4px;text-transform:uppercase;font-weight:700")}>{pet.age} yrs · {pet.gender}</div>
            </div>
          </Hoverable>
        ))}
      </div>
    </div>
  );
}
