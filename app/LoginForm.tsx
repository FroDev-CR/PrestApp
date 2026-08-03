"use client";

import { ArrowRight, CircleCheck, Eye, EyeOff, HandCoins, LayoutDashboard, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "No pudimos iniciar sesión.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-grid-pattern" />
      <header className="login-header">
        <div className="login-brand"><span><HandCoins size={22} /></span><strong>Presta<i>+</i></strong></div>
        <div className="login-secure"><ShieldCheck size={16} /> Acceso administrativo</div>
      </header>

      <section className="login-shell">
        <aside className="login-story">
          <div className="login-story-copy">
            <span>GESTIÓN SIMPLE. CONTROL REAL.</span>
            <h1>TU CARTERA.<br />BAJO<br />CONTROL.</h1>
            <p>Administrá tenants, préstamos y cobros desde un solo lugar.</p>
          </div>
          <div className="login-benefits">
            <div><span><LayoutDashboard size={17} /></span><p><strong>Todo en orden</strong><small>Una vista clara de tu operación.</small></p></div>
            <div><span><CircleCheck size={17} /></span><p><strong>Decisiones al instante</strong><small>Información lista cuando la necesitás.</small></p></div>
            <div><span><LockKeyhole size={17} /></span><p><strong>Acceso protegido</strong><small>Tu panel administrativo es privado.</small></p></div>
          </div>
        </aside>

        <section className="login-form-side">
          <div className="login-form-wrap">
            <span className="login-eyebrow">PANEL PRESTA+</span>
            <h2>Qué bueno<br />verte.</h2>
            <p className="login-intro">Ingresá tus datos para administrar la plataforma.</p>

            <form className="login-form" onSubmit={submit}>
              <label>
                <span>Correo electrónico</span>
                <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" required />
              </label>
              <label>
                <span>Contraseña</span>
                <div className="password-field">
                  <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresá tu contraseña" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              {error && <div className="login-error" role="alert">{error}</div>}
              <button className="login-submit" disabled={loading}>
                <span>{loading ? "Ingresando..." : "Entrar al panel"}</span><ArrowRight size={18} />
              </button>
            </form>

            <div className="login-footnote"><ShieldCheck size={14} /> Sesión privada y protegida</div>
          </div>
        </section>
      </section>
    </main>
  );
}
