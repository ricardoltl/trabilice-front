import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api, { describeError } from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="container" style={{ paddingTop: "10vh", maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.4rem", color: "var(--danger)" }}>Link inválido</h1>
        <p className="text-muted" style={{ marginTop: 12 }}>
          Este link está incompleto. Solicite um novo email de redefinição.
        </p>
        <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 24, display: "inline-block", textDecoration: "none" }}>
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container" style={{ paddingTop: "10vh", maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.4rem", color: "var(--success)" }}>Senha redefinida! ✓</h1>
        <p className="text-muted" style={{ marginTop: 12 }}>
          Sua nova senha já está ativa. Você pode entrar agora.
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/login")} style={{ marginTop: 24 }}>
          Ir para o login
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "8vh", maxWidth: 420 }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)", textAlign: "center", marginTop: 24 }}>
        Nova senha
      </h1>
      <p className="text-muted text-small" style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
        Escolha uma nova senha para sua conta.
      </p>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            autoFocus
          />
        </div>
        <div className="input-group">
          <label>Confirmar senha</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Digite novamente"
            minLength={8}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </div>
  );
}
