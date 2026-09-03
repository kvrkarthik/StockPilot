import { Download, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { EmptyState, PageHeader, Spinner } from "../components/ui";
import api, { errorMessage } from "../services/api";
import type { Page, Product, Supplier } from "../types";

type RecordRow = Record<string, any>;

interface CustomerRow { id: number; name: string; email?: string; phone?: string; address?: string }

export function ResourcePage({ title, endpoint, description }: { title: string; endpoint: string; description: string }) {
  const [rows, setRows] = useState<RecordRow[]>();
  const [open, setOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [customersList, setCustomersList] = useState<CustomerRow[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RecordRow>();

  const loadData = () => {
    api.get<Page<RecordRow> | RecordRow[]>(endpoint)
      .then((r) => setRows(Array.isArray(r.data) ? r.data : r.data.items))
      .catch((e) => toast.error(errorMessage(e)));
  };

  useEffect(() => {
    loadData();
  }, [endpoint]);

  const handleOpenModal = async () => {
    setOpen(true);
    try {
      if (endpoint === "/purchases") {
        const [supRes, prodRes] = await Promise.all([
          api.get<Page<Supplier>>("/suppliers"),
          api.get<Page<Product>>("/products"),
        ]);
        setSuppliersList(supRes.data.items);
        setProductsList(prodRes.data.items);
      } else if (endpoint === "/sales") {
        const [custRes, prodRes] = await Promise.all([
          api.get<Page<CustomerRow>>("/customers"),
          api.get<Page<Product>>("/products"),
        ]);
        setCustomersList(custRes.data.items);
        setProductsList(prodRes.data.items);
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const onSubmit = async (values: RecordRow) => {
    try {
      let payload = { ...values };
      if (endpoint === "/purchases") {
        payload = {
          supplier_id: Number(values.supplier_id),
          invoice_number: values.invoice_number || null,
          notes: values.notes || null,
          items: [
            {
              product_id: Number(values.product_id),
              quantity: Number(values.quantity),
              unit_cost: Number(values.unit_cost),
            },
          ],
        };
      } else if (endpoint === "/sales") {
        payload = {
          customer_id: values.customer_id ? Number(values.customer_id) : null,
          items: [
            {
              product_id: Number(values.product_id),
              quantity: Number(values.quantity),
            },
          ],
        };
      }

      await api.post(endpoint, payload);
      toast.success(`${title.slice(0, -1)} created successfully`);
      reset();
      setOpen(false);
      loadData();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const buttonLabel = 
    endpoint === "/suppliers" ? "Add supplier" :
    endpoint === "/customers" ? "Add customer" :
    endpoint === "/purchases" ? "Create purchase order" :
    endpoint === "/sales" ? "Record sale" :
    `Add ${title.toLowerCase()}`;

  return (
    <div>
      <PageHeader 
        title={title} 
        description={description}
        action={
          <button className="btn-primary" onClick={handleOpenModal}>
            <Plus className="size-4" />
            {buttonLabel}
          </button>
        }
      />

      {!rows ? (
        <Spinner />
      ) : !rows.length ? (
        <EmptyState title={`No ${title.toLowerCase()} found`} description={`Click "${buttonLabel}" above to add your first record.`} />
      ) : (
        <div className="table-shell bg-white dark:bg-slate-900">
          <table>
            <thead>
              <tr>
                {Object.keys(rows[0])
                  .filter((k) => !["items", "description", "address", "deleted_at", "updated_at", "role_id", "password_hash"].includes(k))
                  .slice(0, 6)
                  .map((k) => (
                    <th key={k}>{k.replaceAll("_", " ")}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={String(row.id ?? i)}>
                  {Object.entries(row)
                    .filter(([k]) => !["items", "description", "address", "deleted_at", "updated_at", "role_id", "password_hash"].includes(k))
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <td key={k}>
                        {v == null ? "—" : typeof v === "object" ? (v.name || v.code || JSON.stringify(v)) : String(v)}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex justify-between items-center">
              <h2 className="text-lg font-bold">{buttonLabel}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="size-5" />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
              {endpoint === "/suppliers" && (
                <>
                  <label><span className="label">Supplier Name</span><input className="field" required {...register("name")} /></label>
                  <label><span className="label">Email Address</span><input className="field" type="email" {...register("email")} /></label>
                  <label><span className="label">Phone Number</span><input className="field" {...register("phone")} /></label>
                  <label><span className="label">Tax ID / GSTIN</span><input className="field" {...register("tax_id")} /></label>
                  <label><span className="label">Address</span><textarea className="field" rows={2} {...register("address")} /></label>
                </>
              )}

              {endpoint === "/customers" && (
                <>
                  <label><span className="label">Customer Name</span><input className="field" required {...register("name")} /></label>
                  <label><span className="label">Email Address</span><input className="field" type="email" {...register("email")} /></label>
                  <label><span className="label">Phone Number</span><input className="field" {...register("phone")} /></label>
                  <label><span className="label">Address</span><textarea className="field" rows={2} {...register("address")} /></label>
                </>
              )}

              {endpoint === "/purchases" && (
                <>
                  <label>
                    <span className="label">Supplier</span>
                    <select className="field" required {...register("supplier_id")}>
                      <option value="">Select Supplier</option>
                      {suppliersList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="label">Product</span>
                    <select className="field" required {...register("product_id")}>
                      <option value="">Select Product</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                      ))}
                    </select>
                  </label>
                  <label><span className="label">Order Quantity</span><input className="field" type="number" min="1" required defaultValue="1" {...register("quantity")} /></label>
                  <label><span className="label">Unit Cost (₹)</span><input className="field" type="number" min="0" step="0.01" required {...register("unit_cost")} /></label>
                  <label><span className="label">Invoice Number</span><input className="field" {...register("invoice_number")} /></label>
                  <label><span className="label">Notes</span><textarea className="field" rows={2} {...register("notes")} /></label>
                </>
              )}

              {endpoint === "/sales" && (
                <>
                  <label>
                    <span className="label">Customer (Optional)</span>
                    <select className="field" {...register("customer_id")}>
                      <option value="">Guest Customer</option>
                      {customersList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="label">Product</span>
                    <select className="field" required {...register("product_id")}>
                      <option value="">Select Product</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} - ₹{p.price} (In Stock: {p.quantity})</option>
                      ))}
                    </select>
                  </label>
                  <label><span className="label">Quantity Sold</span><input className="field" type="number" min="1" required defaultValue="1" {...register("quantity")} /></label>
                </>
              )}

              <div className="mt-2 flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const download = async (type: string, format: string) => {
    try {
      const response = await api.get(`/reports/${type}`, { params: { format }, responseType: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(response.data);
      link.download = `${type}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Reports" description="Export operational data for analysis and reconciliation." />
      <div className="grid gap-5 md:grid-cols-2">
        {["sales", "inventory"].map((type) => (
          <article className="card" key={type}>
            <h2 className="text-lg font-semibold capitalize">{type} report</h2>
            <p className="my-4 text-sm text-slate-500">Current {type} records with financial and quantity fields.</p>
            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => download(type, "csv")}>
                <Download className="size-4" />
                CSV
              </button>
              <button className="btn-primary" onClick={() => download(type, "xlsx")}>
                <Download className="size-4" />
                Excel
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<RecordRow>();
  useEffect(() => {
    api.get("/settings")
      .then((r) => setSettings(r.data))
      .catch((e) => toast.error(errorMessage(e)));
  }, []);

  if (!settings) return <Spinner />;

  const save = async () => {
    const payload = Object.fromEntries(
      ["company_name", "company_address", "tax_percentage", "currency", "theme"].map((key) => [key, settings[key]])
    );
    try {
      await api.put("/settings", payload);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Company defaults used for invoices and taxation." />
      <section className="card max-w-2xl space-y-4">
        {["company_name", "company_address", "tax_percentage", "currency", "theme"].map((key) => (
          <label key={key}>
            <span className="label capitalize">{key.replaceAll("_", " ")}</span>
            <input
              className="field"
              value={String(settings[key] ?? "")}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
            />
          </label>
        ))}
        <button className="btn-primary" onClick={save}>Save settings</button>
      </section>
    </div>
  );
}
