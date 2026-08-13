"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  sender_role: "customer" | "rider";
  message: string;
  created_at: string;
};

export default function OrderChat({
  orderId,
  viewerRole,
}: {
  orderId: string;
  viewerRole: "customer" | "rider";
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("order_messages")
      .select("id, sender_id, sender_role, message, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  }

  useEffect(() => {
    if (!open) return;
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }
    const { error } = await supabase.from("order_messages").insert({
      order_id: orderId,
      sender_id: user.id,
      sender_role: viewerRole,
      message: trimmed,
    });
    if (!error) {
      setText("");
      await load();
    }
    setSending(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 text-xs font-medium px-3 py-1.5 text-gray-700"
      >
        Chat with {viewerRole === "customer" ? "rider" : "customer"}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 mt-2 flex flex-col h-72 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <p className="text-xs font-semibold text-gray-700">
          {viewerRole === "customer" ? "Chat with your rider" : "Chat with customer"}
        </p>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400">
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && <p className="text-xs text-gray-400">No messages yet — say hello!</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_role === viewerRole ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-lg px-3 py-1.5 text-xs max-w-[75%] ${
                m.sender_role === viewerRole ? "bg-green-700 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-gray-100 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
        />
        <button
          disabled={sending}
          onClick={send}
          className="rounded-lg bg-green-700 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}
