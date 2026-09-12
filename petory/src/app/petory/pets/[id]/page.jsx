"use client";
import { use } from "react";
import { sx, Hoverable, ImageSlot } from "../../ui";
import { usePetory } from "../../context";
import { userById } from "../../helpers";
import BackLink from "../../components/BackLink";

export default function PetProfilePage({ params }) {
  const { id } = use(params);
  const { state: s, ...a } = usePetory();
  const p = s.pets.find((pp) => pp.id === id);
  if (!p) return <div style={sx("max-width:900px;margin:0 auto;padding:48px;text-align:center")}>ไม่พบสัตว์เลี้ยงนี้</div>;

  const owner = userById(s, p.ownerId);
  const isMine = p.ownerId === "me";
  const speciesLabel = p.species === "Dog" ? "หมา" : p.species === "Cat" ? "แมว" : "อื่นๆ";
  const genderLabel = p.gender === "Male" ? "ผู้" : "เมีย";
  const weightLabel = p.weight ? p.weight + " กก." : "—";

  return (
    <div style={sx("max-width:900px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <BackLink fallbackHref="/petory/pets">← All Pets</BackLink>
      <div style={sx("border-radius:24px;margin-top:20px;background:#fff;box-shadow:rgba(0, 0, 0, 0.15) 0px 15px 25px, rgba(0, 0, 0, 0.05) 0px 5px 10px;overflow:hidden")}>
        <div style={sx(`height:340px;border-radius:24px 24px 0 0;overflow:hidden;background:${p.photo}`)}>
          {isMine && <ImageSlot shape="rect" placeholder="ลากรูปมาวาง" style="width:100%;height:100%" />}
        </div>
        <div style={sx("padding:24px 28px 28px")}>
          <div style={sx("display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:20px")}>
            <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2rem,6vw,2.8rem);text-transform:uppercase;margin:0")}>{p.name}</h1>
            <span style={sx("background:#CFEEDB;color:#201C16;font-weight:700;font-size:12px;padding:6px 14px;border-radius:100px")}>{speciesLabel}</span>
            <div style={sx("margin-left:auto;display:flex;gap:10px")}>
              {isMine ? (
                <>
                  <Hoverable as="button" onClick={() => a.editPet(p.id)} style="border: 1px solid #201C16; background: #fff; border-radius: 100px; padding: 10px 18px; font-weight: 800; font-size: 12px; cursor: pointer; border-width: 2px; transition: all 0.2s ease" hoverStyle="background:#201C16;color:#fff;transform:translateY(-2px)">Edit profile</Hoverable>
                  <Hoverable as="button" onClick={() => a.openDeletePet(p.id)} style="border: 1px solid #E3402B; color: #E3402B; background: #fff; border-radius: 100px; padding: 10px 18px; font-weight: 800; font-size: 12px; cursor: pointer; border-width: 2px; transition: all 0.2s ease" hoverStyle="background:#E3402B;color:#fff;transform:translateY(-2px)">Delete</Hoverable>
                </>
              ) : (
                <>
                  <Hoverable as="button" onClick={() => a.openReportUser(p.ownerId)} style="border:1px solid #b8b2a6;background:#fff;border-radius:100px;padding:10px 18px;font-weight:800;font-size:12px;cursor:pointer;transition:all 0.2s ease" hoverStyle="background:#201C16;color:#fff;border-color:#201C16;transform:translateY(-2px)">Report</Hoverable>
                  <Hoverable as="button" onClick={() => a.openBlock(p.ownerId)} style="border:1px solid #b8b2a6;background:#fff;border-radius:100px;padding:10px 18px;font-weight:800;font-size:12px;cursor:pointer;transition:all 0.2s ease" hoverStyle="background:#E3402B;color:#fff;border-color:#E3402B;transform:translateY(-2px)">Block</Hoverable>
                </>
              )}
            </div>
          </div>
          <div style={sx("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:20px")}>
            <div style={sx("border-radius: 14px; padding: 14px 16px; background-color: #784E31DE")}>
              <div style={sx("font-size: 12px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px")}>สายพันธุ์</div>
              <div style={sx("font-size: 17px; font-weight: 700; color: #FFDEAC")}>{p.breed}</div>
            </div>
            <div style={sx("border-radius: 14px; padding: 14px 16px; background-color: #784E31DE")}>
              <div style={sx("font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px")}>อายุ</div>
              <div style={sx("font-size: 17px; font-weight: 700; color: #FFDEAC")}>{p.age} ปี</div>
            </div>
            <div style={sx("border-radius: 14px; padding: 14px 16px; background-color: #784E31DE")}>
              <div style={sx("font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px")}>เพศ</div>
              <div style={sx("font-size: 17px; font-weight: 700; color: #FFDEAC")}>{genderLabel}</div>
            </div>
            <div style={sx("border-radius: 14px; padding: 14px 16px; background-color: #784E31DE")}>
              <div style={sx("font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px")}>น้ำหนัก</div>
              <div style={sx("font-size: 17px; font-weight: 700; color: #FFDEAC")}>{weightLabel}</div>
            </div>
            <div style={sx("border-radius: 14px; padding: 14px 16px; background-color: #784E31DE")}>
              <div style={sx("font-size: 12px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px")}>วัคซีน</div>
              <div style={sx("font-size: 17px; font-weight: 700; color: #FFDEAC")}>ครบ · ล่าสุด<br />&nbsp;ม.ค. 2026</div>
            </div>
          </div>
          <p style={sx("font-size:15px;line-height:1.7;margin:0 0 16px")}>{p.bio}</p>
          <div style={sx("display:flex;gap:10px;flex-wrap:wrap")}>
            {p.personality.map((chip, i) => (
              <span key={i} style={sx("background:#FBF1EA;color:#4a453c;border-radius:100px;padding:8px 16px;font-weight:700;font-size:12px")}>{chip}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
