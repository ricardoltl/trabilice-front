import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTutorialAutoStart } from "../../components/AliceTutorial";
import api from "../../services/api";

export default function ClassroomView() {
  useTutorialAutoStart("teacher-classroom");
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [tab, setTab] = useState<"activities" | "students">("activities");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    setInviteLink(null);
    try {
      const { data } = await api.post("/invites", { classroomId: id });
      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
    } catch {} finally {
      setGeneratingInvite(false);
    }
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!classroom) return <div className="loading">Carregando...</div>;

  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate("/teacher")}>← Voltar</button>
        <h2>{classroom.name}</h2>
        <span></span>
      </div>

      <div className="container">
        <div className="code-display" data-tutorial-id="classroom-code">
          <p>Código da turma</p>
          <div className="code">{classroom.code}</div>
          <p style={{ fontSize: "0.85rem" }}>Somente alunos já cadastrados podem usar este código</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }} data-tutorial-id="classroom-tabs">
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
              data-tutorial-id="btn-criar-atividade"
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
                      <p>
                        {a.questionCount} questões
                        {a.assignedTo && a.assignedTo.length > 0 && (
                          <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>
                            · {a.assignedTo.length} aluno{a.assignedTo.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
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
            <button
              className="btn btn-primary mb-16"
              onClick={handleGenerateInvite}
              disabled={generatingInvite}
            >
              {generatingInvite ? "Gerando..." : "+ Gerar Convite"}
            </button>

            {inviteLink && (
              <div className="card" style={{ marginBottom: 16, background: "#f0f9ff" }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Convite gerado!</p>
                <p style={{ fontSize: "0.85rem", wordBreak: "break-all", marginBottom: 8 }}>{inviteLink}</p>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => copyToClipboard(inviteLink, "invite")}
                >
                  {copied === "invite" ? "Copiado!" : "Copiar link"}
                </button>
                <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 8 }}>
                  Este link funciona para apenas um aluno.
                </p>
              </div>
            )}

            {(!classroom.students || classroom.students.length === 0) ? (
              <div className="empty-state">
                <h3>Nenhum aluno ainda</h3>
                <p>Gere um convite para adicionar alunos à turma</p>
              </div>
            ) : (
              classroom.students.map((s: any) => (
                <div key={s.id} className="card" style={{ marginBottom: 8 }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{ background: "#f3f4f6", padding: "4px 8px", borderRadius: 4, fontSize: "0.85rem", letterSpacing: "0.1em" }}>
                        {s.access_key}
                      </code>
                      <button
                        className="btn btn-secondary btn-small"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={() => copyToClipboard(s.access_key, s.id)}
                      >
                        {copied === s.id ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}
