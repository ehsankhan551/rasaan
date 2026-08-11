"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ProductImage from "@/components/ProductImage";

type ProductResult = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  category: string | null;
  shops: { name: string } | { name: string }[] | null;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  products?: ProductResult[];
};

const FAQ_RULES: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["cash on delivery", "cod", "pay on delivery"],
    reply: "Yes — Rasaan supports Cash on Delivery on every order, or you can pay online at checkout. Your choice!",
  },
  {
    keywords: ["delivery time", "how long", "how fast", "shipping time", "when will"],
    reply: "Delivery time depends on the shop and rider availability near you, but most local orders arrive same-day. You'll see rider updates on your order page.",
  },
  {
    keywords: ["delivery fee", "delivery charge", "shipping cost"],
    reply: "Delivery fees vary by shop and distance — the exact fee is shown at checkout before you confirm your order.",
  },
  {
    keywords: ["return", "refund", "exchange"],
    reply: "If something's wrong with your order, contact the shop directly from your order details page, or reach Rasaan support for help sorting it out.",
  },
  {
    keywords: ["become a vendor", "sell on rasaan", "list my shop", "open a shop"],
    reply: "You can list your shop on Rasaan for free — head to the Sign up page and choose \"Vendor\" as your account type.",
  },
  {
    keywords: ["become a rider", "delivery job", "ride for rasaan", "work as a rider"],
    reply: "Want to deliver for Rasaan? Sign up and choose \"Rider\" as your account type — you can then pick up available deliveries near you on your own schedule.",
  },
  {
    keywords: ["track my order", "where is my order", "order status"],
    reply: "You can check your order status any time from My Dashboard → Orders.",
  },
];

function findFaqReply(message: string): string | null {
  const lower = message.toLowerCase();
  for (const rule of FAQ_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.reply;
  }
  return null;
}

const STOPWORDS = new Set([
  "do", "you", "have", "any", "a", "an", "the", "is", "are", "i", "want", "need",
  "looking", "for", "find", "me", "please", "can", "could", "show", "search",
  "where", "what", "which", "buy", "get", "some", "of", "to", "in", "on", "with",
]);

function extractKeywords(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! Ask me about any product — e.g. \"do you have paracetamol\" or \"cheap headphones\" — or ask about delivery, payment, or returns.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    const faq = findFaqReply(text);
    if (faq) {
      setMessages((m) => [...m, { role: "assistant", text: faq }]);
      setLoading(false);
      return;
    }

    const keywords = extractKeywords(text);
    if (keywords.length === 0) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Could you tell me a bit more about what you're looking for?" },
      ]);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      let query = supabase
        .from("products")
        .select("id, name, price, sale_price, image_url, category, shops!inner(name)")
        .eq("active", true)
        .limit(5);

      const orFilter = keywords
        .slice(0, 4)
        .map((k) => `name.ilike.%${k}%,generic_name.ilike.%${k}%,category.ilike.%${k}%`)
        .join(",");
      query = query.or(orFilter);

      const { data } = await query;

      if (data && data.length > 0) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: `Found ${data.length} match${data.length > 1 ? "es" : ""} for you:`,
            products: data as unknown as ProductResult[],
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "I couldn't find that in the catalog right now. Try Browse Products to search more broadly, or rephrase what you're looking for.",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Something went wrong searching just now — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[92vw] max-w-sm h-[28rem] rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Rasaan Assistant</p>
              <p className="text-xs text-green-100">Ask about any product</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-green-700 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.products && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p) => {
                        const shop = Array.isArray(p.shops) ? p.shops[0] : p.shops;
                        return (
                          <Link
                            key={p.id}
                            href={`/products/${p.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 p-1.5"
                          >
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                              <ProductImage src={p.image_url} category={p.category} name={p.name} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                              <p className="text-xs text-gray-500">
                                {shop?.name} · Rs {Number(p.sale_price ?? p.price).toFixed(0)}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-400">
                  Searching…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-gray-200 p-2 flex gap-2 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a product..."
              className="flex-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-green-700 text-white text-sm font-medium px-4 py-1.5 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-green-700 hover:bg-green-800 text-white w-14 h-14 shadow-xl flex items-center justify-center text-2xl transition-transform hover:scale-105"
        aria-label="Open assistant"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
