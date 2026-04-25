import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 60000,
});

export function describeError(err: any): string {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
    return "A requisição demorou demais. Verifique sua conexão e tente novamente.";
  }
  if (err?.code === "ERR_NETWORK" || !err?.response) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }
  return "Erro inesperado. Tente novamente.";
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só redireciona se havia token (sessão expirada), não em tentativas de login
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
