"use client";

import {
  Activity,
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Gauge,
  HandCoins,
  Home,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  UserRound,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "dashboard" | "loans" | "settings" | "admin";
type LoanFilter = "all" | "late" | "today";
type Loan = {
  id: number;
  name: string;
  initials: string;
  phone: string;
  total: number;
  remaining: number;
  paidInstallments: number;
  installments: number;
  status: "late" | "today" | "current";
  lateDays: number;
  nextPayment: string;
  nextPaymentDate: string;
  installmentAmount: number;
  color: string;
  frequency: "weekly" | "biweekly" | "monthly";
};

type Tenant = {
  id: number;
  name: string;
  owner: string;
  plan: string;
  loans: number;
  status: "Activo" | "Prueba" | "Suspendido";
  amount: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);

const formatPaymentDate = (date: string) =>
  new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );

function paymentTiming(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${date}T00:00:00`);
  const difference = Math.floor((dueDate.getTime() - today.getTime()) / 86_400_000);
  return {
    status: difference < 0 ? "late" as const : difference === 0 ? "today" as const : "current" as const,
    lateDays: difference < 0 ? Math.abs(difference) : 0,
  };
}

function advancePaymentDate(date: string, frequency: Loan["frequency"]) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + (frequency === "weekly" ? 7 : frequency === "biweekly" ? 15 : 30));
  return nextDate.toISOString().slice(0, 10);
}

export default function HomePage() {
  const [view, setView] = useState<View>("dashboard");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [newLoanOpen, setNewLoanOpen] = useState(false);
  const [newTenantOpen, setNewTenantOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const restoreStorage = window.setTimeout(() => {
      try {
        const savedLoans = localStorage.getItem("presta-loans");
        const savedTenants = localStorage.getItem("presta-tenants");
        if (savedLoans) {
          const storedLoans = JSON.parse(savedLoans) as Loan[];
          setLoans(storedLoans.map((loan) => {
            const nextPaymentDate = loan.nextPaymentDate || new Date().toISOString().slice(0, 10);
            return {
              ...loan,
              frequency: loan.frequency || "weekly",
              nextPaymentDate,
              nextPayment: formatPaymentDate(nextPaymentDate),
              ...paymentTiming(nextPaymentDate),
            };
          }));
        }
        if (savedTenants) setTenants(JSON.parse(savedTenants) as Tenant[]);
      } catch {
        localStorage.removeItem("presta-loans");
        localStorage.removeItem("presta-tenants");
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreStorage);
  }, []);

  useEffect(() => {
    if (storageReady) localStorage.setItem("presta-loans", JSON.stringify(loans));
  }, [loans, storageReady]);

  useEffect(() => {
    if (storageReady) localStorage.setItem("presta-tenants", JSON.stringify(tenants));
  }, [tenants, storageReady]);

  function goTo(next: View) {
    setView(next);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function shareLoan(loan: Loan) {
    const message = `Estado de cuenta — ${loan.name}\nSaldo pendiente: ${money(loan.remaining)}\nCuotas pagadas: ${loan.paidInstallments} de ${loan.installments}\nPróximo pago: ${loan.nextPayment}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Estado de tu préstamo", text: message });
      } else {
        await navigator.clipboard.writeText(message);
        notify("Estado de cuenta copiado");
      }
    } catch {
      // The native share sheet may be dismissed intentionally.
    }
  }

  function registerPayment(loan: Loan) {
    const updated = loans.map((item) =>
      item.id === loan.id
        ? (() => {
            const nextPaymentDate = advancePaymentDate(item.nextPaymentDate, item.frequency);
            return {
              ...item,
              remaining: Math.max(0, item.remaining - item.installmentAmount),
              paidInstallments: Math.min(item.installments, item.paidInstallments + 1),
              nextPaymentDate,
              nextPayment: formatPaymentDate(nextPaymentDate),
              ...paymentTiming(nextPaymentDate),
            };
          })()
        : item,
    );
    setLoans(updated);
    setSelectedLoan(null);
    notify(`Abono de ${money(loan.installmentAmount)} registrado`);
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} goTo={goTo} loanCount={loans.length} onNewLoan={() => setNewLoanOpen(true)} />

      <main className="app-main">
        <Topbar
          admin={view === "admin"}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          goTo={goTo}
        />

        {view === "dashboard" && (
          <Dashboard loans={loans} goTo={goTo} setSelectedLoan={setSelectedLoan} onShare={shareLoan} />
        )}
        {view === "loans" && (
          <LoansView loans={loans} setSelectedLoan={setSelectedLoan} onShare={shareLoan} onNew={() => setNewLoanOpen(true)} />
        )}
        {view === "settings" && <SettingsView notify={notify} />}
        {view === "admin" && (
          <AdminView
            tenants={tenants}
            setTenants={setTenants}
            goTo={goTo}
            onNewTenant={() => setNewTenantOpen(true)}
            notify={notify}
          />
        )}
      </main>

      {view !== "admin" && <BottomNav view={view} goTo={goTo} onNew={() => setNewLoanOpen(true)} />}

      {selectedLoan && (
        <LoanSheet
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onShare={() => shareLoan(selectedLoan)}
          onPayment={() => registerPayment(selectedLoan)}
        />
      )}
      {newLoanOpen && (
        <NewLoanModal
          onClose={() => setNewLoanOpen(false)}
          onCreate={(loan) => {
            setLoans([loan, ...loans]);
            setNewLoanOpen(false);
            setView("loans");
            notify("Préstamo creado correctamente");
          }}
        />
      )}
      {newTenantOpen && (
        <NewTenantModal
          onClose={() => setNewTenantOpen(false)}
          onCreate={(tenant) => {
            setTenants([tenant, ...tenants]);
            setNewTenantOpen(false);
            notify("Tenant creado y listo para invitar");
          }}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span><Check size={16} strokeWidth={3} /></span>
          {toast}
        </div>
      )}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <span className="brand-mark"><HandCoins size={21} strokeWidth={2.3} /></span>
      {!compact && <span>Presta<span>+</span></span>}
    </div>
  );
}

