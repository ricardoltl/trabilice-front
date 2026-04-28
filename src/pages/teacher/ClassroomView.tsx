import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTutorialAutoStart } from "../../components/AliceTutorial";
import api, { describeError } from "../../services/api";

export default function ClassroomView() {
  useTutorialAutoStart("teacher-classroom");
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [tab, setTab] = useState<"activities" | "lesson-plans" | "students">("activities");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<
    | null
    | { kind: "classroom" }
    | { kind: "activity"; id: string; title: string }
    | { kind: "lesson-plan"; id: string; title: string }
  >(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [classRes, actRes, planRes] = await Promise.all([
        api.get(`/classrooms/${id}`),
        api.get(`/activities/classroom/${id}`),
        api.get(`/lesson-plans/classroom/${id}`),
      ]);
      setClassroom(classRes.data);
      setActivities(actRes.data);
      setLessonPlans(planRes.data);
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

  async function startEditName() {
    setNameDraft(classroom.name);
    setEditingName(true);
  }

  async function saveName() {
    if (!nameDraft.trim() || nameDraft.trim() === classroom.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await api.put(`/classrooms/${id}`, { name: nameDraft.trim() });
      setClassroom({ ...classroom, name: nameDraft.trim() });
      setEditingName(false);
    } catch (err: any) {
      alert(describeError(err));
    } finally {
      setSavingName(false);
    }
  }

  async function performDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.kind === "classroom") {
        await api.delete(`/classrooms/${id}`);
        navigate("/teacher");
      } else if (confirmDelete.kind === "activity") {
        await api.delete(`/activities/${confirmDelete.id}`);
        setActivities((prev) => prev.filter((a) => a.id !== confirmDelete.id));
        setConfirmDelete(null);
      } else if (confirmDelete.kind === "lesson-plan") {
        await api.delete(`/lesson-plans/${confirmDelete.id}`);
        setLessonPlans((prev) => prev.filter((p) => p.id !== confirmDelete.id));
        setConfirmDelete(null);
      }
    } catch (err: any) {
      alert(describeError(err));
    } finally {
      setDeleting(false);
    }
  }

  if (!classroom) return <div className="loading">Carregando...</div>;

  return (
    <>
      <div className="nav-bar nav-bar-centered">
        <button className="back-btn" onClick={() => navigate("/teacher")}>← Voltar</button>
        {editingName ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") setEditingName(false);
              }}
              style={{
                padding: "6px 10px",
                border: "2px solid var(--primary)",
                borderRadius: "var(--radius-sm)",
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--text)",
                minWidth: 200,
              }}
            />
            <button className="btn btn-primary btn-small" onClick={saveName} disabled={savingName}>
              {savingName ? "..." : "Salvar"}
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => setEditingName(false)} disabled={savingName}>
              Cancelar
            </button>
          </div>
        ) : (
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {classroom.name}
            <button
              onClick={startEditName}
              title="Renomear turma"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: 4 }}
            >
              ✏️
            </button>
            <button
              onClick={() => setConfirmDelete({ kind: "classroom" })}
              title="Excluir turma"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: 4 }}
            >
              🗑️
            </button>
          </h2>
        )}
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
            className={`btn btn-small ${tab === "lesson-plans" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("lesson-plans")}
          >
            Planejamentos ({lessonPlans.length})
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
                    <button
                      className="btn btn-small"
                      style={{ marginLeft: "auto", color: "var(--danger)", background: "transparent", border: "1px solid var(--border)" }}
                      onClick={() => setConfirmDelete({ kind: "activity", id: a.id, title: a.title })}
                      title="Excluir atividade"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === "lesson-plans" && (
          <>
            <button
              className="btn btn-primary mb-16"
              onClick={() => navigate(`/teacher/classroom/${id}/new-lesson-plan`)}
            >
              + Novo Planejamento
            </button>

            {lessonPlans.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum planejamento</h3>
                <p>Crie um planejamento de aula com o copiloto</p>
              </div>
            ) : (
              lessonPlans.map((p) => (
                <div key={p.id} className="card">
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/teacher/lesson-plan/${p.id}`)}
                  >
                    <div className="flex-between">
                      <div>
                        <h3>{p.title}</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {p.topic ? p.topic.slice(0, 100) : "Sem tema definido"}
                          {p.topic && p.topic.length > 100 ? "..." : ""}
                        </p>
                      </div>
                      {p.lesson_date && (
                        <span className="badge badge-success">
                          {new Date(p.lesson_date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      className="btn btn-small"
                      style={{ marginLeft: "auto", color: "var(--danger)", background: "transparent", border: "1px solid var(--border)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ kind: "lesson-plan", id: p.id, title: p.title });
                      }}
                      title="Excluir planejamento"
                    >
                      🗑️
                    </button>
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

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Confirmar exclusão</h3>
            <p style={{ marginBottom: 16, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {confirmDelete.kind === "classroom" && (
                <>
                  Excluir a turma <strong>{classroom.name}</strong>?
                  <br />
                  Todas as atividades, planejamentos, convites e matrículas dessa turma serão removidos.
                  Esta ação não pode ser desfeita.
                </>
              )}
              {confirmDelete.kind === "activity" && (
                <>
                  Excluir a atividade <strong>{confirmDelete.title}</strong>?
                  <br />
                  Todas as submissões e respostas dos alunos serão perdidas. Esta ação não pode ser desfeita.
                </>
              )}
              {confirmDelete.kind === "lesson-plan" && (
                <>
                  Excluir o planejamento <strong>{confirmDelete.title}</strong>?
                  <br />
                  Todas as mensagens com o copiloto serão perdidas. Esta ação não pode ser desfeita.
                </>
              )}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={performDelete}
                disabled={deleting}
                style={{ flex: 1, background: "var(--danger)", color: "white" }}
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
