"use client";

import { useState, useRef, useEffect } from "react";

// ────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────
type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

// ────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10), // Últimos 10 mensajes como historial
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setError("No se pudo obtener respuesta. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
  };

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoTitle}>Academia</span>
          <span style={styles.logoSubtitle}>Irisarri</span>
        </div>

        <button style={styles.newChatBtn} onClick={handleNewChat}>
          + Nueva consulta
        </button>

        <div style={styles.sidebarInfo}>
          <p style={styles.sidebarLabel}>Chat jurídico penal</p>
          <p style={styles.sidebarSub}>
            Respuestas con el criterio del Dr. Santiago M. Irisarri
          </p>
        </div>

        <div style={styles.sidebarFooter}>
          <p style={styles.footerText}>Beta privada · v0.1</p>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <span style={styles.headerTitle}>Chat jurídico</span>
          <span style={styles.headerBadge}>Beta</span>
        </header>

        {/* Mensajes */}
        <div style={styles.messagesArea}>
          {messages.length === 0 && (
            <div style={styles.welcome}>
              <div style={styles.welcomeIcon}>⚖️</div>
              <h2 style={styles.welcomeTitle}>¿En qué puedo ayudarte hoy?</h2>
              <p style={styles.welcomeText}>
                Hacé tu consulta de derecho penal y recibís una respuesta con
                el criterio del Dr. Irisarri.
              </p>
              <div style={styles.examplesGrid}>
                {EJEMPLOS.map((ej, i) => (
                  <button
                    key={i}
                    style={styles.exampleBtn}
                    onClick={() => setInput(ej)}
                  >
                    {ej}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={msg.role === "user" ? styles.userRow : styles.assistantRow}
            >
              <div
                style={
                  msg.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble
                }
              >
                {msg.role === "assistant" ? (
                  <div
                    style={styles.assistantContent}
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(msg.content),
                    }}
                  />
                ) : (
                  <p style={styles.userText}>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.assistantRow}>
              <div style={styles.assistantBubble}>
                <LoadingDots />
              </div>
            </div>
          )}

          {error && (
            <div style={styles.errorRow}>
              <span style={styles.errorText}>⚠️ {error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <div style={styles.inputWrapper}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hacé tu consulta jurídico-penal..."
              rows={1}
              disabled={loading}
            />
            <button
              style={{
                ...styles.sendBtn,
                opacity: !input.trim() || loading ? 0.5 : 1,
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              }}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Enviar"
            >
              ↑
            </button>
          </div>
          <p style={styles.inputHint}>
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────
// COMPONENTE: Indicador de carga
// ────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            ...styles.dot,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────
function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

const EJEMPLOS = [
  "¿Cuándo conviene pedir el sobreseimiento en la IPP?",
  "¿Cómo planteo una nulidad por falta de notificación?",
  "¿Qué argumentos necesito para una excarcelación?",
  "¿Cuándo es viable la probation?",
];

// ────────────────────────────────────────────────
// ESTILOS
// ────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  app: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#f5f5f0",
  },

  // Sidebar
  sidebar: {
    width: 260,
    minWidth: 260,
    background: "#1a2e4a",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    gap: 16,
  },
  logo: {
    display: "flex",
    flexDirection: "column",
    paddingBottom: 16,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoTitle: {
    color: "#c9a84c",
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  newChatBtn: {
    background: "rgba(201,168,76,0.15)",
    border: "1px solid rgba(201,168,76,0.4)",
    color: "#c9a84c",
    borderRadius: 8,
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    textAlign: "left" as const,
    transition: "background 0.2s",
  },
  sidebarInfo: {
    marginTop: "auto",
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  sidebarLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  sidebarSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    lineHeight: 1.5,
  },
  sidebarFooter: {
    marginTop: 12,
  },
  footerText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
  },

  // Main
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px 24px",
    borderBottom: "1px solid #e0e0da",
    background: "#ffffff",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a2e4a",
  },
  headerBadge: {
    background: "#f0e8d0",
    color: "#8a6520",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 99,
    letterSpacing: 0.5,
  },

  // Mensajes
  messagesArea: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  // Bienvenida
  welcome: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    textAlign: "center" as const,
    padding: "40px 24px",
    gap: 12,
  },
  welcomeIcon: { fontSize: 48, marginBottom: 8 },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a2e4a",
  },
  welcomeText: {
    fontSize: 15,
    color: "#666",
    maxWidth: 460,
    lineHeight: 1.6,
  },
  examplesGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 16,
    width: "100%",
    maxWidth: 520,
  },
  exampleBtn: {
    background: "#ffffff",
    border: "1px solid #e0e0da",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    color: "#1a2e4a",
    cursor: "pointer",
    textAlign: "left" as const,
    lineHeight: 1.4,
    transition: "border-color 0.2s",
  },

  // Burbujas
  userRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  assistantRow: {
    display: "flex",
    justifyContent: "flex-start",
  },
  userBubble: {
    background: "#1a2e4a",
    color: "#ffffff",
    borderRadius: "18px 18px 4px 18px",
    padding: "12px 16px",
    maxWidth: "72%",
  },
  userText: {
    fontSize: 15,
    lineHeight: 1.6,
  },
  assistantBubble: {
    background: "#ffffff",
    border: "1px solid #e8e8e4",
    borderRadius: "18px 18px 18px 4px",
    padding: "14px 18px",
    maxWidth: "80%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  assistantContent: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#2a2a2a",
  },

  // Error
  errorRow: {
    display: "flex",
    justifyContent: "center",
  },
  errorText: {
    color: "#c0392b",
    fontSize: 14,
    background: "#fdf0ee",
    padding: "8px 16px",
    borderRadius: 8,
  },

  // Input
  inputArea: {
    borderTop: "1px solid #e0e0da",
    background: "#ffffff",
    padding: "16px 24px 12px",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    background: "#f5f5f0",
    border: "1.5px solid #e0e0da",
    borderRadius: 14,
    padding: "8px 10px 8px 16px",
    transition: "border-color 0.2s",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none" as const,
    fontSize: 15,
    lineHeight: 1.6,
    color: "#1a2e4a",
    fontFamily: "inherit",
    minHeight: 28,
    maxHeight: 160,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#1a2e4a",
    color: "#ffffff",
    border: "none",
    fontSize: 18,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.2s",
  },
  inputHint: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 6,
    paddingLeft: 4,
  },

  // Loading
  dots: {
    display: "flex",
    gap: 5,
    padding: "4px 0",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#1a2e4a",
    display: "inline-block",
    animation: "bounce 1.4s infinite ease-in-out",
  },
};
