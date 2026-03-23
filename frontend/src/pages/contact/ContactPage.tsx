import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../../api/chat";
import { useAuthStore } from "../../store/authStore";
import type { ChatMessage, Conversation, UserMini } from "../../types";

const PLACEHOLDER_AVATAR = "https://placehold.co/36x36/DEB887/8B4513?text=G";

function UserAvatar({ user, size = 9 }: { user: UserMini; size?: number }) {
  const [err, setErr] = useState(false);
  const sClass = `w-${size} h-${size} rounded-full object-cover shrink-0`;
  if (user.avatar && !err) {
    return <img src={user.avatar} alt="" onError={() => setErr(true)} className={sClass} />;
  }
  return (
    <span className={`${sClass} bg-light flex items-center justify-center text-primary font-bold text-sm`}>
      {(user.full_name ?? user.id)[0].toUpperCase()}
    </span>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── New Conversation Modal ─────────────────────────────────────────────────────

function NewConvModal({
  onClose,
  onCreate,
  adminId,
}: {
  onClose: () => void;
  onCreate: (userId: string) => void;
  adminId: string | null;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserMini[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (val: string) => {
    setQ(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const r = await chatApi.searchUsers(val);
        setResults(r.data);
      } catch { setResults([]); }
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-light">
          <h2 className="font-semibold text-dark">Nhắn tin mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          {adminId && (
            <button
              onClick={() => onCreate(adminId)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">A</span>
              <div className="text-left">
                <p className="font-semibold text-primary text-sm">Chat với Admin</p>
                <p className="text-xs text-gray-500">Hỗ trợ khách hàng</p>
              </div>
            </button>
          )}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input pl-9 text-sm"
              placeholder="Tìm tên người dùng..."
              value={q}
              onChange={(e) => search(e.target.value)}
              autoFocus
            />
          </div>
          {results.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onCreate(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors"
                >
                  <UserAvatar user={u} size={8} />
                  <span className="text-sm font-medium text-dark">{u.full_name || "Người dùng"}</span>
                </button>
              ))}
            </div>
          )}
          {q && results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">Không tìm thấy người dùng</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const { user, token } = useAuthStore();
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" | "audio"; serverUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => chatApi.listConversations().then((r) => r.data),
    enabled: !!user,
  });

  // Load messages when switching conversations
  useEffect(() => {
    if (!activeConvId) return;
    chatApi.getMessages(activeConvId).then((r) => {
      setMessages(r.data);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    });
    chatApi.markRead(activeConvId).then(() => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["chat-unread"] });
    });
  }, [activeConvId, qc]);

  // WebSocket per active conversation
  useEffect(() => {
    if (!activeConvId || !token) return;
    setWsReady(false);
    const apiBase = import.meta.env.VITE_API_URL as string | undefined;
    const wsBase = apiBase
      ? apiBase.replace(/^http/, "ws")
      : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
    const wsUrl = `${wsBase}/api/conversations/${activeConvId}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsReady(true);

    ws.onmessage = (e) => {
      const msg: ChatMessage = JSON.parse(e.data);
      setMessages((prev) => [...prev, msg]);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    ws.onclose = () => setWsReady(false);
    ws.onerror = () => setWsReady(false);

    return () => {
      ws.close();
      wsRef.current = null;
      setWsReady(false);
    };
  }, [activeConvId, token, qc]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await chatApi.uploadMedia(file);
      const localUrl = URL.createObjectURL(file);
      setMediaPreview({ url: localUrl, type: r.data.type, serverUrl: r.data.url });
    } catch {
      alert("Tải file thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if ((!content && !mediaPreview) || !activeConvId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setSending(true);
    try {
      wsRef.current.send(JSON.stringify({
        content,
        media_url: mediaPreview?.serverUrl ?? null,
        media_type: mediaPreview?.type ?? null,
      }));
      setInput("");
      setMediaPreview(null);
    } finally {
      setSending(false);
    }
  };

  const createConvMut = useMutation({
    mutationFn: (userId: string) => chatApi.createConversation(userId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConvId(r.data.id);
      setShowNewConv(false);
      setMobileShowThread(true);
    },
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Find admin user for quick button
  const adminId = conversations.find((c) => c.other_user.full_name?.toLowerCase().includes("admin"))?.other_user.id ?? null;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500">Vui lòng đăng nhập để sử dụng GymChat</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-8rem)]">
      <div className="card h-full flex overflow-hidden">
        {/* Left: Conversation list */}
        <div className={`w-full md:w-72 shrink-0 border-r border-light flex flex-col ${mobileShowThread ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-light flex items-center justify-between">
            <h1 className="text-lg font-bold text-dark">GymChat</h1>
            <button
              onClick={() => setShowNewConv(true)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center text-lg transition-colors"
            >+</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-sm text-gray-500 mb-3">Chưa có cuộc trò chuyện</p>
                <button onClick={() => setShowNewConv(true)} className="btn-primary text-sm">Bắt đầu nhắn tin</button>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConvId(conv.id); setMobileShowThread(true); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors border-b border-light/50 ${activeConvId === conv.id ? "bg-surface" : ""}`}
                >
                  <UserAvatar user={conv.other_user} size={10} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${conv.unread_count > 0 ? "font-bold text-dark" : "font-medium text-gray-700"}`}>
                        {conv.other_user.full_name || "Người dùng"}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-1">{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-dark" : "text-gray-400"}`}>
                      {conv.last_message_preview || "Bắt đầu trò chuyện"}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shrink-0">
                      {conv.unread_count > 9 ? "9+" : conv.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Message thread */}
        <div className={`flex-1 flex flex-col ${!mobileShowThread ? "hidden md:flex" : "flex"}`}>
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-400">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm">Chọn một cuộc trò chuyện</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-light flex items-center gap-3">
                <button onClick={() => setMobileShowThread(false)} className="md:hidden text-gray-400 hover:text-dark mr-1">←</button>
                {activeConv && <UserAvatar user={activeConv.other_user} size={9} />}
                <p className="font-semibold text-dark">{activeConv?.other_user.full_name || "Người dùng"}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
                  const mediaUrl = msg.media_url ? `${apiBase}${msg.media_url}` : null;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      {!isMe && <UserAvatar user={msg.sender} size={8} />}
                      <div className={`max-w-[70%] rounded-2xl text-sm overflow-hidden ${isMe ? "bg-primary text-white rounded-tr-sm" : "bg-surface text-dark rounded-tl-sm"}`}>
                        {mediaUrl && msg.media_type === "image" && (
                          <a href={mediaUrl} target="_blank" rel="noreferrer">
                            <img src={mediaUrl} alt="" className="max-w-full max-h-60 object-contain block" />
                          </a>
                        )}
                        {mediaUrl && msg.media_type === "video" && (
                          <video src={mediaUrl} controls className="max-w-full max-h-60 block" />
                        )}
                        {mediaUrl && msg.media_type === "audio" && (
                          <div className="px-3 pt-2">
                            <audio src={mediaUrl} controls className="w-full max-w-xs" />
                          </div>
                        )}
                        <div className="px-3 py-2">
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                          <p className={`text-xs mt-0.5 ${isMe ? "text-white/60" : "text-gray-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose box */}
              <div className="border-t border-light">
                {!wsReady && (
                  <div className="px-3 py-1.5 text-xs text-amber-600 bg-amber-50 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Đang kết nối...
                  </div>
                )}
                {mediaPreview && (
                  <div className="px-3 pt-2 flex items-start gap-2">
                    <div className="relative rounded-lg overflow-hidden bg-surface border border-light">
                      {mediaPreview.type === "image" && (
                        <img src={mediaPreview.url} alt="" className="max-h-24 max-w-[160px] object-cover" />
                      )}
                      {mediaPreview.type === "video" && (
                        <video src={mediaPreview.url} className="max-h-24 max-w-[160px]" />
                      )}
                      {mediaPreview.type === "audio" && (
                        <div className="px-3 py-2 flex items-center gap-2 text-primary text-sm">
                          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          Âm thanh
                        </div>
                      )}
                      <button
                        onClick={() => setMediaPreview(null)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none hover:bg-black/80"
                      >×</button>
                    </div>
                  </div>
                )}
                <div className="p-3 flex gap-2 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm,audio/mpeg,audio/ogg,audio/wav,audio/webm,audio/aac"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!wsReady || uploading}
                    className="p-2 text-gray-400 hover:text-primary transition-colors shrink-0 disabled:opacity-40"
                    title="Đính kèm ảnh / video / âm thanh"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </button>
                  <textarea
                    className="flex-1 input resize-none text-sm min-h-[40px] max-h-[96px]"
                    placeholder={wsReady ? "Nhập tin nhắn..." : "Đang kết nối, vui lòng chờ..."}
                    value={input}
                    rows={1}
                    disabled={!wsReady}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || (!input.trim() && !mediaPreview) || !wsReady}
                    className="btn-primary !px-3 !py-2 shrink-0 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewConv && (
        <NewConvModal
          onClose={() => setShowNewConv(false)}
          onCreate={(userId) => createConvMut.mutate(userId)}
          adminId={adminId}
        />
      )}
    </div>
  );
}