function Sidebar({ view, goTo, loanCount, onNewLoan }: { view: View; goTo: (view: View) => void; loanCount: number; onNewLoan: () => void }) {
  return (
    <aside className="sidebar">
      <Brand />
      <button className="primary-button sidebar-create" onClick={onNewLoan}>
        <Plus size={18} /> Nuevo préstamo
      </button>
      <nav className="side-nav" aria-label="Navegación principal">
        <NavButton active={view === "dashboard"} icon={<LayoutDashboard />} label="Resumen" onClick={() => goTo("dashboard")} />
        <NavButton active={view === "loans"} icon={<WalletCards />} label="Préstamos" badge={String(loanCount)} onClick={() => goTo("loans")} />
        <NavButton active={view === "settings"} icon={<Settings />} label="Configuración" onClick={() => goTo("settings")} />
      </nav>
      <div className="sidebar-spacer" />
      <button className="admin-entry" onClick={() => goTo("admin")}>
        <span><ShieldCheck size={18} /></span>
        <span><strong>Panel SaaS</strong><small>Administrar tenants</small></span>
        <ChevronRight size={16} />
      </button>
      <div className="sidebar-user">
        <Avatar initials="TC" color="ink" />
        <span><strong>Tu cuenta</strong><small>Mi negocio</small></span>
        <MoreHorizontal size={18} />
      </div>
    </aside>
  );
}

