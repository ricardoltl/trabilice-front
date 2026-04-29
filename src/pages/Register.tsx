import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Register() {
  const [name, setName] = useState("");
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
      const { data } = await api.post("/auth/register", { name, email, password });
      login(data.token, data.user);
      navigate("/teacher");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: "10vh" }}>
      <button className="back-btn" onClick={() => navigate("/")}>← Voltar</button>
      <h1 style={{ margin: "24px 0" }}>Cadastro Professor</h1>

      {error && <div className="error-msg">{error}</div>}

      <GoogleSignInButton text="signup_with" onError={setError} />

      <div className="auth-divider"><span>ou</span></div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="professor@email.com" required />
        </div>
        <div className="input-group">
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center mt-16 text-small text-muted">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
