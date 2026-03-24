import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CreateActivity() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    try {
      // Create activity
      const { data: activity } = await api.post("/activities", {
        classroom_id: classroomId,
        title,
        description: prompt,
      });

      // Generate questions
      await api.post(`/activities/${activity.id}/generate-questions`, {
        prompt: prompt || title,
        questionCount: 5,
      });

      navigate(`/teacher/activity/${activity.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar atividade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="nav-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>Voltar</button>
        <h2>Nova Atividade</h2>
        <span></span>
      </div>

      <div className="container">
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleCreate}>
          <div className="input-group">
            <label>Título da atividade</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Frações 6º ano"
              required
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Descreva o que deseja (opcional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: 5 questões de múltipla escolha sobre frações para 6º ano"
              rows={3}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Gerando questões..." : "Gerar Atividade"}
          </button>
        </form>
      </div>
    </>
  );
}
