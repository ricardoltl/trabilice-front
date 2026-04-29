import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import api, { describeError } from "../services/api";

interface Props {
  onError?: (msg: string) => void;
  /** Texto exibido no botão. Default: "continue_with" */
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

export default function GoogleSignInButton({ onError, text = "continue_with" }: Props) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return null;
  }

  async function handleSuccess(cred: CredentialResponse) {
    if (!cred.credential) {
      onError?.("Falha ao receber credencial do Google");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { idToken: cred.credential });
      login(data.token, data.user);
      navigate(data.user.role === "teacher" ? "/teacher" : "/student");
    } catch (err: any) {
      onError?.(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Falha ao autenticar com o Google")}
        text={text}
        shape="rectangular"
        size="large"
        width="320"
      />
    </div>
  );
}
