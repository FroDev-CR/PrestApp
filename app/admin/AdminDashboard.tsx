"use client";

import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  CircleDollarSign,
  Gauge,
  HandCoins,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
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
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [query, setQuery] = useState("");
  const [newTenantOpen, setNewTenantOpen] = useState(false);
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

  function changeStatus(tenant: Tenant) {
    const nextStatus: TenantStatus = tenant.status === "Activo" ? "Suspendido" : "Activo";
    setTenants((current) => current.map((item) => item.id === tenant.id ? { ...item, status: nextStatus } : item));
    notify(`${tenant.name} ahora está ${nextStatus.toLowerCase()}`);
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
                  <button className="tenant-menu" onClick={() => changeStatus(tenant)} aria-label={`Cambiar estado de ${tenant.name}`} title={tenant.status === "Activo" ? "Suspender tenant" : "Activar tenant"}><MoreHorizontal size={18} /></button>
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({ id: Date.now(), name, owner, email, plan, amount, loans: 0, status: "Prueba" });
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
          <div className="two-fields">
            <label><span>Plan</span><select value={plan} onChange={(event) => setPlan(event.target.value)}><option>Esencial</option><option>Profesional</option><option>Negocio</option></select></label>
            <label><span>Mensualidad</span><div className="input-prefix"><b>₡</b><input type="number" min="0" step="1000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} required /></div></label>
          </div>
          <div className="trial-note"><Sparkles size={18} /><div><strong>Se creará en periodo de prueba</strong><p>Podés activar o suspender la cuenta desde la lista de tenants.</p></div></div>
          <button className="primary-button modal-submit"><span>Crear tenant</span><ArrowRight size={17} /></button>
        </form>
      </section>
    </div>
  );
}
