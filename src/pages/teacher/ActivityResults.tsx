import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ActivityResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [classroom, setClassroom] = useState<any>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [grading, setGrading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [actRes, subRes] = await Promise.all([
        api.get(`/activities/${id}`),
        api.get(`/submissions/activity/${id}`),
      ]);
      setActivity(actRes.data);
      setResults(subRes.data);

      const classRes = await api.get(`/classrooms/${actRes.data.classroom_id}`);
      setClassroom(classRes.data);
    } catch {}
  }

  async function handleGrade(answerId: string, isCorrect: boolean) {
    setGrading(answerId);
    try {
      await api.patch(`/submissions/answers/${answerId}/grade`, { is_correct: isCorrect });
      // Reload to reflect updated scores
      const subRes = await api.get(`/submissions/activity/${id}`);
      setResults(subRes.data);
    } catch {}
    setGrading(null);
  }

  if (!activity || !results) return <div className="loading">Carregando...</div>;

  const { summary, questionStats, students } = results;

  // Se a atividade tem assignments, considerar apenas os alunos atribuídos
  const assignedTo: string[] | undefined = activity.assignedTo;
  const relevantStudents = assignedTo
    ? (classroom?.students || []).filter((s: any) => assignedTo.includes(s.id))
    : (classroom?.students || []);
  const totalStudents = relevantStudents.length;
  const pendingCount = totalStudents - summary.totalSubmissions;
  const totalPendingReview = students.reduce((sum: number, s: any) => sum + (s.pendingReview || 0), 0);

  function getScoreColor(score: number) {
    if (score >= 70) return "var(--success)";
    if (score >= 40) return "var(--warning)";
    return "var(--danger)";
  }

  function formatTime(seconds: number | null): string {
    if (seconds === null) return "—";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
  }

  function getTimeLabel(seconds: number, avgSeconds: number | null): string {
    if (!avgSeconds) return formatTime(seconds);
    const ratio = seconds / avgSeconds;
    if (ratio < 0.5) return `${formatTime(seconds)} (muito rápido)`;
    if (ratio < 0.8) return `${formatTime(seconds)} (abaixo da média)`;
    if (ratio > 2.0) return `${formatTime(seconds)} (muito lento)`;
    if (ratio > 1.3) return `${formatTime(seconds)} (acima da média)`;
    return `${formatTime(seconds)} (na média)`;
  }

  function getBehaviorPattern(s: any): string {
    const fast = s.completion_time_seconds !== null && summary.avg_completion_time_seconds !== null
      && s.completion_time_seconds < summary.avg_completion_time_seconds * 0.7;
    const slow = s.completion_time_seconds !== null && summary.avg_completion_time_seconds !== null
      && s.completion_time_seconds > summary.avg_completion_time_seconds * 1.4;
    const highScore = s.score >= 70;
    const lowScore = s.score < 40;

    if (fast && highScore) return "Respondeu rápido e com alta precisão. Provavelmente já dominava o conteúdo.";
    if (fast && lowScore) return "Respondeu rápido mas com baixa precisão. Possível chute.";
    if (fast) return "Respondeu abaixo da média de tempo, com desempenho razoável.";
    if (slow && highScore) return "Demorou mais que a média, mas com boa precisão. Reflete bem antes de responder.";
    if (slow && lowScore) return "Demorou e teve baixo desempenho. Pode estar com dificuldade no conteúdo.";
    if (lowScore) return "Baixo desempenho. Vale reforçar o conteúdo com este aluno.";
    return "";
  }

  const pendingStudents = relevantStudents.filter(
    (st: any) => !students.find((s: any) => s.student.id === st.id)
  );

  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate(-1)}>← Voltar</button>
        <h2>Resultados</h2>
        <span></span>
      </div>

      <div className="container">
        <h1 style={{ fontSize: "1.2rem", marginBottom: 16 }}>{activity.title}</h1>

        {totalPendingReview > 0 && (
          <div
            style={{
              background: "#FEF9C3",
              border: "1px solid #FDE047",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: "0.85rem",
            }}
          >
            <strong>{totalPendingReview}</strong> resposta{totalPendingReview > 1 ? "s abertas aguardam" : " aberta aguarda"} sua correção.
            Expanda os alunos abaixo para corrigir.
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div className="card" style={{ textAlign: "center", margin: 0 }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>
              {summary.totalSubmissions}
            </div>
            <div className="text-small text-muted">Responderam</div>
          </div>
          <div className="card" style={{ textAlign: "center", margin: 0 }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--warning)" }}>
              {pendingCount > 0 ? pendingCount : 0}
            </div>
            <div className="text-small text-muted">Pendentes</div>
          </div>
          <div className="card" style={{ textAlign: "center", margin: 0 }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: getScoreColor(summary.averageScore) }}>
              {summary.averageScore}%
            </div>
            <div className="text-small text-muted">Média da turma</div>
          </div>
          {summary.avg_completion_time_seconds !== null && (
            <div className="card" style={{ textAlign: "center", margin: 0 }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>
                {formatTime(summary.avg_completion_time_seconds)}
              </div>
              <div className="text-small text-muted">Tempo médio</div>
            </div>
          )}
        </div>

        {/* Per-question stats */}
        {questionStats.length > 0 && (
          <>
            <h3 style={{ marginBottom: 12 }}>Desempenho por questão</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {questionStats.map((q: any, i: number) => (
                <div key={q.question_id} className="card" style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <span className="text-small text-muted">
                        Q{i + 1} · {q.type === "open" ? "Aberta" : "Múltipla escolha"} ·{" "}
                      </span>
                      <span style={{ fontSize: "0.85rem" }}>{q.statement}</span>
                    </div>
                    {q.type === "open" ? (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {q.pendingCount > 0 ? `${q.pendingCount} pendente${q.pendingCount > 1 ? "s" : ""}` : `${q.correctPercent}%`}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: getScoreColor(q.correctPercent),
                          whiteSpace: "nowrap",
                        }}
                      >
                        {q.correctPercent}%
                      </span>
                    )}
                  </div>
                  {q.type !== "open" && (
                    <div style={{ marginTop: 6, height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${q.correctPercent}%`,
                          background: getScoreColor(q.correctPercent),
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  )}
                  <div className="text-small text-muted" style={{ marginTop: 4 }}>
                    {q.type === "open"
                      ? `${q.totalAnswered} responderam · ${q.totalAnswered - q.pendingCount} corrigidas`
                      : `${q.correctCount} de ${q.totalAnswered} acertaram`}
                    {q.avg_time_seconds !== null && (
                      <span style={{ marginLeft: 8 }}>· tempo médio: {formatTime(q.avg_time_seconds)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Per-student results */}
        <h3 style={{ marginBottom: 12 }}>Alunos</h3>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {students.length === 0 && pendingStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 20px" }}>
              <p>Nenhum aluno respondeu ainda</p>
            </div>
          ) : (
            <>
              {students.map((s: any, si: number) => (
                <div key={s.id}>
                  <div
                    className="student-row"
                    style={{
                      cursor: "pointer",
                      padding: "14px 16px",
                      borderBottom: expandedStudent === s.id ? "none" : "1px solid var(--border)",
                      borderTop: si > 0 ? "none" : undefined,
                    }}
                    onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.student.name}</div>
                      <div className="text-small text-muted">
                        {s.correctAnswers}/{s.totalQuestions - s.pendingReview} acertos
                        {s.pendingReview > 0 && (
                          <span style={{ color: "var(--warning)", marginLeft: 6 }}>
                            · {s.pendingReview} pendente{s.pendingReview > 1 ? "s" : ""}
                          </span>
                        )}
                        {s.completion_time_seconds !== null && (
                          <span style={{ marginLeft: 6 }}>
                            · {getTimeLabel(s.completion_time_seconds, summary.avg_completion_time_seconds)}
                          </span>
                        )}
                        {s.tab_switches > 0 && (
                          <span style={{ color: s.tab_switches >= 3 ? "var(--danger)" : "var(--warning)", marginLeft: 6 }}>
                            · {s.tab_switches}x fora da aba
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {s.pendingReview > 0 ? (
                        <span className="badge badge-warning">Corrigir</span>
                      ) : (
                        <div className="score-circle" style={{ background: getScoreColor(s.score) }}>
                          {s.score}%
                        </div>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {expandedStudent === s.id ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {expandedStudent === s.id && (
                    <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>

                      {/* Comportamento */}
                      {(s.completion_time_seconds !== null || s.tab_switches > 0 || getBehaviorPattern(s)) && (
                        <div style={{
                          background: "var(--primary-light)",
                          border: "1px solid var(--primary-mid)",
                          borderRadius: "var(--radius-sm)",
                          padding: "10px 12px",
                          marginBottom: 12,
                          marginTop: 12,
                          fontSize: "0.82rem",
                        }}>
                          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: "0.75rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Comportamento
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {s.completion_time_seconds !== null && (
                              <span>Tempo: <strong>{getTimeLabel(s.completion_time_seconds, summary.avg_completion_time_seconds)}</strong></span>
                            )}
                            {s.tab_switches === 0 && s.completion_time_seconds !== null && (
                              <span style={{ color: "var(--success)" }}>✓ Não saiu da aba</span>
                            )}
                            {s.tab_switches > 0 && (
                              <span style={{ color: s.tab_switches >= 3 ? "var(--danger)" : "var(--warning)" }}>
                                Saiu da aba {s.tab_switches} vez{s.tab_switches > 1 ? "es" : ""}
                                {s.tab_switches >= 3 ? " — possível cola" : " — possível distração"}
                              </span>
                            )}
                            {getBehaviorPattern(s) && (
                              <span style={{ fontStyle: "italic", color: "#555" }}>{getBehaviorPattern(s)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {s.answers.map((a: any, i: number) => (
                        <div key={a.id ?? a.question_id} style={{
                          padding: "10px 0",
                          borderBottom: i < s.answers.length - 1 ? "1px solid var(--border)" : "none",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              Q{i + 1} · {a.type === "open" ? "Aberta" : "Múltipla escolha"}
                            </span>
                            {a.type !== "open" && (
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: a.is_correct ? "var(--success)" : "var(--danger)" }}>
                                {a.is_correct ? "✓ Certo" : "✗ Errado"}
                              </span>
                            )}
                            {a.type === "open" && a.is_correct === null && (
                              <span style={{ fontSize: "0.75rem", color: "var(--warning)", fontWeight: 600 }}>Aguardando correção</span>
                            )}
                            {a.type === "open" && a.is_correct !== null && (
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: a.is_correct ? "var(--success)" : "var(--danger)" }}>
                                {a.is_correct ? "✓ Correto" : "✗ Incorreto"}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>{a.question}</div>
                          <div className="text-small text-muted" style={{ marginBottom: a.type === "open" ? 8 : 0 }}>
                            Resposta: <strong>{a.your_answer || "—"}</strong>
                          </div>

                          {a.type !== "open" && !a.is_correct && (
                            <div className="text-small" style={{ color: "var(--success)" }}>
                              Correta: <strong>{a.correct_answer}</strong>
                            </div>
                          )}

                          {a.type === "open" && a.correct_answer && (
                            <div style={{
                              background: "var(--primary-light)",
                              border: "1px solid var(--primary-mid)",
                              borderRadius: "var(--radius-sm)",
                              padding: "8px 10px",
                              marginBottom: 8,
                              fontSize: "0.8rem",
                            }}>
                              <div style={{ color: "var(--primary)", fontWeight: 600, marginBottom: 2 }}>Resposta esperada (IA)</div>
                              <div style={{ color: "var(--text)" }}>{a.correct_answer}</div>
                            </div>
                          )}

                          {a.type === "open" && (
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              <button
                                disabled={grading === a.id}
                                onClick={() => handleGrade(a.id, true)}
                                style={{
                                  flex: 1, padding: "8px",
                                  border: `2px solid ${a.is_correct === true ? "var(--success)" : "var(--border)"}`,
                                  borderRadius: "var(--radius-sm)",
                                  background: a.is_correct === true ? "#DCFCE7" : "white",
                                  cursor: "pointer", fontSize: "0.85rem",
                                  fontWeight: a.is_correct === true ? 700 : 400,
                                }}
                              >✓ Correto</button>
                              <button
                                disabled={grading === a.id}
                                onClick={() => handleGrade(a.id, false)}
                                style={{
                                  flex: 1, padding: "8px",
                                  border: `2px solid ${a.is_correct === false ? "var(--danger)" : "var(--border)"}`,
                                  borderRadius: "var(--radius-sm)",
                                  background: a.is_correct === false ? "#FEE2E2" : "white",
                                  cursor: "pointer", fontSize: "0.85rem",
                                  fontWeight: a.is_correct === false ? 700 : 400,
                                }}
                              >✗ Incorreto</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {pendingStudents.map((st: any) => (
                <div key={st.id} className="student-row" style={{ padding: "14px 16px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 600 }}>{st.name}</div>
                  <span className="badge badge-warning">Pendente</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
