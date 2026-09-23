"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { sx, ImageSlot } from "../../ui";
import { usePetory } from "../../context";
import { petPhotoSrc, shortTime, daysAgoLabel } from "../../helpers";
import { conversationClient } from "@/features/auth/client";

export default function ChatPage({ params }) {
  const { matchId: conversationId } = use(params);
  const { state } = usePetory();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void conversationClient.messages(conversationId)
      .then(({ messages: rows }) => { if (active) setMessages(rows); })
      .catch(() => { if (active) setError("ไม่พบห้องสนทนานี้"); });
    // The header and the matched date come from the conversation list entry.
    void conversationClient.list()
      .then(({ conversations }) => { if (active) setConversation(conversations.find((item) => item.id === conversationId) ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [conversationId]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    try {
      const { message } = await conversationClient.send(conversationId, body);
      setMessages((current) => current.concat([message]));
      setDraft("");
      window.dispatchEvent(new CustomEvent("petory:message-sent"));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const partnerPhoto = conversation
    ? petPhotoSrc({ id: conversation.petId, name: conversation.petName, photoMediaId: conversation.petPhotoMediaId })
    : undefined;

  return <>
    <div style={sx("display:flex;align-items:center;gap:12px;padding:16px clamp(16px,3vw,24px);box-shadow:rgba(0,0,0,0.07) 0px 2px 5px;z-index:3;background:#fff")}>
      {state.isMobile && <Link href="/petory/messages" style={sx("cursor:pointer;font-weight:700;font-size:20px")}>←</Link>}
      <div style={sx("width:38px;height:38px;border-radius:50%;background:#D9A15B;flex:none;overflow:hidden")}>
        {partnerPhoto && <ImageSlot shape="circle" placeholder="" src={partnerPhoto} style="width:100%;height:100%" />}
      </div>
      <div>
        <div style={sx("font-weight:800;font-size:15px")}>{conversation?.petName || "Conversation"}</div>
        <div style={sx("font-size:12px;color:#8a8378")}>{conversation?.ownerName || "ข้อความจะถูกบันทึกอัตโนมัติ"}</div>
      </div>
    </div>

    <div style={sx("flex:1;overflow-y:auto;padding:20px clamp(16px,3vw,24px);display:flex;flex-direction:column;gap:14px;background:#fff")}>
      {error && <p role="alert" style={sx("color:#B42318")}>{error}</p>}
      {conversation?.matchedAt && (
        <div style={sx("text-align:center;font-size:12px;font-weight:800;color:#8a8378;letter-spacing:0.04em;margin-bottom:6px")}>
          MATCHED {daysAgoLabel(conversation.matchedAt)}
        </div>
      )}
      {messages.map((message) => {
        const mine = message.senderId === state.user?.id;
        return (
          <div key={message.id} style={sx(`display:flex;gap:8px;align-items:flex-end;justify-content:${mine ? "flex-end" : "flex-start"}`)}>
            {!mine && (
              <div style={sx("width:22px;height:22px;border-radius:50%;background:#D9A15B;flex:none;overflow:hidden;margin-bottom:18px")}>
                {partnerPhoto && <ImageSlot shape="circle" placeholder="" src={partnerPhoto} style="width:100%;height:100%" />}
              </div>
            )}
            <div style={sx(`max-width:70%;display:flex;flex-direction:column;align-items:${mine ? "flex-end" : "flex-start"}`)}>
              <div style={sx(`background:${mine ? "#E3402B" : "#F9DA6B"};color:${mine ? "#fff" : "#201C16"};border-radius:18px;padding:11px 16px;font-size:14px;line-height:1.5;word-break:break-word`)}>
                {message.body}
              </div>
              <span style={sx("font-size:11px;color:#8a8378;margin-top:4px;padding:0 6px")}>{shortTime(message.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>

    <div style={sx("display:flex;gap:10px;padding:16px clamp(16px,3vw,24px);background:#F6F1E8")}>
      <input placeholder="พิมพ์ข้อความ..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} style={sx("flex:1;min-width:0;padding:13px 16px;border-radius:100px;border:none;font-size:14px")} />
      <button onClick={() => void send()} style={sx("background:#E3402B;color:#fff;border:none;border-radius:100px;padding:13px 22px;font-weight:800;font-size:13px;text-transform:uppercase;cursor:pointer;flex:none")}>Send</button>
    </div>
  </>;
}
