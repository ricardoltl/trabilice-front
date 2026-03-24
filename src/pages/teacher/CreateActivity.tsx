import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CreateActivity() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState<"multiple_choice" | "open" | "mixed">("multiple_choice");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    try {
      const { data: activity } = await api.post("/activities", {
        classroom_id: classroomId,
        title,
        description: prompt,
      });

      await api.post(`/activities/${activity.id}/generate-questions`, {
        prompt: prompt || title,
        questionCount,
        questionType,
      });

      navigate(`/teacher/activity/${activity.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar atividade");
    } finally {
      setLoading(false);
    }
  }

  const typeLabel: Record<string, string> = {
    multiple_choice: "Múltipla escolha",
    open: "Abertas (dissertativas)",
    mixed: "Misto (metade cada)",
  };

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
            <label>Descreva o conteúdo (opcional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Trigonometria básica para o 7º ano"
              rows={3}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Quantidade de questões</label>
              <input
                type="number"
                min={1}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
              <label>Tipo de questão</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.9rem",
                  background: "white",
                }}
              >
                {Object.entries(typeLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {questionType === "mixed" && (
            <p className="text-small text-muted" style={{ marginBottom: 16 }}>
              Serão geradas {Math.ceil(questionCount / 2)} de múltipla escolha e {Math.floor(questionCount / 2)} abertas.
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Gerando questões..." : "Gerar Atividade"}
          </button>
        </form>
      </div>
    </>
  );
}
