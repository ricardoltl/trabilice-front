import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const STATUS_MESSAGES = [
  "Analisando o conteúdo...",
  "Gerando questões com IA...",
  "Revisando as respostas...",
  "Finalizando a atividade...",
];

function CheckIcon() {
  return (
    <svg
      className="success-check-svg"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="check-circle"
        cx="50"
        cy="50"
        r="45"
        stroke="#22C55E"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <polyline
        className="check-mark"
        points="28,52 43,68 72,32"
        stroke="#22C55E"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CreateActivity() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState<"multiple_choice" | "open" | "mixed">("multiple_choice");
  const [error, setError] = useState("");

  // Geração
  const [phase, setPhase] = useState<"idle" | "loading" | "success">("idle");
  const [statusIdx, setStatusIdx] = useState(0);
  const [progressDone, setProgressDone] = useState(false);
  const [successActivityId, setSuccessActivityId] = useState<string | null>(null);

  const statusTimerRef = useRef<any>(null);

  useEffect(() => {
    if (phase === "loading") {
      setStatusIdx(0);
      let idx = 0;
      statusTimerRef.current = setInterval(() => {
        idx = Math.min(idx + 1, STATUS_MESSAGES.length - 1);
        setStatusIdx(idx);
      }, 2200);
    }
    return () => clearInterval(statusTimerRef.current);
  }, [phase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setProgressDone(false);
    setPhase("loading");

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

      clearInterval(statusTimerRef.current);
      setProgressDone(true);
      setSuccessActivityId(activity.id);

      // Pequeno delay para a barra chegar a 100% antes de mostrar o check
      setTimeout(() => setPhase("success"), 400);
    } catch (err: any) {
      clearInterval(statusTimerRef.current);
      setPhase("idle");
      setError(err.response?.data?.error || "Erro ao criar atividade");
    }
  }

  const typeLabel: Record<string, string> = {
    multiple_choice: "Múltipla escolha",
    open: "Abertas (dissertativas)",
    mixed: "Misto (metade cada)",
  };

  // ── Loading overlay ───────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="ai-overlay">
        <div className="ai-overlay-logo">Trabilice</div>

        <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 24, color: "var(--text)" }}>
            Criando "{title}"
          </div>

          <div className="ai-progress-track">
            <div className={`ai-progress-bar${progressDone ? " done" : ""}`} />
          </div>

          <p className="ai-status">{STATUS_MESSAGES[statusIdx]}</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", opacity: 0.6 }}>
            Isso pode levar alguns segundos
          </p>
        </div>
      </div>
    );
  }

  // ── Success overlay ───────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="success-overlay">
        <CheckIcon />

        <h2 className="success-title">Atividade criada!</h2>
        <p className="success-subtitle">
          As questões foram geradas com sucesso.<br />
          Revise antes de publicar para os alunos.
        </p>

        <div className="success-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/teacher/activity/${successActivityId}/edit`)}
          >
            Revisar questões
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/teacher/classroom/${classroomId}`)}
          >
            Voltar para a turma
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate(-1)}>← Voltar</button>
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
              <label>Questões</label>
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
                  padding: "12px 14px",
                  border: "2px solid var(--border)",
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

          <button className="btn btn-primary" type="submit">
            Gerar Atividade com IA
          </button>
        </form>
      </div>
    </>
  );
}
