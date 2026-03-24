import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ActivityResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classroom, setClassroom] = useState<any>(null);

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
      setSubmissions(subRes.data);

      // Load classroom to get total students
      const classRes = await api.get(`/classrooms/${actRes.data.classroom_id}`);
      setClassroom(classRes.data);
    } catch {}
  }

  if (!activity) return <div className="loading">Carregando...</div>;

  const totalStudents = classroom?.students?.length || 0;
  const submittedCount = submissions.length;
  const pendingCount = totalStudents - submittedCount;
  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
    : 0;

  function getScoreColor(score: number) {
    if (score >= 70) return "var(--success)";
    if (score >= 40) return "var(--warning)";
    return "var(--danger)";
  }

  return (
    <>
      <div className="nav-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>Voltar</button>
        <h2>Resultados</h2>
        <span></span>
      </div>

      <div className="container">
        <h1 style={{ fontSize: "1.2rem", marginBottom: 16 }}>{activity.title}</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>{submittedCount}</div>
            <div className="text-small text-muted">Responderam</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--warning)" }}>{pendingCount}</div>
            <div className="text-small text-muted">Pendentes</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: getScoreColor(avgScore) }}>{avgScore}%</div>
            <div className="text-small text-muted">Média</div>
          </div>
        </div>

        <h3 style={{ marginBottom: 12 }}>Alunos</h3>

        {submissions.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum aluno respondeu ainda</p>
          </div>
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="student-row">
              <div>
                <div style={{ fontWeight: 500 }}>{s.student.name}</div>
                <div className="text-small text-muted">
                  {s.correctAnswers}/{s.totalQuestions} acertos
                </div>
              </div>
              <div
                className="score-circle"
                style={{ background: getScoreColor(s.score) }}
              >
                {s.score}%
              </div>
            </div>
          ))
        )}

        {/* Show students who didn't submit */}
        {classroom?.students?.filter((st: any) => !submissions.find((s) => s.student.id === st.id)).map((st: any) => (
          <div key={st.id} className="student-row">
            <div>
              <div style={{ fontWeight: 500 }}>{st.name}</div>
            </div>
            <span className="badge badge-warning">Pendente</span>
          </div>
        ))}
      </div>
    </>
  );
}
