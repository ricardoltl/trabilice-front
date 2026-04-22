import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CreateLessonPlan() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/lesson-plans", {
        classroom_id: classroomId,
        title,
        topic,
      });
      navigate(`/teacher/lesson-plan/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar planejamento");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="ai-overlay">
        <div className="ai-overlay-logo">Trabilice</div>
        <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 24, color: "var(--text)" }}>
            Criando "{title}"
          </div>
          <div className="ai-progress-track">
            <div className="ai-progress-bar" />
          </div>
          <p className="ai-status">Gerando esqueleto inicial do plano...</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", opacity: 0.6 }}>
            Isso pode levar alguns segundos
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate(-1)}>← Voltar</button>
        <h2>Novo Planejamento</h2>
        <span></span>
      </div>

      <div className="container">
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleCreate}>
          <div className="input-group">
            <label>Título do planejamento</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aula 1 — Introdução à Revolução Francesa"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label>Tema / ementa (opcional)</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Descreva o tema, ano escolar, objetivos gerais, contexto da turma..."
              rows={5}
            />
          </div>

          <p className="text-small text-muted" style={{ marginBottom: 16 }}>
            O copiloto vai gerar um esqueleto inicial que você pode refinar conversando.
          </p>

          <button className="btn btn-primary" type="submit">
            Criar com copiloto
          </button>
        </form>
      </div>
    </>
  );
}
