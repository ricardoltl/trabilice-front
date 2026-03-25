import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTutorialAutoStart } from "../../components/AliceTutorial";
import api from "../../services/api";
import aliceHelper from "../../assets/aliceHelper.webp";
import aliceClass from "../../assets/aliceClass.webp";

const CLASSROOM_EMOJIS = ["📚", "🎯", "🌟", "🔬", "🎨", "🧩", "🚀", "🦋"];

export default function TeacherDashboard() {
  useTutorialAutoStart("teacher-dashboard");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    setCreating(true);
    try {
      await api.post("/classrooms", { name: newName });
      setNewName("");
      setShowCreate(false);
      await loadClassrooms();
      showToast("Boa! Sua turma foi criada 🐱");
    } catch {
    } finally {
      setCreating(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function copyCode(e: React.MouseEvent, classroom: any) {
    e.stopPropagation();
    await navigator.clipboard.writeText(classroom.code);
    setCopiedId(classroom.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClose() {
    setShowCreate(false);
    setNewName("");
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
        <div className="page-header">
          <h1>Minhas Turmas</h1>
          <button className="btn btn-primary btn-small" onClick={() => setShowCreate(true)} data-tutorial-id="btn-nova-turma">
            + Nova Turma
          </button>
        </div>

        <div data-tutorial-id="classroom-list">
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : classrooms.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 32 }}>
              <img
                src={aliceClass}
                alt="Alice"
                style={{ width: 280, height: 280, objectFit: "contain", marginBottom: 8, filter: "drop-shadow(0 8px 24px rgba(124,58,237,0.25))", animation: "float 3s ease-in-out infinite" }}
              />
              <h3 style={{ marginBottom: 6 }}>Vamos começar!</h3>
              <p style={{ marginBottom: 20 }}>Crie sua primeira turma para começar a usar o Trabilice</p>
              <button
                className="btn btn-primary btn-cta"
                onClick={() => setShowCreate(true)}
              >
                + Criar minha primeira turma
              </button>
            </div>
          ) : (
            classrooms.map((c, i) => (
              <div
                key={c.id}
                className="card classroom-card"
                onClick={() => navigate(`/teacher/classroom/${c.id}`)}
                style={{ cursor: "pointer", animation: `slideUp 0.3s ease both ${i * 0.07}s` }}
              >
                <div className="flex-between">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="classroom-avatar">
                      {CLASSROOM_EMOJIS[i % CLASSROOM_EMOJIS.length]}
                    </div>
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{c.name}</h3>
                      <span className="text-small text-muted">
                        {c.studentCount ?? 0} alunos
                      </span>
                    </div>
                  </div>
                  <button
                    className="badge badge-info"
                    onClick={(e) => copyCode(e, c)}
                    title="Copiar código"
                    style={{
                      cursor: "pointer",
                      border: "none",
                      fontFamily: "inherit",
                      fontSize: "0.85rem",
                      minWidth: 80,
                      transition: "background 0.2s",
                    }}
                  >
                    {copiedId === c.id ? "✓ Copiado!" : `📋 ${c.code}`}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast Alice */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 100,
          right: 24,
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: 16,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          animation: "slideUp 0.3s ease",
          zIndex: 1000,
        }}>
          <img src={aliceHelper} alt="Alice" style={{ width: 32, height: 32 }} />
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{toast}</span>
        </div>
      )}

      {/* Modal Nova Turma */}
      {showCreate && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Turma</h2>
              <button className="modal-close" onClick={handleClose}>✕</button>
            </div>
            <form onSubmit={createClassroom}>
              <div className="input-group">
                <label>Nome da turma</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: 6º Ano A — Matemática"
                  autoFocus
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={creating || !newName.trim()}
                  style={{ flex: 2 }}
                >
                  {creating ? "Criando..." : "Criar Turma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
