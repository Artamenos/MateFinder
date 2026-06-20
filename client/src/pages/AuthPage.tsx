import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("s1mple@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка авторизации");
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-copy">
          <img className="brand-logo large" src="/logo-matefinder.png" alt="MateFinder" />
          <h1>CS2 Team Finder</h1>
          <p>Платформа для поиска тиммейтов по ролям, навыкам, времени игры и Faceit-статистике.</p>
          <div className="auth-highlights">
            <span>Анкеты игроков</span>
            <span>Faceit stats</span>
            <span>Инвайты в стак</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Вход
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              Регистрация
            </button>
          </div>

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Пароль
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="button primary" type="submit">
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </section>
    </main>
  );
}
