import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassrooms();
  }, []);

  async function loadClassrooms() {
    try {
      const { data } = await api.get("/classrooms");
      setClassrooms(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function createClassroom(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await api.post("/classrooms", { name: newName });
      setNewName("");
      setShowCreate(false);
      loadClassrooms();
    } catch {
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
        <div className="page-header">
          <h1>Minhas Turmas</h1>
          <button className="btn btn-primary btn-small" onClick={() => setShowCreate(!showCreate)}>
            + Nova Turma
          </button>
        </div>

        {showCreate && (
          <form onSubmit={createClassroom} className="card">
            <div className="input-group" style={{ marginBottom: 8 }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da turma (ex: 6º Ano A)" autoFocus />
            </div>
            <button className="btn btn-primary btn-small" type="submit">Criar</button>
          </form>
        )}

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : classrooms.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma turma ainda</h3>
            <p>Crie sua primeira turma para começar</p>
          </div>
        ) : (
          classrooms.map((c) => (
            <div key={c.id} className="card" onClick={() => navigate(`/teacher/classroom/${c.id}`)} style={{ cursor: "pointer" }}>
              <div className="flex-between">
                <h3>{c.name}</h3>
                <span className="badge badge-info">{c.code}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
