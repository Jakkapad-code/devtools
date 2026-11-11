"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sx, ImageSlot } from "../../ui";
import { usePetory } from "../../context";
import { avatarSrc, avatarInitial, mediaSrc, shortTime, daysAgoLabel, hashColor } from "../../helpers";
import { conversationClient } from "@/features/auth/client";
import { mergeMessages } from "@/features/conversations/messages";

export default function ChatPage({ params }) {
  const { matchId: conversationId } = use(params);
  return <Conversation key={conversationId} conversationId={conversationId} />;
}

function Conversation({ conversationId }) {
  const { state, unmatch } = usePetory();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [unmatching, setUnmatching] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const latestId = useRef(null);
  const messageList = useRef(null);
  const pinnedToBottom = useRef(true);

  const cancelMatch = async () => {
    if (!conversation?.matchId || unmatching || !window.confirm("ยกเลิก Match และปิดห้องสนทนานี้ใช่ไหม?")) return;
    setUnmatching(true);
    if (!await unmatch(conversation.matchId)) setUnmatching(false);
  };

  useEffect(() => {
    let active = true;
    let timer;
    latestId.current = null;
    pinnedToBottom.current = true;
    async function poll(initial = false) {
      try {
        const cursor = initial || !latestId.current ? {} : { after: latestId.current };
        const { messages: rows, hasMore } = await conversationClient.messages(conversationId, cursor);
        if (!active) return;
        if (initial) {
          setMessages(rows);
          setHasOlder(hasMore);
          setReady(true);
        } else {
          setMessages((current) => mergeMessages(current, rows));
          // When a room was initially empty, this is another latest-page query.
          // Preserve access to older messages even if over 100 arrived meanwhile.
          if (!cursor.after) setHasOlder(hasMore);
        }
        if (rows.length) latestId.current = rows[rows.length - 1].id;
        setError("");
        timer = setTimeout(() => void poll(), hasMore && !initial ? 0 : 5000);
      } catch (requestError) {
        if (!active) return;
        if (["Not found", "Unauthorized"].includes(requestError.message)) {
          setMessages([]);
          setConversation(null);
          setUnavailable(true);
          setError("ไม่พบห้องสนทนานี้ หรือคุณไม่มีสิทธิ์เข้าถึงแล้ว");
          return;
        }
        setError("โหลดข้อความไม่สำเร็จ กำลังลองใหม่");
        timer = setTimeout(() => void poll(initial), 5000);
      }
    }
    void poll(true);
    // The header and the matched date come from the conversation list entry.
    void conversationClient.list()
      .then(({ conversations }) => { if (active) setConversation(conversations.find((item) => item.id === conversationId) ?? null); })
      .catch(() => {});
    return () => { active = false; clearTimeout(timer); };
  }, [conversationId]);

  useEffect(() => {
    if (pinnedToBottom.current && messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight;
  }, [messages]);

  const loadOlder = async () => {
    if (loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    try {
      const { messages: rows, hasMore } = await conversationClient.messages(conversationId, { before: messages[0].id });
      setMessages((current) => mergeMessages(current, rows));
      setHasOlder(hasMore);
    } catch {
      setError("โหลดข้อความเก่าไม่สำเร็จ");
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async () => {
    const submittedDraft = draft;
    const body = submittedDraft.trim();
    if (!body || unmatching || unavailable || !ready || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const { message } = await conversationClient.send(conversationId, body);
      pinnedToBottom.current = true;
      setMessages((current) => mergeMessages(current, [message]));
      setDraft((current) => current === submittedDraft ? "" : current);
      window.dispatchEvent(new CustomEvent("petory:message-sent"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  // Same rule as the list: the pet identifies the room, the owner rides along as
  // a badge, because one owner can hold several rooms.
  const partnerPhoto = mediaSrc(conversation?.petPhotoMediaId);
  const partnerInitial = avatarInitial(conversation?.petName);
  const partnerColor = conversation ? hashColor(conversation.petId) : "#D9A15B";
  const ownerPhoto = avatarSrc(conversation?.ownerAvatarMediaId);
  const ownerInitial = avatarInitial(conversation?.ownerName);
  const ownerColor = conversation ? hashColor(conversation.ownerName || conversation.id) : "#2B5468";

  return <>
    <div style={sx("display:flex;align-items:center;gap:12px;padding:16px clamp(16px,3vw,24px);box-shadow:rgba(0,0,0,0.07) 0px 2px 5px;z-index:3;background:#fff")}>
      {state.isMobile && <Link href="/petory/messages" style={sx("cursor:pointer;font-weight:700;font-size:20px")}>←</Link>}
      <div style={sx("position:relative;width:38px;height:38px;flex:none")}>
        <div style={sx(`width:100%;height:100%;border-radius:50%;background:${partnerColor};overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px`)}>
          {partnerPhoto ? <ImageSlot shape="circle" placeholder="" src={partnerPhoto} style="width:100%;height:100%" /> : partnerInitial}
        </div>
        <div title={conversation?.ownerName} style={sx(`position:absolute;right:-2px;bottom:-2px;width:18px;height:18px;border-radius:50%;background:${ownerColor};border:2px solid #fff;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:8px`)}>
          {ownerPhoto ? <ImageSlot shape="circle" placeholder="" src={ownerPhoto} style="width:100%;height:100%" /> : ownerInitial}
        </div>
      </div>
      <div>
        <div style={sx("font-weight:800;font-size:15px")}>{conversation?.petName || "Conversation"}</div>
        <div style={sx("font-size:12px;color:#8a8378")}>
          {conversation ? `${conversation.ownerName} · จับคู่กับ ${conversation.myPetName}` : "ข้อความจะถูกบันทึกอัตโนมัติ"}
        </div>
      </div>
    </div>

    {conversation && <div style={sx("display:flex;justify-content:flex-end;padding:8px 16px;background:#fff")}>
      <button type="button" onClick={() => void cancelMatch()} disabled={unmatching} style={sx("border:2px solid #B42318;border-radius:100px;background:#fff;color:#B42318;padding:9px 14px;font-weight:800;cursor:pointer")}>
        {unmatching ? "กำลังยกเลิก..." : "ยกเลิก Match"}
      </button>
    </div>}
    <div ref={messageList} onScroll={(event) => { const el = event.currentTarget; pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} style={sx("flex:1;overflow-y:auto;padding:20px clamp(16px,3vw,24px);display:flex;flex-direction:column;gap:14px;background:#fff")}>
      {error && (
        <div role="alert" style={sx("text-align:center;padding:40px 20px")}>
          <p style={sx("color:#B42318;margin:0 0 12px")}>{error}</p>
          <Link href="/petory/messages" style={sx("font-weight:800;font-size:14px;color:#E3402B;text-decoration-line:none")}>← กลับไปที่ข้อความ</Link>
        </div>
      )}
      {conversation?.matchedAt && (
        <div style={sx("text-align:center;font-size:12px;font-weight:800;color:#8a8378;letter-spacing:0.04em;margin-bottom:6px")}>
          MATCHED {daysAgoLabel(conversation.matchedAt)}
        </div>
      )}
      {hasOlder && <button type="button" onClick={() => void loadOlder()} disabled={loadingOlder} style={sx("align-self:center;border:0;background:none;color:#E3402B;font-weight:700;cursor:pointer")}>{loadingOlder ? "กำลังโหลด..." : "โหลดข้อความเก่า"}</button>}
      {messages.map((message) => {
        const mine = message.senderId === state.user?.id;
        return (
          <div key={message.id} style={sx(`display:flex;gap:8px;align-items:flex-end;justify-content:${mine ? "flex-end" : "flex-start"}`)}>
            {!mine && (
              <div style={sx(`width:22px;height:22px;border-radius:50%;background:${partnerColor};flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:10px;margin-bottom:18px`)}>
                {partnerPhoto ? <ImageSlot shape="circle" placeholder="" src={partnerPhoto} style="width:100%;height:100%" /> : partnerInitial}
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
      <input disabled={unavailable || !ready} placeholder="พิมพ์ข้อความ..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} style={sx("flex:1;min-width:0;padding:13px 16px;border-radius:100px;border:none;font-size:14px")} />
      <button disabled={unavailable || !ready || sending} onClick={() => void send()} style={sx("background:#E3402B;color:#fff;border:none;border-radius:100px;padding:13px 22px;font-weight:800;font-size:13px;text-transform:uppercase;cursor:pointer;flex:none")}>{sending ? "กำลังส่ง..." : "Send"}</button>
    </div>
  </>;
}
