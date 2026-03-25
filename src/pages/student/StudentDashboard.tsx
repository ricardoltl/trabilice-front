import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; activities: any[] }[]>([]);
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

      const classroomList: { id: string; name: string; activities: any[] }[] = [];
      const submittedSet = new Set<string>();

      for (const room of rooms) {
        const { data: acts } = await api.get(`/activities/classroom/${room.id}`);
        for (const act of acts) {
          try {
            await api.get(`/submissions/my/${act.id}`);
            submittedSet.add(act.id);
          } catch {}
        }
        if (acts.length > 0) {
          classroomList.push({ id: room.id, name: room.name, activities: acts });
        }
      }

      setClassrooms(classroomList);
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
        <div className="nav-logo">
          <img src="/android-chrome-192x192.png" alt="Alice" />
          <h2>Trabilice</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="text-small text-muted">{user?.name}</span>
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
        ) : classrooms.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma atividade disponível</h3>
            <p>Aguarde o professor publicar uma atividade</p>
          </div>
        ) : (
          classrooms.map((room, ri) => (
            <div key={room.id} style={{ marginBottom: 28, animation: `slideUp 0.3s ease both ${ri * 0.08}s` }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: "2px solid var(--primary-light)",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--primary)", flexShrink: 0,
                }} />
                <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {room.name}
                </h2>
              </div>
              {room.activities.map((a, ai) => {
                const done = submissions.has(a.id);
                return (
                  <div
                    key={a.id}
                    className="card"
                    style={{ cursor: "pointer", marginBottom: 8, animation: `slideUp 0.3s ease both ${(ri * 0.08) + (ai * 0.05) + 0.1}s` }}
                    onClick={() => navigate(done ? `/student/activity/${a.id}/result` : `/student/activity/${a.id}`)}
                  >
                    <div className="flex-between">
                      <div>
                        <h3>{a.title}</h3>
                        <p>{a.questionCount} questões</p>
                      </div>
                      <span className={`badge ${done ? "badge-success" : "badge-info"}`}>
                        {done ? "Feita" : "Pendente"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </>
  );
}
