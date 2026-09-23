"use client";
import { useEffect, useRef, useState } from "react";
import { sx, Hoverable } from "../ui";
import ModalShell from "./ModalShell";

const FRAME_WIDTH = 460;
const EXPORT_WIDTH = 1200;
const MAX_ZOOM = 4;

/**
 * Lets the viewer drag and zoom a picked file inside a fixed frame, then hands
 * back exactly what the frame shows as a JPEG. Cropping here means the stored
 * image is already framed, so nothing downstream needs crop metadata.
 */
export default function ImageAdjuster({ file, aspect = 1, title = "ปรับรูปภาพ", onCancel, onConfirm }) {
  // The object URL is created and revoked inside one effect: holding it outside
  // would let a cleanup revoke a URL the committed render is still showing.
  const [source, setSource] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef(null);
  const frameHeight = Math.round(FRAME_WIDTH / aspect);

  useEffect(() => {
    let active = true;
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (active) setSource({ url: objectUrl, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = objectUrl;
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const natural = source;
  // Scale that makes the image just cover the frame; zoom multiplies it.
  const coverScale = natural ? Math.max(FRAME_WIDTH / natural.width, frameHeight / natural.height) : 1;
  const drawnWidth = natural ? natural.width * coverScale * zoom : 0;
  const drawnHeight = natural ? natural.height * coverScale * zoom : 0;

  const clamp = (next) => ({
    x: Math.min(0, Math.max(FRAME_WIDTH - drawnWidth, next.x)),
    y: Math.min(0, Math.max(frameHeight - drawnHeight, next.y)),
  });

  // Zooming out can leave the frame uncovered, so pull the offset back in here
  // rather than from an effect watching zoom.
  const changeZoom = (next) => {
    setZoom(next);
    if (!natural) return;
    const width = natural.width * coverScale * next;
    const height = natural.height * coverScale * next;
    setOffset((current) => ({
      x: Math.min(0, Math.max(FRAME_WIDTH - width, current.x)),
      y: Math.min(0, Math.max(frameHeight - height, current.y)),
    }));
  };

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY, origin: offset };
  };
  const onPointerMove = (event) => {
    if (!drag.current) return;
    setOffset(clamp({
      x: drag.current.origin.x + (event.clientX - drag.current.startX),
      y: drag.current.origin.y + (event.clientY - drag.current.startY),
    }));
  };
  const onPointerUp = () => { drag.current = null; };

  const confirm = async () => {
    if (!natural || saving) return;
    setSaving(true);
    try {
      const ratio = EXPORT_WIDTH / FRAME_WIDTH;
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_WIDTH;
      canvas.height = Math.round(frameHeight * ratio);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        await createImageBitmap(file),
        offset.x * ratio, offset.y * ratio, drawnWidth * ratio, drawnHeight * ratio,
      );
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      await onConfirm(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell maxWidth={FRAME_WIDTH + 56}>
      <h2 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 4px")}>{title}</h2>
      <p style={sx("font-size:13px;color:#8a8378;margin:0 0 16px")}>ลากเพื่อเลื่อนรูป และใช้แถบด้านล่างเพื่อย่อ-ขยาย</p>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: "100%", height: frameHeight, maxWidth: FRAME_WIDTH, margin: "0 auto",
          borderRadius: 16, overflow: "hidden", background: "#EFEAE2", position: "relative",
          cursor: "grab", touchAction: "none",
        }}
      >
        {natural && (
          /* eslint-disable-next-line @next/next/no-img-element -- a local object URL being dragged; next/image cannot serve it */
          <img
            src={source.url}
            alt=""
            draggable={false}
            style={{ position: "absolute", left: offset.x, top: offset.y, width: drawnWidth, height: drawnHeight, maxWidth: "none", userSelect: "none" }}
          />
        )}
      </div>
      <input
        type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom}
        onChange={(event) => changeZoom(Number(event.target.value))}
        aria-label="ย่อ-ขยายรูป"
        style={sx("width:100%;margin:18px 0 6px;accent-color:#E3402B;cursor:pointer")}
      />
      {/* Both buttons carry the same 2px border box so the pair lines up: the
          confirm one keeps a transparent border instead of `border:none`,
          which would leave it 4px shorter than its neighbour. */}
      <div style={sx("display:flex;gap:12px;margin-top:12px;align-items:stretch")}>
        <Hoverable as="button" onClick={confirm} disabled={saving || !natural} style={`flex:1 1 auto;min-width:0;box-sizing:border-box;background-color:#E3402B;color:#fff;border:2px solid transparent;border-radius:100px;padding:14px 20px;font-family:inherit;font-weight:800;font-size:14px;line-height:1.2;white-space:nowrap;cursor:${saving || !natural ? "not-allowed" : "pointer"};opacity:${saving || !natural ? "0.6" : "1"};transition:background-color 0.15s ease`} hoverStyle={saving || !natural ? "" : "background-color:#C8351F"}>
          {saving ? "กำลังบันทึก..." : "ใช้รูปนี้"}
        </Hoverable>
        <button onClick={onCancel} style={sx("flex:none;box-sizing:border-box;border:2px solid #201C16;background:#fff;color:#201C16;border-radius:100px;padding:14px 24px;font-family:inherit;font-weight:800;font-size:14px;line-height:1.2;white-space:nowrap;cursor:pointer")}>ยกเลิก</button>
      </div>
    </ModalShell>
  );
}
