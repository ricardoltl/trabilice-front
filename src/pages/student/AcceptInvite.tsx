import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<{ accessKey: string; studentName: string; classroomName: string } | null>(null);

  useEffect(() => {
    checkInvite();
  }, [token]);

  async function checkInvite() {
    try {
      const { data } = await api.get(`/invites/${token}`);
      setClassroomName(data.classroom.name);

      // Aluno já logado: entra direto na turma
      if (user?.role === "student") {
        await joinExisting();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Convite inválido ou já utilizado");
    } finally {
      setChecking(false);
    }
  }

  async function joinExisting() {
    try {
      const { data } = await api.post(`/invites/${token}/join`);
      setClassroomName(data.classroom.name);
      navigate("/student", { state: { joinedClassroom: data.classroom.name } });
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao entrar na turma");
      setChecking(false);
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post(`/invites/${token}/accept`, { firstName, lastName });
      setResult({
        accessKey: data.accessKey,
        studentName: data.student.name,
        classroomName: data.classroom.name,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao aceitar convite");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <div className="loading">Verificando convite...</div>;

  if (result) {
    return (
      <div className="container" style={{ paddingTop: "10vh", textAlign: "center" }}>
        <h1 style={{ margin: "24px 0" }}>Cadastro realizado!</h1>
        <p>Bem-vindo(a), <strong>{result.studentName}</strong>!</p>
        <p>Você foi adicionado(a) à turma <strong>{result.classroomName}</strong>.</p>

        <div className="code-display" style={{ margin: "24px 0" }}>
          <p>Sua chave de acesso</p>
          <div className="code">{result.accessKey}</div>
          <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Guarde esta chave! Você vai usar ela para entrar no sistema.
          </p>
        </div>

        <a href="/join" className="btn btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          Entrar no sistema
        </a>
      </div>
    );
  }

  if (error && !classroomName) {
    return (
      <div className="container" style={{ paddingTop: "10vh", textAlign: "center" }}>
        <h1 style={{ margin: "24px 0" }}>Convite inválido</h1>
        <div className="error-msg">{error}</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "10vh" }}>
      <h1 style={{ margin: "24px 0" }}>Entrar na turma</h1>
      <p className="text-muted mb-16">
        Você foi convidado para a turma <strong>{classroomName}</strong>. Preencha seus dados para continuar.
      </p>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleAccept}>
        <div className="input-group">
          <label>Nome</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Seu nome" required autoFocus />
        </div>
        <div className="input-group">
          <label>Sobrenome</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Seu sobrenome" required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}
