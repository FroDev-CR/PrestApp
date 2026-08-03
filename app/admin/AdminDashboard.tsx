"use client";

import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  CircleDollarSign,
  Eye,
  EyeOff,
  Gauge,
  HandCoins,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type TenantStatus = "Activo" | "Prueba" | "Suspendido";

type Tenant = {
  id: number;
  name: string;
  owner: string;
  email: string;
  plan: string;
  loans: number;
  status: TenantStatus;
  amount: number;
  passwordHash?: string;
  passwordSalt?: string;
  passwordUpdatedAt?: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);

async function deriveTenantPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120_000 },
    passwordKey,
    256,
  );
  const encode = (value: ArrayBuffer | Uint8Array) =>
    btoa(String.fromCharCode(...new Uint8Array(value)));

  return {
    passwordHash: encode(derivedBits),
    passwordSalt: encode(salt),
    passwordUpdatedAt: new Date().toISOString(),
  };
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [query, setQuery] = useState("");
  const [newTenantOpen, setNewTenantOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const restoreStorage = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("presta-tenants");
        if (stored) setTenants(JSON.parse(stored) as Tenant[]);
      } catch {
        localStorage.removeItem("presta-tenants");
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreStorage);
  }, []);

  useEffect(() => {
    if (storageReady) localStorage.setItem("presta-tenants", JSON.stringify(tenants));
  }, [storageReady, tenants]);

  const filteredTenants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return tenants;
    return tenants.filter((tenant) =>
      [tenant.name, tenant.owner, tenant.email, tenant.plan, tenant.status]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, tenants]);

  const activeTenants = tenants.filter((tenant) => tenant.status === "Activo");
  const trialTenants = tenants.filter((tenant) => tenant.status === "Prueba");
  const monthlyRevenue = activeTenants.reduce((total, tenant) => total + tenant.amount, 0);
  const managedLoans = tenants.reduce((total, tenant) => total + tenant.loans, 0);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link className="login-brand" href="/admin">
          <span><HandCoins size={22} /></span><strong>Presta<i>+</i></strong>
        </Link>
        <nav className="admin-top-actions" aria-label="Acciones del administrador">
          <Link className="admin-panel-link" href="/panel"><LayoutDashboard size={16} /> Ver panel</Link>
          <span className="admin-identity"><ShieldCheck size={15} /> {adminEmail}</span>
          <button className="admin-logout" onClick={logout} aria-label="Cerrar sesión"><LogOut size={17} /><span>Salir</span></button>
        </nav>
      </header>

      <main className="page admin-page">
        <section className="admin-welcome">
          <div>
            <span className="admin-pill"><ShieldCheck size={11} /> CENTRO DE CONTROL</span>
            <h1>Tu negocio, en orden.</h1>
            <p>Gestioná cada prestamista y el crecimiento de Presta+ desde un solo lugar.</p>
          </div>
          <button className="admin-new" onClick={() => setNewTenantOpen(true)}><Plus size={18} /> Nuevo tenant</button>
        </section>

        <section className="admin-metrics" aria-label="Métricas de la plataforma">
          <AdminMetric icon={<Building2 />} color="lime" label="Tenants activos" value={String(activeTenants.length)} detail={`${trialTenants.length} en prueba`} />
          <AdminMetric icon={<CircleDollarSign />} color="violet" label="Ingreso mensual" value={money(monthlyRevenue)} detail="Solo cuentas activas" />
          <AdminMetric icon={<Gauge />} color="peach" label="Préstamos gestionados" value={String(managedLoans)} detail="En toda la plataforma" />
          <AdminMetric icon={<Activity />} color="blue" label="Estado del servicio" value="Operativo" detail="Panel disponible" positive />
        </section>

        <section className="tenant-section">
          <div className="tenant-section-head">
            <div><h2>Tenants</h2><p>Prestamistas registrados en Presta+</p></div>
            <label className="search-box admin-search">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tenant..." aria-label="Buscar tenant" />
            </label>
          </div>
          <div className="tenant-table-head" aria-hidden="true">
            <span>Tenant</span><span>Plan</span><span>Préstamos</span><span>Estado</span><span>Mensualidad</span><span />
          </div>

          {filteredTenants.length === 0 ? (
            <div className="tenant-empty">
              <Building2 size={34} />
              <div>
                <strong>{tenants.length ? "No encontramos coincidencias" : "Todavía no hay tenants"}</strong>
                <p>{tenants.length ? "Probá con otro nombre, correo o plan." : "Creá el primer prestamista para empezar a gestionar la plataforma."}</p>
              </div>
              {!tenants.length && <button className="primary-button" onClick={() => setNewTenantOpen(true)}><Plus size={15} /> Crear tenant</button>}
            </div>
          ) : (
            <div>
              {filteredTenants.map((tenant) => (
                <article className="tenant-row" key={tenant.id}>
                  <div className="tenant-name">
                    <span>{tenant.name.slice(0, 2).toUpperCase()}</span>
                    <div><strong>{tenant.name}</strong><small>{tenant.owner} · {tenant.email}</small></div>
                  </div>
                  <span className="plan-chip"><Zap size={10} /> {tenant.plan}</span>
                  <span className="tenant-loans">{tenant.loans} <small>activos</small></span>
                  <span className={`tenant-status ${tenant.status.toLowerCase()}`}><i /> {tenant.status}</span>
                  <strong className="tenant-price">{money(tenant.amount)}</strong>
                  <button className="tenant-menu" onClick={() => setEditingTenant(tenant)} aria-label={`Administrar ${tenant.name}`} title="Ver y editar tenant"><MoreHorizontal size={18} /></button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {newTenantOpen && (
        <NewTenantModal
          onClose={() => setNewTenantOpen(false)}
          onCreate={(tenant) => {
            setTenants((current) => [tenant, ...current]);
            setNewTenantOpen(false);
            notify("Tenant creado correctamente");
          }}
        />
      )}

      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSave={(updatedTenant) => {
            setTenants((current) => current.map((tenant) => tenant.id === updatedTenant.id ? updatedTenant : tenant));
            setEditingTenant(null);
            notify("Datos del tenant actualizados");
          }}
          onDelete={(tenant) => {
            setTenants((current) => current.filter((item) => item.id !== tenant.id));
            setEditingTenant(null);
            notify(`${tenant.name} fue eliminado`);
          }}
        />
      )}

      {toast && <div className="toast" role="status"><span><Check size={16} strokeWidth={3} /></span>{toast}</div>}
    </div>
  );
}

function AdminMetric({ icon, color, label, value, detail, positive = false }: { icon: React.ReactNode; color: string; label: string; value: string; detail: string; positive?: boolean }) {
  return (
    <article className="admin-metric">
      <span className={`admin-metric-icon ${color}`}>{icon}</span>
      <p>{label}</p><h3>{value}</h3>
      <small className={positive ? "positive" : ""}>{positive && <Sparkles size={10} />} {detail}</small>
    </article>
  );
}

function NewTenantModal({ onClose, onCreate }: { onClose: () => void; onCreate: (tenant: Tenant) => void }) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("Esencial");
  const [amount, setAmount] = useState(15000);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const credentials = await deriveTenantPassword(password);
      onCreate({ id: Date.now(), name, owner, email, plan, amount, loans: 0, status: "Prueba", ...credentials });
    } catch {
      setError("No pudimos proteger la contraseña. Intentá de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="new-tenant-title">
        <span className="sheet-handle" />
        <header className="sheet-head">
          <div><span className="sheet-kicker">NUEVA CUENTA</span><h2 id="new-tenant-title">Crear tenant</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        </header>
        <form className="form-stack" onSubmit={submit}>
          <label><span>Nombre del negocio</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Préstamos San José" required autoFocus /></label>
          <label><span>Nombre del propietario</span><input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Nombre completo" required /></label>
          <label><span>Correo electrónico</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@negocio.com" required /></label>
          <label>
            <span>Contraseña temporal</span>
            <div className="password-field">
              <input type={showPassword ? "text" : "password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </label>
          <div className="two-fields">
            <label><span>Plan</span><select value={plan} onChange={(event) => setPlan(event.target.value)}><option>Esencial</option><option>Profesional</option><option>Negocio</option></select></label>
            <label><span>Mensualidad</span><div className="input-prefix"><b>₡</b><input type="number" min="0" step="1000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} required /></div></label>
          </div>
          <div className="trial-note"><Sparkles size={18} /><div><strong>Se creará en periodo de prueba</strong><p>Podés activar o suspender la cuenta desde la lista de tenants.</p></div></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button modal-submit" disabled={submitting}><span>{submitting ? "Creando..." : "Crear tenant"}</span><ArrowRight size={17} /></button>
        </form>
      </section>
    </div>
  );
}

function EditTenantModal({ tenant, onClose, onSave, onDelete }: { tenant: Tenant; onClose: () => void; onSave: (tenant: Tenant) => void; onDelete: (tenant: Tenant) => void }) {
  const [name, setName] = useState(tenant.name);
  const [owner, setOwner] = useState(tenant.owner);
  const [email, setEmail] = useState(tenant.email);
  const [plan, setPlan] = useState(tenant.plan);
  const [status, setStatus] = useState<TenantStatus>(tenant.status);
  const [amount, setAmount] = useState(tenant.amount);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const credentials = newPassword ? await deriveTenantPassword(newPassword) : {};
      onSave({ ...tenant, name, owner, email, plan, status, amount, ...credentials });
    } catch {
      setError("No pudimos guardar los cambios. Intentá de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="form-modal tenant-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-tenant-title">
        <span className="sheet-handle" />
        <header className="sheet-head">
          <div><span className="sheet-kicker">FICHA DEL TENANT</span><h2 id="edit-tenant-title">Editar tenant</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        </header>

        <div className="tenant-record-summary">
          <span>{name.slice(0, 2).toUpperCase()}</span>
          <div><strong>{name}</strong><small>ID #{tenant.id} · {tenant.loans} préstamos activos</small></div>
          <span className={`tenant-status ${status.toLowerCase()}`}><i /> {status}</span>
        </div>

        <form className="form-stack" onSubmit={submit}>
          <label><span>Nombre del negocio</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label><span>Nombre del propietario</span><input value={owner} onChange={(event) => setOwner(event.target.value)} required /></label>
          <label><span>Correo electrónico</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <div className="two-fields">
            <label><span>Plan</span><select value={plan} onChange={(event) => setPlan(event.target.value)}><option>Esencial</option><option>Profesional</option><option>Negocio</option></select></label>
            <label><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value as TenantStatus)}><option>Activo</option><option>Prueba</option><option>Suspendido</option></select></label>
          </div>
          <label><span>Mensualidad</span><div className="input-prefix"><b>₡</b><input type="number" min="0" step="1000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} required /></div></label>

          <div className="password-reset-card">
            <div className="password-reset-head"><span><KeyRound size={17} /></span><div><strong>Cambiar contraseña</strong><small>{tenant.passwordUpdatedAt ? `Último cambio: ${new Date(tenant.passwordUpdatedAt).toLocaleDateString("es-CR")}` : "Podés asignar una nueva contraseña de acceso."}</small></div></div>
            <label>
              <span>Nueva contraseña <small>(opcional)</small></span>
              <div className="password-field">
                <input type={showPassword ? "text" : "password"} minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Dejar vacío para conservar la actual" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button modal-submit" disabled={submitting}><Save size={16} /><span>{submitting ? "Guardando..." : "Guardar cambios"}</span></button>

          <div className="danger-zone">
            <div><strong>Eliminar tenant</strong><p>Esta acción quitará la cuenta y sus datos guardados en este dispositivo.</p></div>
            {!confirmDelete ? (
              <button type="button" className="danger-button" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Eliminar</button>
            ) : (
              <div className="delete-confirm" role="alert">
                <strong>¿Eliminar definitivamente a {tenant.name}?</strong>
                <div>
                  <button type="button" className="secondary-button" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                  <button type="button" className="danger-button solid" onClick={() => onDelete(tenant)}><Trash2 size={15} /> Sí, eliminar</button>
                </div>
              </div>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
