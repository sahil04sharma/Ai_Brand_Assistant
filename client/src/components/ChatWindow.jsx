import { useEffect, useRef, useState } from "react";

export default function ChatWindow({ brand, onSend, disabled }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const messages = brand?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, brand?._id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || !brand?._id) return;

    setSending(true);
    setError("");
    try {
      await onSend(message.trim());
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!brand) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Select or create a brand to start chatting.
      </div>
    );
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-md border border-slate-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            No messages yet. Describe the brand you want to build.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={`${m.timestamp || i}-${m.role}`}
            className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-slate-900 text-white"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-slate-200 p-3"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Make it more premium"
          disabled={disabled || sending}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || sending || !message.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>

      {error && (
        <p className="border-t border-slate-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
