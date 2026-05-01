import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api, { describeError } from "../services/api";

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.role !== "teacher" || user.email_verified || !user.email || dismissed) {
    return null;
  }

  async function resend() {
    setSending(true);
    try {
      await api.post("/auth/resend-verification", { email: user!.email });
      setSent(true);
    } catch (err) {
      alert(describeError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
        borderBottom: "1px solid #F59E0B",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
        fontSize: "0.88rem",
        color: "#92400E",
      }}
    >
      {sent ? (
        <>
          <span>✓ Email reenviado para <strong>{user.email}</strong>. Verifique sua caixa de entrada.</span>
          <button
            onClick={() => setDismissed(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", fontSize: "1.1rem", padding: 4 }}
            title="Fechar"
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <span>
            ✉️ Confirme seu email <strong>{user.email}</strong> — enviamos um link no cadastro.
          </span>
          <button
            onClick={resend}
            disabled={sending}
            className="btn btn-small"
            style={{ background: "#92400E", color: "white", border: "none", padding: "4px 12px" }}
          >
            {sending ? "Enviando..." : "Reenviar email"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", fontSize: "1.1rem", padding: 4 }}
            title="Fechar"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
