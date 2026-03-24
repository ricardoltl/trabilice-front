import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function StudentJoin() {
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/student-login", {
        accessKey: accessKey.toUpperCase(),
      });
      login(data.token, data.user);
      navigate("/student");
    } catch (err: any) {
      setError(err.response?.data?.error || "Chave de acesso inválida");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: "10vh" }}>
      <button className="back-btn" onClick={() => navigate("/")}>Voltar</button>
      <h1 style={{ margin: "24px 0" }}>Entrar como Aluno</h1>
      <p className="text-muted mb-16">Digite sua chave de acesso para entrar.</p>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label>Chave de acesso</label>
          <input
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
            placeholder="Ex: AB3KX7NP"
            maxLength={8}
            style={{ letterSpacing: "0.3em", fontWeight: 700, textAlign: "center", fontSize: "1.2rem" }}
            required
            autoFocus
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-small text-muted" style={{ marginTop: 24, textAlign: "center" }}>
        Não tem uma chave? Peça ao seu professor para gerar um convite.
      </p>
    </div>
  );
}
