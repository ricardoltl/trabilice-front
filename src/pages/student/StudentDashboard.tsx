import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: rooms } = await api.get("/classrooms");
      setClassrooms(rooms);

      // Load activities for all classrooms
      const allActivities: any[] = [];
      const submittedSet = new Set<string>();

      for (const room of rooms) {
        const { data: acts } = await api.get(`/activities/classroom/${room.id}`);
        for (const act of acts) {
          allActivities.push({ ...act, classroomName: room.name });
          // Check if student has submitted
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
        <div className="page-header">
          <h1>Atividades</h1>
        </div>

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
              <div key={a.id} className="card" style={{ cursor: "pointer" }} onClick={() => navigate(done ? `/student/activity/${a.id}/result` : `/student/activity/${a.id}`)}>
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
