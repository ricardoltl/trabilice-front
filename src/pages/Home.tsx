import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <img
        src="/android-chrome-192x192.png"
        alt="Alice"
        className="home-mascot"
      />

      <h1 className="home-title">Trabilice</h1>
      <p className="home-subtitle">
        Crie atividades, aplique para alunos e veja resultados em segundos.
      </p>

      <div className="home-actions">
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          Sou Professor
        </button>

        <button className="btn btn-secondary" onClick={() => navigate("/join")}>
          Sou Aluno
        </button>

        <p className="text-small text-muted" style={{ marginTop: 4 }}>
          Ainda não tem conta? <a href="/register">Cadastre-se como professor</a>
        </p>
      </div>
    </div>
  );
}
