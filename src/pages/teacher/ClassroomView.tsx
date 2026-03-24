import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ClassroomView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState<"activities" | "students">("activities");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [classRes, actRes] = await Promise.all([
        api.get(`/classrooms/${id}`),
        api.get(`/activities/classroom/${id}`),
      ]);
      setClassroom(classRes.data);
      setActivities(actRes.data);
    } catch {}
  }

  if (!classroom) return <div className="loading">Carregando...</div>;

  return (
    <>
      <div className="nav-bar">
        <button className="back-btn" onClick={() => navigate("/teacher")}>Voltar</button>
        <h2>{classroom.name}</h2>
        <span></span>
      </div>

      <div className="container">
        <div className="code-display">
          <p>Código da turma</p>
          <div className="code">{classroom.code}</div>
          <p>Compartilhe com seus alunos</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={`btn btn-small ${tab === "activities" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("activities")}
          >
            Atividades ({activities.length})
          </button>
          <button
            className={`btn btn-small ${tab === "students" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("students")}
          >
            Alunos ({classroom.students?.length || 0})
          </button>
        </div>

        {tab === "activities" && (
          <>
            <button
              className="btn btn-primary mb-16"
              onClick={() => navigate(`/teacher/classroom/${id}/new-activity`)}
            >
              + Criar Atividade
            </button>

            {activities.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhuma atividade</h3>
                <p>Crie sua primeira atividade para esta turma</p>
              </div>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="card">
                  <div className="flex-between">
                    <div>
                      <h3>{a.title}</h3>
                      <p>{a.questionCount} questões</p>
                    </div>
                    <span className={`badge ${a.published ? "badge-success" : "badge-warning"}`}>
                      {a.published ? "Publicada" : "Rascunho"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {!a.published && (
                      <button className="btn btn-secondary btn-small" onClick={() => navigate(`/teacher/activity/${a.id}/edit`)}>
                        Editar
                      </button>
                    )}
                    {a.published && (
                      <button className="btn btn-primary btn-small" onClick={() => navigate(`/teacher/activity/${a.id}/results`)}>
                        Ver Resultados
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === "students" && (
          <>
            {(!classroom.students || classroom.students.length === 0) ? (
              <div className="empty-state">
                <h3>Nenhum aluno ainda</h3>
                <p>Compartilhe o código <strong>{classroom.code}</strong> com seus alunos</p>
              </div>
            ) : (
              classroom.students.map((s: any) => (
                <div key={s.id} className="student-row">
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}
