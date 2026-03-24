import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: "20vh", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>ClassHelper</h1>
      <p className="text-muted" style={{ marginBottom: 32 }}>
        Crie atividades, aplique para alunos e veja resultados em segundos.
      </p>

      <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={() => navigate("/login")}>
        Sou Professor
      </button>

      <button className="btn btn-secondary" style={{ marginBottom: 32 }} onClick={() => navigate("/join")}>
        Sou Aluno
      </button>

      <p className="text-small text-muted">
        Ainda não tem conta? <a href="/register">Cadastre-se como professor</a>
      </p>
    </div>
  );
}
