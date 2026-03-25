import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function StudentResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadResult();
  }, [id]);

  async function loadResult() {
    try {
      const { data } = await api.get(`/submissions/my/${id}`);
      setResult(data);
    } catch {}
  }

  if (!result) return <div className="loading">Carregando...</div>;

  const hasPending = result.pendingReview > 0;

  function getScoreColor(score: number) {
    if (score >= 70) return "var(--success)";
    if (score >= 40) return "var(--warning)";
    return "var(--danger)";
  }

  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate("/student")}>← Voltar</button>
        <h2>Resultado</h2>
        <span></span>
      </div>

      <div className="container">
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          {hasPending ? (
            <>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "#F3F4F6",
                  border: "3px solid #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  margin: "0 auto 12px",
                }}
              >
                ✏️
              </div>
              <h2>Aguardando correção</h2>
              <p className="text-muted mt-8">
                {result.pendingReview === result.totalQuestions
                  ? "O professor ainda não corrigiu sua atividade."
                  : `${result.pendingReview} questão${result.pendingReview > 1 ? "s abertas aguardam" : " aberta aguarda"} correção do professor.`}
              </p>
            </>
          ) : (
            <>
              <div
                className="score-circle"
                style={{
                  width: 100,
                  height: 100,
                  fontSize: "1.8rem",
                  margin: "0 auto 12px",
                  background: getScoreColor(result.score),
                }}
              >
                {result.score}%
              </div>
              <h2>{result.correctAnswers} de {result.totalQuestions} acertos</h2>
              <p className="text-muted mt-8">
                {result.score >= 70
                  ? "Ótimo trabalho!"
                  : result.score >= 40
                  ? "Bom esforço! Continue praticando."
                  : "Não desista! Revise o conteúdo e tente novamente."}
              </p>
            </>
          )}
        </div>

        <h3 style={{ marginBottom: 12 }}>Suas respostas</h3>

        {result.answers.map((a: any, i: number) => {
          const isPending = a.type === "open" && a.is_correct === null;
          const isOpen = a.type === "open";

          return (
            <div key={i} className="question-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div className="question-number">Questão {i + 1}</div>
                {isPending && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#FEF9C3",
                      border: "1px solid #FDE047",
                      borderRadius: 4,
                      padding: "2px 6px",
                    }}
                  >
                    Aguardando correção
                  </span>
                )}
                {!isPending && isOpen && a.is_correct === true && (
                  <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 600 }}>✓ Correto</span>
                )}
                {!isPending && isOpen && a.is_correct === false && (
                  <span style={{ fontSize: "0.75rem", color: "var(--danger)", fontWeight: 600 }}>✗ Incorreto</span>
                )}
              </div>

              <h3 style={{ marginBottom: 8 }}>{a.question}</h3>

              <div style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 4 }}>
                <span className="text-small" style={{ color: "var(--text-secondary)" }}>Sua resposta: </span>
                <strong
                  style={{
                    color: isPending
                      ? "var(--text-primary)"
                      : a.is_correct
                      ? "var(--success)"
                      : "var(--danger)",
                  }}
                >
                  {a.your_answer || "(sem resposta)"}
                </strong>
              </div>

              {/* Multiple choice wrong: show correct answer */}
              {!isOpen && !a.is_correct && (
                <div style={{ padding: "8px 12px", borderRadius: 8 }}>
                  <span className="text-small" style={{ color: "var(--text-secondary)" }}>Resposta correta: </span>
                  <strong style={{ color: "var(--success)" }}>{a.correct_answer}</strong>
                </div>
              )}
            </div>
          );
        })}

        <button className="btn btn-primary" onClick={() => navigate("/student")} style={{ marginBottom: 32 }}>
          Voltar ao início
        </button>
      </div>
    </>
  );
}