function NavButton({ active, icon, label, badge, onClick }: { active: boolean; icon: React.ReactNode; label: string; badge?: string; onClick: () => void }) {
  return (
    <button className={`side-nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon}<span>{label}</span>{badge && <small>{badge}</small>}
    </button>
  );
}

function Topbar({ admin, profileOpen, setProfileOpen, goTo }: { admin: boolean; profileOpen: boolean; setProfileOpen: (open: boolean) => void; goTo: (view: View) => void }) {
  return (
    <header className="topbar">
      <div className="mobile-brand"><Brand /><span className="live-dot" /></div>
      {admin ? (
        <button className="back-tenant" onClick={() => goTo("dashboard")}><ArrowLeft size={17} /> Volver al tenant</button>
      ) : (
        <div className="desktop-context"><span className="eyebrow">ESPACIO DE TRABAJO</span><strong>Mi negocio</strong></div>
      )}
      <div className="top-actions">
        <button className="icon-button notification-button" aria-label="Notificaciones"><Bell size={20} /></button>
        <div className="profile-wrap">
          <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}>
            <Avatar initials="TC" color="ink" small />
            <span><strong>Tu cuenta</strong><small>Propietario</small></span>
            <ChevronDown size={15} />
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <button onClick={() => goTo("settings")}><UserRound size={17} /> Mi perfil</button>
              <button onClick={() => goTo("admin")}><ShieldCheck size={17} /> Panel administrador</button>
              <div />
              <button><ArrowLeft size={17} /> Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Dashboard({ loans, goTo, setSelectedLoan, onShare }: { loans: Loan[]; goTo: (view: View) => void; setSelectedLoan: (loan: Loan) => void; onShare: (loan: Loan) => void }) {
  const portfolio = loans.reduce((sum, loan) => sum + loan.remaining, 0);
  const dueToday = loans.filter((loan) => loan.status === "today" || loan.status === "late");
  const dueAmount = dueToday.reduce((sum, loan) => sum + loan.installmentAmount, 0);
  const recovered = loans.reduce((sum, loan) => sum + (loan.total - loan.remaining), 0);
  const paidInstallments = loans.reduce((sum, loan) => sum + loan.paidInstallments, 0);

  return (
    <div className="page dashboard-page">
      <section className="page-intro">
        <div>
          <span className="mobile-kicker">RESUMEN DE HOY</span>
          <h1>Hola <span>👋</span></h1>
          <p>Así se mueve tu cartera hoy.</p>
        </div>
        <button className="primary-button desktop-new" onClick={() => goTo("loans")}><Plus size={18} /> Ver préstamos</button>
      </section>

      <section className="dashboard-grid">
        <div className="main-column">
          <article className="balance-card">
            <div className="balance-noise" />
            <div className="balance-top">
              <span className="balance-icon"><WalletCards size={21} /></span>
              <span className="trend-pill"><WalletCards size={14} /> {loans.length ? "Cartera activa" : "Sin datos"}</span>
            </div>
            <p>Cartera por cobrar</p>
            <h2>{money(portfolio)}</h2>
            <div className="balance-footer">
              <div><span>Total recuperado</span><strong>{money(recovered)}</strong></div>
              <span className="balance-count">{loans.length} {loans.length === 1 ? "préstamo" : "préstamos"}</span>
            </div>
          </article>

          <div className="metric-row">
            <article className="metric-card">
              <span className="metric-icon lime"><Users size={19} /></span>
              <div><p>Préstamos activos</p><h3>{loans.length}</h3><small>{paidInstallments ? `${paidInstallments} cuotas registradas` : "Sin cuotas registradas"}</small></div>
            </article>
            <article className="metric-card">
              <span className="metric-icon peach"><Clock3 size={19} /></span>
              <div><p>Deben pagar hoy</p><h3>{dueToday.length}</h3><small className="warning-text">{money(dueAmount)} por cobrar</small></div>
            </article>
          </div>

          <section className="section-block">
            <SectionHeader title="Pendientes de hoy" action="Ver todos" onClick={() => goTo("loans")} />
            <div className="due-list">
              {dueToday.slice(0, 3).map((loan) => (
                <DueCard key={loan.id} loan={loan} onOpen={() => setSelectedLoan(loan)} onShare={() => onShare(loan)} />
              ))}
              {dueToday.length === 0 && <div className="compact-empty"><Check size={18} /><div><strong>Todo al día</strong><p>No hay cobros pendientes para hoy.</p></div></div>}
            </div>
          </section>
        </div>

        <aside className="activity-column">
          <section className="section-block activity-card">
            <SectionHeader title="Actividad reciente" />
            <div className="activity-empty"><Activity size={22} /><strong>Aún no hay actividad</strong><p>Los préstamos y abonos que registres aparecerán aquí.</p></div>
          </section>
          <article className="tip-card">
            <span><Sparkles size={19} /></span>
            <div><strong>Tip de cobranza</strong><p>Enviá recordatorios claros antes del vencimiento y mantené el estado de cuenta actualizado.</p></div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function AlertDot() {
  return <span className="alert-dot">!</span>;
}

function SectionHeader({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return (
    <div className="section-header"><h2>{title}</h2>{action && <button onClick={onClick}>{action}<ChevronRight size={15} /></button>}</div>
  );
}

function DueCard({ loan, onOpen, onShare }: { loan: Loan; onOpen: () => void; onShare: () => void }) {
  return (
    <article className="due-card" onClick={onOpen}>
      <Avatar initials={loan.initials} color={loan.color} />
      <div className="due-person">
        <strong>{loan.name}</strong>
        <span className={loan.status === "late" ? "status-overdue" : "status-today"}>
          {loan.status === "late" ? `${loan.lateDays} días de atraso` : "Vence hoy"}
        </span>
      </div>
      <div className="due-amount"><strong>{money(loan.installmentAmount)}</strong><small>{loan.nextPayment.split(",")[1] || "Hoy"}</small></div>
      <button className="share-mini" onClick={(event) => { event.stopPropagation(); onShare(); }} aria-label={`Compartir deuda de ${loan.name}`}><Share2 size={17} /></button>
    </article>
  );
}

function LoansView({ loans, setSelectedLoan, onShare, onNew }: { loans: Loan[]; setSelectedLoan: (loan: Loan) => void; onShare: (loan: Loan) => void; onNew: () => void }) {
  const [filter, setFilter] = useState<LoanFilter>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => loans.filter((loan) => {
    const matchesFilter = filter === "all" || loan.status === filter;
    const matchesQuery = loan.name.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [loans, filter, query]);

  return (
    <div className="page loans-page">
      <section className="page-intro loans-intro">
        <div><span className="mobile-kicker">TU CARTERA</span><h1>Préstamos activos</h1><p>{loans.length} {loans.length === 1 ? "préstamo" : "préstamos"} · {money(loans.reduce((sum, loan) => sum + loan.remaining, 0))} pendientes</p></div>
        <button className="primary-button desktop-new" onClick={onNew}><Plus size={18} /> Nuevo préstamo</button>
      </section>
      <div className="loan-toolbar">
        <label className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre..." /><kbd>⌘ K</kbd></label>
        <button className="filter-button" aria-label="Más filtros"><SlidersHorizontal size={18} /><span>Filtrar</span></button>
      </div>
      <div className="segmented" role="tablist">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Todos <span>{loans.length}</span></button>
        <button className={filter === "late" ? "active" : ""} onClick={() => setFilter("late")}>Atrasados <span>{loans.filter((loan) => loan.status === "late").length}</span></button>
        <button className={filter === "today" ? "active" : ""} onClick={() => setFilter("today")}>Cobrar hoy <span>{loans.filter((loan) => loan.status === "today").length}</span></button>
      </div>

      <div className="loans-list">
        {visible.map((loan) => (
          <LoanCard key={loan.id} loan={loan} onOpen={() => setSelectedLoan(loan)} onShare={() => onShare(loan)} />
        ))}
        {visible.length === 0 && (
          <div className="empty-state">
            {loans.length === 0 ? <WalletCards size={28} /> : <Search size={26} />}
            <strong>{loans.length === 0 ? "Aún no hay préstamos" : "No encontramos resultados"}</strong>
            <p>{loans.length === 0 ? "Creá el primer préstamo para comenzar a gestionar tu cartera." : "Probá con otro nombre o filtro."}</p>
            {loans.length === 0 && <button className="primary-button" onClick={onNew}><Plus size={16} /> Crear primer préstamo</button>}
          </div>
        )}
      </div>
    </div>
  );
}

function LoanCard({ loan, onOpen, onShare }: { loan: Loan; onOpen: () => void; onShare: () => void }) {
  const percentage = Math.round(((loan.total - loan.remaining) / loan.total) * 100);
  return (
    <article className="loan-card" onClick={onOpen}>
      <div className="loan-card-head">
        <Avatar initials={loan.initials} color={loan.color} />
        <div className="loan-person"><strong>{loan.name}</strong><span>{loan.phone}</span></div>
        <StatusBadge status={loan.status} days={loan.lateDays} />
        <button className="more-button" aria-label="Más acciones"><MoreHorizontal size={20} /></button>
      </div>
      <div className="loan-finances">
        <div><span>Saldo pendiente</span><strong>{money(loan.remaining)}</strong></div>
        <div><span>Préstamo original</span><strong>{money(loan.total)}</strong></div>
      </div>
      <div className="progress-row"><div className="progress-track"><i style={{ width: `${percentage}%` }} /></div><strong>{percentage}%</strong></div>
      <div className="loan-card-foot">
        <span><Check size={14} /> {loan.paidInstallments} de {loan.installments} cuotas</span>
        <span><CalendarDays size={14} /> {loan.nextPayment}</span>
        <button onClick={(event) => { event.stopPropagation(); onShare(); }}><Share2 size={16} /> Compartir</button>
      </div>
    </article>
  );
}

function StatusBadge({ status, days }: { status: Loan["status"]; days: number }) {
  const text = status === "late" ? `${days}d de atraso` : status === "today" ? "Vence hoy" : "Al día";
  return <span className={`status-badge ${status}`}><i />{text}</span>;
}

function SettingsView({ notify }: { notify: (message: string) => void }) {
  const [businessName, setBusinessName] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [dailyFee, setDailyFee] = useState("");
  const [graceDays, setGraceDays] = useState("");
  const [surcharge, setSurcharge] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [lateNotices, setLateNotices] = useState(false);

  useEffect(() => {
    const restoreSettings = window.setTimeout(() => {
      const saved = localStorage.getItem("presta-settings");
      if (!saved) return;
      try {
        const settings = JSON.parse(saved);
        setBusinessName(settings.businessName || "");
        setOwner(settings.owner || "");
        setPhone(settings.phone || "");
        setDailyFee(settings.dailyFee || "");
        setGraceDays(settings.graceDays || "");
        setSurcharge(Boolean(settings.surcharge));
        setReminders(Boolean(settings.reminders));
        setLateNotices(Boolean(settings.lateNotices));
      } catch {
        localStorage.removeItem("presta-settings");
      }
    }, 0);
    return () => window.clearTimeout(restoreSettings);
  }, []);

  function save(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem("presta-settings", JSON.stringify({ businessName, owner, phone, dailyFee, graceDays, surcharge, reminders, lateNotices }));
    notify("Configuración guardada");
  }

  return (
    <div className="page settings-page">
      <section className="page-intro"><div><span className="mobile-kicker">TU NEGOCIO</span><h1>Configuración</h1><p>Personaliza cómo gestionas y cobras tus préstamos.</p></div></section>
      <form onSubmit={save} className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-title"><span className="settings-icon"><Store size={19} /></span><div><h2>Información del negocio</h2><p>Estos datos aparecerán en los estados de cuenta.</p></div></div>
          <div className="form-grid">
            <label><span>Nombre comercial</span><input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Nombre de tu negocio" /></label>
            <label><span>Nombre del responsable</span><input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Tu nombre completo" /></label>
            <label><span>Teléfono / WhatsApp</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+506 8888 8888" /></label>
            <label><span>Moneda</span><select value="CRC" disabled><option value="CRC">CRC — Colón costarricense</option></select></label>
          </div>
        </section>
        <section className="settings-card">
          <div className="settings-card-title"><span className="settings-icon peach"><Clock3 size={19} /></span><div><h2>Atrasos y recargos</h2><p>Define las reglas que se aplican a las cuotas vencidas.</p></div></div>
          <SettingToggle title="Cobrar recargo por atraso" description="Se suma automáticamente después del período de gracia." checked={surcharge} onChange={setSurcharge} />
          <div className={`inline-fields ${!surcharge ? "disabled" : ""}`}>
            <label><span>Recargo diario</span><div className="input-prefix"><b>₡</b><input type="number" min="0" value={dailyFee} onChange={(event) => setDailyFee(event.target.value)} placeholder="1000" /></div><small>Por cada día de atraso</small></label>
            <label><span>Período de gracia</span><div className="input-suffix"><input type="number" value={graceDays} onChange={(event) => setGraceDays(event.target.value)} /><b>días</b></div><small>Antes de aplicar el recargo</small></label>
          </div>
        </section>
        <section className="settings-card">
          <div className="settings-card-title"><span className="settings-icon violet"><Bell size={19} /></span><div><h2>Recordatorios</h2><p>Mantén informados a tus clientes.</p></div></div>
          <SettingToggle title="Recordatorios automáticos" description="Enviar un WhatsApp un día antes de cada cuota." checked={reminders} onChange={setReminders} />
          <SettingToggle title="Aviso de atraso" description="Enviar un aviso al primer día de atraso." checked={lateNotices} onChange={setLateNotices} />
        </section>
        <div className="settings-actions"><button type="button" className="secondary-button">Cancelar</button><button className="primary-button"><Check size={17} /> Guardar cambios</button></div>
      </form>
    </div>
  );
}

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="setting-toggle"><div><strong>{title}</strong><p>{description}</p></div><button type="button" className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked}><span /></button></div>
  );
}

function AdminView({ tenants, setTenants, goTo, onNewTenant, notify }: { tenants: Tenant[]; setTenants: (tenants: Tenant[]) => void; goTo: (view: View) => void; onNewTenant: () => void; notify: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = tenants.filter((tenant) => tenant.name.toLowerCase().includes(query.toLowerCase()) || tenant.owner.toLowerCase().includes(query.toLowerCase()));
  const activeTenants = tenants.filter((tenant) => tenant.status === "Activo");
  const trialTenants = tenants.filter((tenant) => tenant.status === "Prueba");
  const mrr = activeTenants.reduce((sum, tenant) => sum + tenant.amount, 0);
  const managedLoans = tenants.reduce((sum, tenant) => sum + tenant.loans, 0);

  function toggleTenant(tenant: Tenant) {
    const nextStatus = tenant.status === "Suspendido" ? "Activo" : "Suspendido";
    setTenants(tenants.map((item) => item.id === tenant.id ? { ...item, status: nextStatus } : item));
    notify(nextStatus === "Suspendido" ? "Tenant suspendido" : "Tenant reactivado");
  }

  return (
    <div className="page admin-page">
      <section className="admin-welcome">
        <div><span className="admin-pill"><ShieldCheck size={14} /> ADMINISTRACIÓN</span><h1>Tu negocio, en orden.</h1><p>Gestiona cuentas, suscripciones y el crecimiento de Presta+.</p></div>
        <button className="admin-new" onClick={onNewTenant}><Plus size={18} /> Nuevo tenant</button>
      </section>
      <div className="admin-metrics">
        <AdminMetric icon={<Building2 />} tone="lime" label="Tenants activos" value={String(activeTenants.length)} detail={`${tenants.length} registrados`} />
        <AdminMetric icon={<CircleDollarSign />} tone="violet" label="Ingreso mensual" value={money(mrr)} detail="Mensualidades activas" />
        <AdminMetric icon={<Activity />} tone="peach" label="Préstamos gestionados" value={String(managedLoans)} detail="Entre todos los tenants" />
        <AdminMetric icon={<Gauge />} tone="blue" label="En período de prueba" value={String(trialTenants.length)} detail="Pendientes de activación" />
      </div>
      <section className="tenant-section">
        <div className="tenant-section-head"><div><h2>Tenants</h2><p>Todos los espacios de trabajo registrados.</p></div><label className="search-box admin-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tenant..." /></label></div>
        <div className="tenant-table">
          <div className="tenant-table-head"><span>Negocio</span><span>Plan</span><span>Préstamos</span><span>Estado</span><span>Mensualidad</span><span /></div>
          {visible.map((tenant) => (
            <div className="tenant-row" key={tenant.id}>
              <div className="tenant-name"><span>{tenant.name.slice(0, 1)}</span><div><strong>{tenant.name}</strong><small>{tenant.owner}</small></div></div>
              <span className="plan-chip"><Zap size={13} /> {tenant.plan}</span>
              <span className="tenant-loans">{tenant.loans}<small> activos</small></span>
              <span className={`tenant-status ${tenant.status.toLowerCase()}`}><i />{tenant.status}</span>
              <strong className="tenant-price">{tenant.amount ? money(tenant.amount) : "—"}</strong>
              <button className="tenant-menu" onClick={() => toggleTenant(tenant)} aria-label={`${tenant.status === "Suspendido" ? "Reactivar" : "Suspender"} ${tenant.name}`} title={tenant.status === "Suspendido" ? "Reactivar" : "Suspender"}><MoreHorizontal size={19} /></button>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="tenant-empty">
              <Building2 size={24} />
              <div><strong>{tenants.length === 0 ? "Aún no hay tenants" : "Sin resultados"}</strong><p>{tenants.length === 0 ? "Creá el primero para comenzar a gestionar clientes SaaS." : "Probá con otro término de búsqueda."}</p></div>
              {tenants.length === 0 && <button className="primary-button" onClick={onNewTenant}><Plus size={16} /> Crear tenant</button>}
            </div>
          )}
        </div>
      </section>
      <button className="admin-mobile-back" onClick={() => goTo("dashboard")}><ArrowLeft size={17} /> Volver al panel del tenant</button>
    </div>
  );
}

function AdminMetric({ icon, tone, label, value, detail }: { icon: React.ReactNode; tone: string; label: string; value: string; detail: string }) {
  return (
    <article className="admin-metric"><span className={`admin-metric-icon ${tone}`}>{icon}</span><p>{label}</p><h3>{value}</h3><small>{detail}</small></article>
  );
}

function BottomNav({ view, goTo, onNew }: { view: View; goTo: (view: View) => void; onNew: () => void }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      <button className={view === "dashboard" ? "active" : ""} onClick={() => goTo("dashboard")}><Home size={21} /><span>Resumen</span></button>
      <button className={view === "loans" ? "active" : ""} onClick={() => goTo("loans")}><CreditCard size={21} /><span>Préstamos</span></button>
      <button className="bottom-add" onClick={onNew} aria-label="Nuevo préstamo"><Plus size={25} /></button>
      <button onClick={() => goTo("loans")}><ReceiptText size={21} /><span>Cobros</span></button>
      <button className={view === "settings" ? "active" : ""} onClick={() => goTo("settings")}><Settings size={21} /><span>Ajustes</span></button>
    </nav>
  );
}

function Avatar({ initials, color, small = false }: { initials: string; color: string; small?: boolean }) {
  return <span className={`avatar ${color} ${small ? "small" : ""}`}>{initials}</span>;
}

function LoanSheet({ loan, onClose, onShare, onPayment }: { loan: Loan; onClose: () => void; onShare: () => void; onPayment: () => void }) {
  const paid = loan.total - loan.remaining;
  const percentage = Math.round((paid / loan.total) * 100);
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={`Detalle del préstamo de ${loan.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="loan-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head"><div><span className="sheet-kicker">DETALLE DEL PRÉSTAMO</span><h2>Estado de cuenta</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
        <div className="sheet-person"><Avatar initials={loan.initials} color={loan.color} /><div><strong>{loan.name}</strong><span>{loan.phone}</span></div><StatusBadge status={loan.status} days={loan.lateDays} /></div>
        <div className="sheet-balance"><p>Saldo pendiente</p><h3>{money(loan.remaining)}</h3><div className="progress-track"><i style={{ width: `${percentage}%` }} /></div><div><span>{money(paid)} pagados</span><span>{percentage}% completado</span></div></div>
        <div className="sheet-grid">
          <div><span>Préstamo original</span><strong>{money(loan.total)}</strong></div>
          <div><span>Cuota</span><strong>{money(loan.installmentAmount)}</strong></div>
          <div><span>Cuotas pagadas</span><strong>{loan.paidInstallments} de {loan.installments}</strong></div>
          <div><span>Próximo cobro</span><strong>{loan.nextPayment}</strong></div>
        </div>
        {loan.status === "late" && <div className="late-notice"><AlertDot /><div><strong>Pago atrasado por {loan.lateDays} días</strong><p>El recargo se calculará según la configuración del negocio.</p></div></div>}
        <div className="sheet-actions"><button className="secondary-button" onClick={onShare}><Share2 size={18} /> Compartir estado</button><button className="primary-button" onClick={onPayment}><CircleDollarSign size={18} /> Registrar abono</button></div>
      </div>
    </div>
  );
}

function NewLoanModal({ onClose, onCreate }: { onClose: () => void; onCreate: (loan: Loan) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState("");
  const [frequency, setFrequency] = useState<Loan["frequency"]>("weekly");
  const [firstPayment, setFirstPayment] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const total = Number(amount);
    const count = Number(installments);
    const timing = paymentTiming(firstPayment);
    onCreate({
      id: Date.now(),
      name,
      initials: name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      phone,
      total,
      remaining: total,
      paidInstallments: 0,
      installments: count,
      ...timing,
      nextPayment: formatPaymentDate(firstPayment),
      nextPaymentDate: firstPayment,
      installmentAmount: Math.ceil(total / count),
      color: "teal",
      frequency,
    });
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Crear nuevo préstamo" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="form-modal" onSubmit={submit}>
        <div className="sheet-handle" />
        <div className="sheet-head"><div><span className="sheet-kicker">NUEVO REGISTRO</span><h2>Crear préstamo</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div>
        <div className="form-stack">
          <label><span>Nombre del cliente</span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Sofía Martínez" /></label>
          <label><span>Teléfono / WhatsApp</span><input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+506 8888 8888" /></label>
          <div className="two-fields"><label><span>Monto del préstamo</span><div className="input-prefix"><b>₡</b><input required type="number" min="1000" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100000" /></div></label><label><span>Número de cuotas</span><input required type="number" min="1" value={installments} onChange={(event) => setInstallments(event.target.value)} placeholder="10" /></label></div>
          <label><span>Frecuencia de pago</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as Loan["frequency"])}><option value="weekly">Semanal</option><option value="biweekly">Quincenal</option><option value="monthly">Mensual</option></select></label>
          <label><span>Fecha del primer pago</span><input required type="date" value={firstPayment} onChange={(event) => setFirstPayment(event.target.value)} /></label>
          <div className="calculated-payment"><span>Cuota estimada</span><strong>{money(Math.ceil(Number(amount || 0) / Number(installments || 1)))}</strong></div>
        </div>
        <button className="primary-button modal-submit"><Plus size={18} /> Crear préstamo</button>
      </form>
    </div>
  );
}

