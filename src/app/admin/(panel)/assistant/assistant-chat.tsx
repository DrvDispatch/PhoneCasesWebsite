"use client";

import { useRef, useState } from "react";

type Action = { type: string; params: Record<string, unknown>; summary: string };
type Msg = {
  role: "user" | "assistant";
  text: string;
  attachments?: string[];
  actions?: Action[];
  applied?: boolean;
};

const EXAMPLES = [
  "Set all prices to €25",
  "Make every product image fill the frame with a white background",
  "Hide the Japan case",
  "Create a code WELCOME10 for 10% off",
];

export function AssistantChat({ configured }: { configured: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { url?: string };
        if (data.url) setAttachments((a) => [...a, data.url!]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && !attachments.length) || busy) return;
    const outgoing: Msg = { role: "user", text, attachments };
    const history = messages.slice(-8).map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.text }));
    setMessages((m) => [...m, outgoing]);
    setInput("");
    const sentAttachments = attachments;
    setAttachments([]);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, attachments: sentAttachments, history }),
      });
      const data = (await res.json()) as { reply?: string; actions?: Action[]; error?: string };
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", text: data.error || "Something went wrong." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: data.reply || "…", actions: data.actions ?? [] }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network error. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  async function apply(index: number, actions: Action[]) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/assistant/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions }),
      });
      const data = (await res.json()) as { results?: { ok: boolean; message: string }[]; error?: string };
      setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, applied: true } : msg)));
      const lines = (data.results ?? []).map((r) => `${r.ok ? "✅" : "⚠️"} ${r.message}`);
      setMessages((m) => [...m, { role: "assistant", text: lines.join("\n") || data.error || "Done." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Couldn't apply — please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-sm text-ink-soft">
        The AI assistant isn&rsquo;t switched on yet — its Vertex AI service account needs to be
        configured on the server.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Conversation */}
      <div className="min-h-[280px] space-y-4 rounded-2xl border border-line bg-surface p-4">
        {messages.length === 0 && (
          <div className="py-6 text-center text-sm text-ink-soft">
            <p>Hi! I can update prices, images, descriptions, visibility, and discount codes.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-accent hover:text-brand"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-brand text-white" : "bg-surface-alt text-ink"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.attachments.map((u) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={u} src={u} alt="" className="h-14 w-14 rounded-lg border border-white/30 object-cover" />
                  ))}
                </div>
              )}

              {m.actions && m.actions.length > 0 && !m.applied && (
                <div className="mt-3 space-y-2">
                  <ul className="space-y-1">
                    {m.actions.map((a, j) => (
                      <li key={j} className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2 text-ink">
                        <span className="text-accent">→</span>
                        <span>{a.summary}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button
                      onClick={() => apply(i, m.actions!)}
                      disabled={busy}
                      className="btn btn-primary px-4 py-2 text-sm"
                    >
                      Apply {m.actions.length > 1 ? `${m.actions.length} changes` : "change"}
                    </button>
                    <button
                      onClick={() => setMessages((mm) => mm.map((msg, k) => (k === i ? { ...msg, applied: true } : msg)))}
                      className="btn btn-outline px-4 py-2 text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && <p className="text-center text-xs text-ink-soft">Thinking…</p>}
      </div>

      {/* Composer */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`mt-3 rounded-2xl border p-3 transition ${dragging ? "border-accent bg-accent/5" : "border-line bg-surface"}`}
      >
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((u, idx) => (
              <div key={u} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-14 w-14 rounded-lg border border-line object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachments((a) => a.filter((_, k) => k !== idx))}
                  className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-danger text-xs text-white"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            {uploading && <span className="self-center text-xs text-ink-soft">Uploading…</span>}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-line text-lg text-ink-soft transition hover:border-accent"
            aria-label="Attach image"
            title="Attach an image"
          >
            +
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Tell me what to change… (or drop an image here)"
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button onClick={send} disabled={busy} className="btn btn-primary flex-none px-4 py-2 text-sm">
            Send
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">
        The assistant proposes changes — nothing is saved until you press Apply.
      </p>
    </div>
  );
}
