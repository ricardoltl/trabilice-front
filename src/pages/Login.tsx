import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate(data.user.role === "teacher" ? "/teacher" : "/student");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: "8vh", maxWidth: 420 }}>
      <button className="back-btn" onClick={() => navigate("/")}>← Voltar</button>

      <div style={{ textAlign: "center", margin: "24px 0 28px" }}>
        <img
          src="/android-chrome-192x192.png"
          alt="Alice"
          style={{
            width: 72,
            height: 72,
            marginBottom: 12,
            filter: "drop-shadow(0 6px 16px rgba(124,58,237,0.3))",
          }}
        />
        <h1 style={{
          fontSize: "1.8rem",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          background: "linear-gradient(135deg, var(--primary), #A855F7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          padding: "2px 4px",
        }}>
          Trabilice
        </h1>
        <p className="text-muted text-small">Bem-vindo de volta, professor</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <GoogleSignInButton text="signin_with" onError={setError} />

      <div className="auth-divider"><span>ou</span></div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="professor@email.com"
            required
          />
        </div>
        <div className="input-group">
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center mt-16 text-small text-muted">
        <Link to="/forgot-password">Esqueci minha senha</Link>
      </p>

      <p className="text-center text-small text-muted" style={{ marginTop: 8 }}>
        Não tem conta? <Link to="/register">Cadastre-se</Link>
      </p>
    </div>
  );
}
