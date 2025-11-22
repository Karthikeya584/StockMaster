import React, { useEffect, useState } from "react";
export type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category?: string;
  quantity_on_hand: number;
  reserved_quantity?: number;
  reorder_level?: number;
};

const mockProducts: Product[] = [
  { id: "p-1", sku: "SKU-1001", name: "Printer Paper A4 (500pcs)", unit: "pack", category: "Stationery", quantity_on_hand: 120, reserved_quantity: 0, reorder_level: 20 },
  { id: "p-2", sku: "SKU-1002", name: "AA Batteries (pack of 4)", unit: "pack", category: "Electronics", quantity_on_hand: 45, reserved_quantity: 5, reorder_level: 30 },
  { id: "p-3", sku: "SKU-2001", name: "Blue T-Shirt (L)", unit: "piece", category: "Apparel", quantity_on_hand: 8, reserved_quantity: 1, reorder_level: 10 },
];

async function apiFetchProducts(): Promise<Product[]> {
  await new Promise((r) => setTimeout(r, 150));
  return JSON.parse(JSON.stringify(mockProducts));
}
async function apiReceiveStock(productId: string, qty: number): Promise<Product | null> {
  await new Promise((r) => setTimeout(r, 120));
  const p = mockProducts.find((x) => x.id === productId);
  if (!p) return null;
  p.quantity_on_hand += qty;
  return JSON.parse(JSON.stringify(p));
}
async function apiIssueStock(productId: string, qty: number): Promise<Product | null> {
  await new Promise((r) => setTimeout(r, 120));
  const p = mockProducts.find((x) => x.id === productId);
  if (!p) return null;
  p.quantity_on_hand = Math.max(0, p.quantity_on_hand - qty);
  return JSON.parse(JSON.stringify(p));
}

export default function InventoryApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<"receive" | "issue">("receive");
  const [qtyInput, setQtyInput] = useState<number>(1);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetchProducts().then((data) => {
      if (!mounted) return;
      setProducts(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const filtered = products.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
  });

  async function openModal(product: Product, mode: "receive" | "issue") {
    setSelected(product);
    setModalMode(mode);
    setQtyInput(1);
  }
  async function submitModal() {
    if (!selected) return;
    setMessage(null);
    try {
      if (modalMode === "receive") {
        const updated = await apiReceiveStock(selected.id, qtyInput);
        if (updated) updateLocal(updated);
        setMessage(`Received ${qtyInput} ${selected.unit}(s) for ${selected.name}`);
      } else {
        if (qtyInput > selected.quantity_on_hand) {
          setMessage("Warning: issuing more than available; quantity will be floored to 0.");
        }
        const updated = await apiIssueStock(selected.id, qtyInput);
        if (updated) updateLocal(updated);
        setMessage(`Issued ${qtyInput} ${selected.unit}(s) for ${selected.name}`);
      }
    } catch (err) {
      setMessage("Operation failed — check console for details.");
      console.error(err);
    }
    setTimeout(() => { setSelected(null); setMessage(null); }, 900);
  }
  function updateLocal(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0' }}>
        <div>
          <h1 style={{ margin: 0 }}>Inventory Management (Demo)</h1>
          <div style={{ color: '#6b7280' }}>Centralized product list, quick receive/issue flows</div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 16 }}>
        <aside style={{ width: 260, background: '#fff', padding: 12, borderRadius: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#6b7280' }}>Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search SKU, name or category" style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>KPIs</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Total SKUs</div>
              <div style={{ fontWeight: 600 }}>{products.length}</div>
            </div>
            <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 6, flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Low stock</div>
              <div style={{ fontWeight: 600 }}>{products.filter((p) => p.reorder_level && p.quantity_on_hand <= p.reorder_level).length}</div>
            </div>
          </div>
        </aside>

        <main style={{ flex: 1 }}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Products</h2>
              <div style={{ color: '#6b7280' }}>{loading ? 'Loading...' : `${filtered.length} shown`}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {filtered.map((p) => (
                <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{p.sku}</div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>On hand</div>
                        <div style={{ fontWeight: 700, color: (p.quantity_on_hand <= (p.reorder_level ?? 0)) ? '#dc2626' : '#111827' }}>{p.quantity_on_hand}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Reserved</div>
                        <div>{p.reserved_quantity ?? 0}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Category: {p.category ?? '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => openModal(p, 'receive')} style={{ flex: 1, padding: 8, background: '#16a34a', color: '#fff', borderRadius: 6 }}>Receive</button>
                    <button onClick={() => openModal(p, 'issue')} style={{ flex: 1, padding: 8, background: '#dc2626', color: '#fff', borderRadius: 6 }}>Issue</button>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading && <div style={{ marginTop: 12, textAlign: 'center', color: '#6b7280' }}>No products match your search.</div>}
          </div>
        </main>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{modalMode === 'receive' ? 'Receive Stock' : 'Issue Stock'}</div>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent' }}>✕</button>
            </div>
            <div style={{ marginBottom: 8 }}>{selected.sku} — {selected.name}</div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: '#6b7280' }}>Quantity</label>
              <input type="number" value={qtyInput} onChange={(e) => setQtyInput(Math.max(0, Number(e.target.value)))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
            </div>
            <div style={{ color: '#6b7280', marginBottom: 8 }}>On hand: <span style={{ fontWeight: 700 }}>{selected.quantity_on_hand}</span></div>
            {message && <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6 }}>{message}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setSelected(null)} style={{ padding: 8 }}>Cancel</button>
              <button onClick={submitModal} style={{ padding: 8, background: modalMode === 'receive' ? '#16a34a' : '#dc2626', color: '#fff', borderRadius: 6 }}>{modalMode === 'receive' ? 'Confirm Receive' : 'Confirm Issue'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
