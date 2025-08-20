import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Plus, Server, Database, Hammer, AlertTriangle, CheckCircle2, Settings2, Network, Braces, Sparkles } from "lucide-react";

/**
 * Microservices Starter – Awesome UI (pure JSX)
 * - Tailwind-only UI, no external kits
 * - Cards with health, tables with skeletons, empty states, error banners
 * - Inline endpoint editor (localStorage)
 * - Toasts (no deps)
 * - NEW: quick sample data seeding buttons
 */

const DEFAULTS = {
  node: import.meta.env.VITE_NODE_API_URL || "http://localhost:4005",
  py: import.meta.env.VITE_PY_API_URL || "http://localhost:5005",
  go: import.meta.env.VITE_GO_API_URL || "http://localhost:7005",
};

export default function App() {
  const [base, setBase] = useLocalBase(DEFAULTS);

  const users = useService({ key: "users", list: `${base.node}/api/users`, create: `${base.node}/api/users` });
  const items = useService({ key: "items", list: `${base.py}/api/items`, create: `${base.py}/api/items` });
  const products = useService({ key: "products", list: `${base.go}/api/products`, create: `${base.go}/api/products` });

  const anyLoading = users.loading || items.loading || products.loading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <Header base={base} setBase={setBase} refreshAll={() => { users.refresh(); items.refresh(); products.refresh(); }} loading={anyLoading} />

      <main className="mx-auto max-w-7xl px-4 pb-24">
        {/* Status Row */}
        <section className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard icon={Server} title="Users (Node + Mongo)" state={users} color="from-indigo-500 to-sky-500" example={randomUser} />
          <ServiceCard icon={Database} title="Items (FastAPI + Postgres)" state={items} color="from-emerald-500 to-lime-500" example={randomItem} />
          <ServiceCard icon={Hammer} title="Products (Go + Postgres)" state={products} color="from-fuchsia-500 to-pink-500" example={randomProduct} />
        </section>

        {/* Data Panels */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <DataPanel title="Users" state={users} primaryKey="email" schema={["name", "email"]} />
          <DataPanel title="Items" state={items} primaryKey="id" schema={["id", "name"]} />
          <DataPanel title="Products" state={products} primaryKey="id" schema={["id", "name"]} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

/** Header **/
function Header({ base, setBase, refreshAll, loading }) {
  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/30 blur" />
            <div className="relative flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold text-slate-800">Microservices Starter</span>
            </div>
          </div>
          <Badge>UI Edition</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BaseEditor base={base} setBase={setBase} />

          <Button onClick={refreshAll} disabled={loading} variant="ghost">
            <RefreshCw className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
            <span className="hidden sm:inline">Refresh All</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Base URL editor **/
function BaseEditor({ base, setBase }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button onClick={() => setOpen((v) => !v)} variant="outline">
        <Settings2 className="h-4 w-4" />
        <span className="hidden sm:inline">Configure Endpoints</span>
      </Button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[24rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Network className="h-4 w-4" /> Base URLs</h3>
          <div className="space-y-2">
            <InputRow label="Node" value={base.node} onChange={(v) => setBase((s) => ({ ...s, node: v }))} />
            <InputRow label="FastAPI" value={base.py} onChange={(v) => setBase((s) => ({ ...s, py: v }))} />
            <InputRow label="Go" value={base.go} onChange={(v) => setBase((s) => ({ ...s, go: v }))} />
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={() => setBase(DEFAULTS)} variant="ghost">Reset</Button>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputRow({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-slate-600">{label}</span>
      <input
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500/20 focus:ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`http://localhost:0000`}
      />
    </label>
  );
}

/** Service Card **/
function ServiceCard({ title, icon: Icon, state, color, example }) {
  const { data, loading, error, create, createMany, refresh } = state;
  const gradient = `bg-gradient-to-r ${color}`;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 w-full ${gradient}`} />
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-slate-700" />
            <h3 className="font-semibold text-slate-800">{title}</h3>
          </div>
          <StatusPill loading={loading} error={error} ok={Array.isArray(data)} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {loading ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading…</span>
            ) : error ? (
              <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="h-4 w-4" /> {error}</span>
            ) : (
              <span>{Array.isArray(data) ? data.length : 0} records</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => refresh()} variant="ghost"><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Button onClick={() => create(example())}><Plus className="h-4 w-4" />Add</Button>
            <Button onClick={() => createMany(5)} variant="outline">+5</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ loading, error, ok }) {
  if (loading) return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"><Loader2 className="h-3 w-3 animate-spin" /> Loading</span>;
  if (error) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700"><AlertTriangle className="h-3 w-3" /> Issue</span>;
  if (ok) return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Healthy</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Unknown</span>;
}

/** Data Panel **/
function DataPanel({ title, state, primaryKey, schema }) {
  const { data, loading, error, refresh } = state;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <Braces className="h-4 w-4 text-slate-600" />
          <h4 className="font-semibold text-slate-800">{title}</h4>
        </div>
        <Button onClick={refresh} variant="ghost"><RefreshCw className="h-4 w-4" />Refresh</Button>
      </div>

      <div className="p-4">
        {loading && <SkeletonRows />}
        {!loading && error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {error}</div>
          </div>
        )}
        {!loading && !error && (
          Array.isArray(data) && data.length > 0 ? (
            <MiniTable rows={data} primaryKey={primaryKey} schema={schema} />
          ) : (
            <EmptyState title={`No ${title.toLowerCase()} yet`} />
          )
        )}
      </div>
    </div>
  );
}

function MiniTable({ rows, primaryKey, schema }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {schema.map((key) => (
              <th key={key} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {rows.map((row) => (
            <tr key={row[primaryKey] ?? JSON.stringify(row)} className="hover:bg-slate-50">
              {schema.map((key) => (
                <td key={key} className="px-3 py-2 text-slate-700">{coerceToString(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-600">
      <Server className="h-6 w-6" />
      <p className="text-sm">{title}. Try adding one from the cards above.</p>
    </div>
  );
}

/** Footer **/
function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      Built with ❤️ — modern, minimal, and fast.
    </footer>
  );
}

/** Hooks **/
function useLocalBase(defaults) {
  const key = "ms-ui-base";
  const [base, _setBase] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaults;
    } catch {
      return defaults;
    }
  });
  const setBase = (v) => {
    const next = typeof v === "function" ? v(base) : v;
    _setBase(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };
  return [base, setBase];
}

function useService({ key, list, create }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(list, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      if (e?.name !== "AbortError") setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const createOne = async (body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      await fetchList();
      toast.success("Added successfully");
    } catch (e) {
      setError(e?.message || "Failed to create");
      toast.error("Failed to add");
    } finally {
      setLoading(false);
    }
  };

  const createMany = async (n = 5) => {
    setLoading(true);
    setError(null);
    try {
      const payloads = Array.from({ length: n }).map(() => (typeof window.__exampleGen === "function" ? window.__exampleGen(key) : null));
      // If no global exampleGen, fall back to a simple POST loop handled by callers
      if (payloads.every((p) => p)) {
        await Promise.all(payloads.map((p) => fetch(create, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })));
      }
      await fetchList();
      toast.success(`Added ${n} samples`);
    } catch (e) {
      setError(e?.message || "Failed to add samples");
      toast.error("Failed to add samples");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  return {
    data,
    loading,
    error,
    refresh: fetchList,
    create: createOne,
    createMany,
  };
}

/** Utilities **/
function coerceToString(v) {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 shadow-sm">{children}</span>
  );
}

function Button({ children, onClick, disabled, variant = "solid" }) {
  const base = "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60";
  const styles = {
    solid: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-200 bg-white hover:bg-slate-50",
    ghost: "hover:bg-slate-100",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/** Tiny toast system (no deps) **/
const toast = {
  success: (msg) => pushToast({ msg, tone: "success" }),
  error: (msg) => pushToast({ msg, tone: "error" }),
};

const listeners = [];
function pushToast(t) { listeners.forEach((fn) => fn(t)); }

function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (t) => {
      const id = crypto.randomUUID();
      setItems((s) => [...s, { ...t, id }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 2500);
    };
    listeners.push(on);
    return () => {
      const i = listeners.indexOf(on);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg ${t.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Render toasts globally
function RootWithToasts() {
  return (
    <>
      <App />
      <Toasts />
    </>
  );
}

export { RootWithToasts as Component };

/** Random sample payload helpers **/
function randomUser() {
  const n = Math.floor(Math.random() * 10000);
  return { name: `alice ${n}`, email: `alice${n}@example.com` };
}
function randomItem() {
  const nouns = ["Widget", "Gadget", "Doohickey", "Thingamajig", "Whatsit"]; 
  return { name: nouns[Math.floor(Math.random() * nouns.length)] };
}
function randomProduct() {
  const nouns = ["Widget", "Gizmo", "Bolt", "Sprocket", "Bracket"]; 
  return { name: nouns[Math.floor(Math.random() * nouns.length)] };
}

// Optional: allow bulk create to pull examples if desired
if (!window.__exampleGen) {
  window.__exampleGen = (key) => {
    if (key === "users") return randomUser();
    if (key === "items") return randomItem();
    if (key === "products") return randomProduct();
    return null;
  };
}
