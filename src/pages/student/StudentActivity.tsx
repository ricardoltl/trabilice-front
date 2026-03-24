import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function StudentActivity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [id]);

  async function loadActivity() {
    try {
      const { data } = await api.get(`/activities/${id}`);
      setActivity(data);
    } catch {}
  }

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function handleSubmit() {
    if (!activity) return;

    const unanswered = activity.questions.filter((q: any) => !answers[q.id]);
    if (unanswered.length > 0) {
      if (!confirm(`Você deixou ${unanswered.length} questão(ões) sem responder. Deseja enviar mesmo assim?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post("/submissions", {
        activity_id: id,
        answers: activity.questions.map((q: any) => ({
          question_id: q.id,
          answer: answers[q.id] || "",
        })),
      });
      navigate(`/student/activity/${id}/result`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao enviar respostas");
    }
    setSubmitting(false);
  }

  if (!activity) return <div className="loading">Carregando...</div>;

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = activity.questions.length;

  return (
    <>
      <div className="nav-bar">
        <button className="back-btn" onClick={() => navigate("/student")}>Voltar</button>
        <h2>{answeredCount}/{totalQuestions}</h2>
        <span></span>
      </div>

      <div className="container">
        <h1 style={{ fontSize: "1.2rem", marginBottom: 4 }}>{activity.title}</h1>
        <p className="text-muted text-small mb-16">{activity.description}</p>

        {activity.questions.map((q: any, qi: number) => (
          <div key={q.id} className="question-card">
            <div className="question-number">Questão {qi + 1} de {totalQuestions}</div>
            <h3>{q.statement}</h3>

            {q.type === "multiple_choice" && q.options?.map((opt: string, oi: number) => (
              <button
                key={oi}
                className={`option-btn ${answers[q.id] === opt ? "selected" : ""}`}
                onClick={() => selectAnswer(q.id, opt)}
              >
                <strong>{String.fromCharCode(65 + oi)}.</strong> {opt}
              </button>
            ))}

            {q.type === "open" && (
              <textarea
                style={{
                  width: "100%",
                  padding: 12,
                  border: "2px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: "1rem",
                }}
                rows={3}
                placeholder="Digite sua resposta..."
                value={answers[q.id] || ""}
                onChange={(e) => selectAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <button
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ marginBottom: 32 }}
        >
          {submitting ? "Enviando..." : "Enviar Respostas"}
        </button>
      </div>
    </>
  );
}
