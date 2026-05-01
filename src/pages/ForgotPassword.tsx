import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { describeError } from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: "8vh", maxWidth: 420 }}>
      <button className="back-btn" onClick={() => navigate("/login")}>← Voltar</button>

      <div style={{ textAlign: "center", margin: "24px 0 28px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
          Esqueci minha senha
        </h1>
        <p className="text-muted text-small" style={{ marginTop: 8 }}>
          Digite seu email cadastrado e enviaremos um link para você criar uma nova senha.
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {sent ? (
        <div className="card" style={{ background: "#DCFCE7", border: "1px solid #22C55E" }}>
          <h3 style={{ color: "#14532D", marginBottom: 8 }}>Link enviado ✉️</h3>
          <p style={{ color: "#14532D", fontSize: "0.92rem" }}>
            Se este email estiver cadastrado no Trabilice, você receberá um link para redefinir
            sua senha em alguns instantes. O link é válido por 1 hora.
          </p>
          <p style={{ color: "#14532D", fontSize: "0.85rem", marginTop: 12 }}>
            Não recebeu? Verifique a caixa de spam ou tente novamente em alguns minutos.
          </p>
          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ marginTop: 16, display: "block", textAlign: "center", textDecoration: "none" }}
          >
            Voltar para login
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@email.com"
                required
                autoFocus
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>

          <div
            className="card"
            style={{ marginTop: 24, background: "var(--primary-light)", border: "1px solid var(--primary-mid)" }}
          >
            <p style={{ fontSize: "0.85rem", color: "var(--text)" }}>
              <strong>Cadastrou com Google?</strong>
              <br />
              Volte ao <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>login</Link> e use o
              botão "Entrar com Google" — não precisa de senha.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
