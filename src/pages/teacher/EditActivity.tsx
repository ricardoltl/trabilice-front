import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Question {
  id?: string;
  statement: string;
  type: "multiple_choice" | "open";
  options: string[] | null;
  correct_answer: string;
}

export default function EditActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [id]);

  async function loadActivity() {
    try {
      const { data } = await api.get(`/activities/${id}`);
      setActivity(data);
      setQuestions(data.questions || []);
    } catch {}
  }

  function updateQuestion(index: number, field: keyof Question, value: any) {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) => {
      const updated = [...prev];
      const options = [...(updated[qIndex].options || [])];
      options[oIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { statement: "", type: "multiple_choice", options: ["", "", "", ""], correct_answer: "" },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/activities/${id}/questions`, { questions });
    } catch {}
    setSaving(false);
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await api.put(`/activities/${id}/questions`, { questions });
      await api.patch(`/activities/${id}/publish`);
      navigate(-1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao publicar");
    }
    setPublishing(false);
  }

  if (!activity) return <div className="loading">Carregando...</div>;

  return (
    <>
      <div className="nav-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>Voltar</button>
        <h2>Editar</h2>
        <button className="btn btn-small btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="container">
        <h1 style={{ fontSize: "1.2rem", marginBottom: 4 }}>{activity.title}</h1>
        <p className="text-muted text-small mb-16">{activity.description}</p>

        {questions.map((q, qi) => (
          <div key={qi} className="question-card">
            <div className="flex-between">
              <div className="question-number">Questão {qi + 1}</div>
              <button className="back-btn" style={{ color: "var(--danger)", fontSize: "0.8rem" }} onClick={() => removeQuestion(qi)}>
                Remover
              </button>
            </div>

            <div className="input-group">
              <textarea
                value={q.statement}
                onChange={(e) => updateQuestion(qi, "statement", e.target.value)}
                placeholder="Enunciado da questão"
                rows={2}
              />
            </div>

            {q.type === "multiple_choice" && q.options?.map((opt, oi) => (
              <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: `2px solid ${q.correct_answer === opt && opt ? "var(--success)" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    fontSize: "0.9rem",
                  }}
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  placeholder={`Opção ${String.fromCharCode(65 + oi)}`}
                />
                <button
                  style={{
                    padding: "10px",
                    border: `2px solid ${q.correct_answer === opt && opt ? "var(--success)" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    background: q.correct_answer === opt && opt ? "#DCFCE7" : "white",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => updateQuestion(qi, "correct_answer", opt)}
                  title="Marcar como correta"
                >
                  {q.correct_answer === opt && opt ? "Correta" : "Marcar"}
                </button>
              </div>
            ))}
          </div>
        ))}

        <button className="btn btn-secondary mb-16" onClick={addQuestion}>
          + Adicionar Questão
        </button>

        {!activity.published && (
          <button className="btn btn-success" onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publicando..." : "Publicar Atividade"}
          </button>
        )}
      </div>
    </>
  );
}
