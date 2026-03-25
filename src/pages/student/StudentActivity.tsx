import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTutorialAutoStart } from "../../components/AliceTutorial";
import api from "../../services/api";

export default function StudentActivity() {
  useTutorialAutoStart("student-activity");
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Telemetry refs (não causam re-render)
  const startedAt = useRef<string>(new Date().toISOString());
  const tabSwitches = useRef(0);
  const questionTimes = useRef<{ question_id: string; time_seconds: number }[]>([]);
  const questionStartedAt = useRef<number>(Date.now());

  useEffect(() => {
    loadActivity();

    function onVisibilityChange() {
      if (document.hidden) {
        tabSwitches.current += 1;
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [id]);

  // Reinicia o cronômetro da questão sempre que o índice muda
  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, [currentIndex]);

  async function loadActivity() {
    try {
      const { data } = await api.get(`/activities/${id}`);
      setActivity(data);
    } catch {}
  }

  function recordCurrentQuestionTime() {
    const question = activity.questions[currentIndex];
    const elapsed = Math.round((Date.now() - questionStartedAt.current) / 1000);
    questionTimes.current.push({ question_id: question.id, time_seconds: elapsed });
  }

  function handleNext() {
    recordCurrentQuestionTime();
    setCurrentIndex((i) => i + 1);
  }

  function handlePrev() {
    setCurrentIndex((i) => i - 1);
    // Reinicia o cronômetro sem registrar (o tempo já foi registrado ou será ao avançar)
    questionStartedAt.current = Date.now();
  }

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function handleSubmit() {
    if (!activity) return;

    recordCurrentQuestionTime();

    const unanswered = activity.questions.filter((q: any) => !answers[q.id]);
    if (unanswered.length > 0) {
      if (!confirm(`Você deixou ${unanswered.length} questão(ões) sem responder. Deseja enviar mesmo assim?`)) {
        return;
      }
    }

    const completionSeconds = Math.round((Date.now() - new Date(startedAt.current).getTime()) / 1000);

    setSubmitting(true);
    try {
      await api.post("/submissions", {
        activity_id: id,
        answers: activity.questions.map((q: any) => ({
          question_id: q.id,
          answer: answers[q.id] || "",
        })),
        telemetry: {
          started_at: startedAt.current,
          completion_time_seconds: completionSeconds,
          tab_switches: tabSwitches.current,
          question_times: questionTimes.current,
        },
      });
      navigate(`/student/activity/${id}/result`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao enviar respostas");
    }
    setSubmitting(false);
  }

  if (!activity) return <div className="loading">Carregando...</div>;

  const questions = activity.questions;
  const totalQuestions = questions.length;
  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate("/student")}>← Voltar</button>
        <h2>{answeredCount}/{totalQuestions}</h2>
        <span></span>
      </div>

      <div className="container">
        <h1 style={{ fontSize: "1.2rem", marginBottom: 4 }}>{activity.title}</h1>
        <p className="text-muted text-small mb-16">{activity.description}</p>

        {/* Progress bar */}
        <div style={{ height: 4, background: "var(--border)", borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
              background: "var(--primary)",
              borderRadius: 4,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div className="question-card" data-tutorial-id="question-card">
          <div className="question-number">Questão {currentIndex + 1} de {totalQuestions}</div>
          <h3>{question.statement}</h3>

          {question.type === "multiple_choice" && question.options?.map((opt: string, oi: number) => (
            <button
              key={oi}
              className={`option-btn ${answers[question.id] === opt ? "selected" : ""}`}
              onClick={() => selectAnswer(question.id, opt)}
            >
              <strong>{String.fromCharCode(65 + oi)}.</strong> {opt}
            </button>
          ))}

          {question.type === "open" && (
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
              value={answers[question.id] || ""}
              onChange={(e) => selectAnswer(question.id, e.target.value)}
            />
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }} data-tutorial-id="question-nav">
          {currentIndex > 0 && (
            <button className="btn btn-secondary" onClick={handlePrev} style={{ flex: 1 }}>
              Anterior
            </button>
          )}

          {!isLast ? (
            <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
              Próxima
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ flex: 1 }}
              data-tutorial-id="btn-submit"
            >
              {submitting ? "Enviando..." : "Enviar Respostas"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
