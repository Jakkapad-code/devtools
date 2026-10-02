import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

// Every recipe/clinic demo card has its own locally bundled, credited image.
export const demoPhotoByTitle = new Map([
  ["ขนมตับไก่อบ ทำ 20 นาที", "recipe-liver.jpg"],
  ["ไอศกรีมกล้วยโยเกิร์ต คลายร้อน", "recipe-banana-yogurt.jpg"],
  ["ข้าวต้มฟักทองไก่ สำหรับน้องท้องเสีย", "recipe-dog-meal.jpg"],
  ["บิสกิตรูปกระดูกสำหรับน้องหมา", "recipe-dog-biscuits.jpg"],
  ["ไอเดียอาหารเปียกเพิ่มความหลากหลายให้แมว", "recipe-cat-food.jpg"],
  ["ขนมปังฟักทองโฮมเมด", "recipe-pumpkin-bread.jpg"],
  ["เตรียมตัวพาสัตว์เลี้ยงไปตรวจที่คลินิก", "clinic-room.jpg"],
  ["พาแมวไปตรวจสุขภาพครั้งแรก", "clinic-cat-checkup.jpg"],
  ["คุณหมอตรวจอาการน้องแมว", "clinic-cat-exam.jpg"],
  ["รู้จักห้องผ่าตัดสัตวแพทย์", "clinic-operating-room.jpg"],
]);

export async function validateDemoPhotos() {
  if (demoPhotoByTitle.size !== 10) throw new Error("Expected ten recipe/clinic demo photos");
  const checksums = new Set();
  for (const filename of demoPhotoByTitle.values()) {
    const bytes = await readFile(new URL(`../public/uploads/demo/${filename}`, import.meta.url));
    if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) throw new Error(`Invalid demo photo size: ${filename}`);
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error(`Demo photo must be JPEG: ${filename}`);
    const checksum = createHash("sha256").update(bytes).digest("hex");
    if (checksums.has(checksum)) throw new Error(`Duplicate demo photo content: ${filename}`);
    checksums.add(checksum);
  }
  return checksums.size;
}