function NewTenantModal({ onClose, onCreate }: { onClose: () => void; onCreate: (tenant: Tenant) => void }) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [plan, setPlan] = useState("Pro");
  function submit(event: FormEvent) {
    event.preventDefault();
    onCreate({ id: Date.now(), name, owner, plan, loans: 0, status: "Prueba", amount: 0 });
  }
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Crear tenant" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="form-modal tenant-modal" onSubmit={submit}>
        <div className="sheet-handle" />
        <div className="sheet-head"><div><span className="sheet-kicker">NUEVO CLIENTE SAAS</span><h2>Crear tenant</h2></div><button type="button" className="icon-button" onClick={onClose}><X size={20} /></button></div>
        <div className="form-stack">
          <label><span>Nombre del negocio</span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Préstamos El Centro" /></label>
          <label><span>Propietario</span><input required value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Nombre completo" /></label>
          <label><span>Correo para la invitación</span><input required type="email" placeholder="cliente@negocio.com" /></label>
          <label><span>Plan</span><select value={plan} onChange={(event) => setPlan(event.target.value)}><option>Básico</option><option>Pro</option></select></label>
          <div className="trial-note"><Sparkles size={18} /><div><strong>Incluye 14 días de prueba</strong><p>Podrás activar la suscripción cuando el cliente esté listo.</p></div></div>
        </div>
        <button className="primary-button modal-submit"><Building2 size={18} /> Crear e invitar</button>
      </form>
    </div>
  );
}
