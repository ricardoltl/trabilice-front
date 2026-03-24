import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activities, setActivities] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [joinToken, setJoinToken] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(
    (location.state as any)?.joinedClassroom
      ? `Você entrou na turma "${(location.state as any).joinedClassroom}"!`
      : ""
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: rooms } = await api.get("/classrooms");

      const allActivities: any[] = [];
      const submittedSet = new Set<string>();

      for (const room of rooms) {
        const { data: acts } = await api.get(`/activities/classroom/${room.id}`);
        for (const act of acts) {
          allActivities.push({ ...act, classroomName: room.name });
          try {
            await api.get(`/submissions/my/${act.id}`);
            submittedSet.add(act.id);
          } catch {}
        }
      }

      setActivities(allActivities);
      setSubmissions(submittedSet);
    } catch {}
    setLoading(false);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");
    setJoinSuccess("");
    setJoinLoading(true);

    try {
      const { data } = await api.post("/classrooms/join", { code: joinToken.trim().toUpperCase() });
      setJoinSuccess(`Você entrou na turma "${data.classroom.name}"!`);
      setJoinToken("");
      setShowJoin(false);
      loadData();
    } catch (err: any) {
      setJoinError(err.response?.data?.error || "Código inválido");
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <>
      <div className="nav-bar">
        <h2>ClassHelper</h2>
        <div>
          <span className="text-small text-muted" style={{ marginRight: 12 }}>{user?.name}</span>
          <button className="logout-btn" onClick={() => { logout(); navigate("/"); }}>Sair</button>
        </div>
      </div>

      <div className="container">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Atividades</h1>
          <button
            className="btn btn-small btn-secondary"
            onClick={() => { setShowJoin(!showJoin); setJoinError(""); setJoinSuccess(""); }}
          >
            + Entrar em turma
          </button>
        </div>

        {joinSuccess && (
          <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 16, fontSize: "0.9rem", color: "#166534" }}>
            {joinSuccess}
          </div>
        )}

        {showJoin && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 8 }}>Entrar em nova turma</h3>
            <p className="text-small text-muted" style={{ marginBottom: 12 }}>
              Digite o código da turma (6 caracteres) que o professor compartilhou.
            </p>
            <form onSubmit={handleJoin}>
              {joinError && <div className="error-msg" style={{ marginBottom: 8 }}>{joinError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  placeholder="Ex: F44P3M"
                  maxLength={6}
                  style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: "1rem", letterSpacing: "0.2em", fontWeight: 600, textAlign: "center", textTransform: "uppercase" }}
                  required
                  autoFocus
                />
                <button className="btn btn-primary" type="submit" disabled={joinLoading}>
                  {joinLoading ? "..." : "Entrar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma atividade disponível</h3>
            <p>Aguarde o professor publicar uma atividade</p>
          </div>
        ) : (
          activities.map((a) => {
            const done = submissions.has(a.id);
            return (
              <div
                key={a.id}
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(done ? `/student/activity/${a.id}/result` : `/student/activity/${a.id}`)}
              >
                <div className="flex-between">
                  <div>
                    <h3>{a.title}</h3>
                    <p>{a.classroomName} - {a.questionCount} questões</p>
                  </div>
                  <span className={`badge ${done ? "badge-success" : "badge-info"}`}>
                    {done ? "Feita" : "Pendente"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
