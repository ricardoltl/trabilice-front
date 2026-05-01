import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api, { describeError } from "../services/api";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Link inválido");
      return;
    }
    (async () => {
      try {
        await api.post("/auth/verify-email", { token });
        updateUser({ email_verified: true });
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(describeError(err));
      }
    })();
  }, [token]);

  return (
    <div className="container" style={{ paddingTop: "10vh", maxWidth: 420, textAlign: "center" }}>
      {status === "loading" && (
        <>
          <h1 style={{ fontSize: "1.4rem" }}>Confirmando seu email...</h1>
          <p className="text-muted" style={{ marginTop: 12 }}>Aguarde um momento.</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 style={{ fontSize: "1.6rem", color: "var(--success)" }}>Email confirmado! ✓</h1>
          <p className="text-muted" style={{ marginTop: 12 }}>
            Sua conta está ativa. Bem-vindo(a) ao Trabilice!
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/login")} style={{ marginTop: 24 }}>
            Ir para o login
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <h1 style={{ fontSize: "1.4rem", color: "var(--danger)" }}>Não foi possível confirmar</h1>
          <p className="text-muted" style={{ marginTop: 12 }}>{errorMsg}</p>
          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ marginTop: 24, display: "inline-block", textDecoration: "none" }}
          >
            Voltar para login
          </Link>
        </>
      )}
    </div>
  );
}
