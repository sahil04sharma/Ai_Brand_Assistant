import { useEffect, useRef, useState } from "react";

function TypingIndicator() {
  return (
    <div className="flex max-w-[85%] items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-3 py-2.5 sm:max-w-[70%]">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
    </div>
  );
}

function bubbleSpacing(prevRole, role, index) {
  if (index === 0) return "";
  if (prevRole === "user" && role === "assistant") return "mt-4";
  return "mt-2";
}

export default function ChatWindow({ brand, onSend, disabled }) {
  const [message, setMessage] = useState("");
  const [pendingUser, setPendingUser] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const messages = brand?.messages ?? [];
  const inactive = disabled || !brand;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, brand?._id, sending, pendingUser]);

  useEffect(() => {
    setPendingUser("");
    setError("");
    setMessage("");
  }, [brand?._id]);

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || !brand?._id || sending) return;

    const text = message.trim();
    setSending(true);
    setError("");
    setPendingUser(text);
    setMessage("");

    try {
      await onSend(text);
      setPendingUser("");
    } catch {
      setPendingUser("");
      setMessage(text);
      setError("Something went wrong — try again");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`flex h-[min(60vh,22rem)] flex-col rounded-[10px] border border-slate-200 bg-white sm:h-[28rem] ${
        inactive ? "opacity-70" : ""
      }`}
    >
      <div className="flex-1 overflow-y-auto p-3 text-[14px] sm:p-4">
        {inactive && (
          <p className="text-slate-500">
            Select or create a brand to start chatting.
          </p>
        )}

        {!inactive && messages.length === 0 && !pendingUser && (
          <p className="text-slate-500">
            No messages yet. Describe the brand you want to build.
          </p>
        )}

        {!inactive &&
          messages.map((m, i) => {
            const prevRole = i > 0 ? messages[i - 1].role : null;
            const isUser = m.role === "user";

            return (
              <div
                key={`${m.timestamp || i}-${m.role}-${i}`}
                className={`${bubbleSpacing(prevRole, m.role, i)} flex ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] break-words px-3 py-2 text-[14px] leading-relaxed sm:max-w-[70%] ${
                    isUser
                      ? "rounded-2xl rounded-br-md bg-indigo-100 text-slate-900"
                      : "rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

        {!inactive && pendingUser && (
          <div
            className={`flex justify-end ${
              messages.length > 0 ? "mt-2" : ""
            }`}
          >
            <div className="max-w-[85%] break-words rounded-2xl rounded-br-md bg-indigo-100 px-3 py-2 text-[14px] leading-relaxed text-slate-900 sm:max-w-[70%]">
              {pendingUser}
            </div>
          </div>
        )}

        {!inactive && sending && (
          <div className="mt-4 flex justify-start">
            <TypingIndicator />
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-[8px] bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className={`flex gap-2 border-t border-slate-200 p-3 ${
          inactive ? "bg-slate-50" : ""
        }`}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            inactive
              ? "Select a brand to chat…"
              : "e.g. Make it more premium"
          }
          disabled={inactive || sending}
          className="min-w-0 flex-1 rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={inactive || sending || !message.trim()}
          className="shrink-0 rounded-[8px] bg-slate-900 px-4 py-2 text-[14px] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
