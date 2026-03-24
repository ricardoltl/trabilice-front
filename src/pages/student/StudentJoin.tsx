import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function StudentJoin() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/join", {
        name,
        classroomCode: code.toUpperCase(),
      });
      login(data.token, data.user);
      navigate("/student");
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao entrar na turma");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: "10vh" }}>
      <button className="back-btn" onClick={() => navigate("/")}>Voltar</button>
      <h1 style={{ margin: "24px 0" }}>Entrar na Turma</h1>
      <p className="text-muted mb-16">Digite seu nome e o código que o professor compartilhou.</p>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleJoin}>
        <div className="input-group">
          <label>Seu nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você se chama?" required autoFocus />
        </div>
        <div className="input-group">
          <label>Código da turma</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: ABC123"
            maxLength={6}
            style={{ letterSpacing: "0.3em", fontWeight: 700, textAlign: "center", fontSize: "1.2rem" }}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
