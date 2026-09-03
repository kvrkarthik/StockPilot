import { Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Badge, EmptyState, PageHeader, Spinner } from "../components/ui";
import api, { errorMessage } from "../services/api";
import type { Category, Page, Product, Supplier } from "../types";

type ProductForm = {
  sku: string; barcode?: string; name: string; description?: string; category_id: number;
  supplier_id?: number; price: number; cost: number; quantity: number; minimum_stock: number; maximum_stock?: number;
};
export default function ProductsPage() {
  const [result, setResult] = useState<Page<Product>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProductForm>();
  const load = useCallback(() => api.get<Page<Product>>("/products", { params: { search } }).then((r) => setResult(r.data)).catch((e) => toast.error(errorMessage(e))), [search]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { Promise.all([api.get<Page<Category>>("/categories"), api.get<Page<Supplier>>("/suppliers")]).then(([c,s]) => { setCategories(c.data.items); setSuppliers(s.data.items); }); }, []);
  const submit = async (values: ProductForm) => {
    try { await api.post("/products", { ...values, supplier_id: values.supplier_id || null, maximum_stock: values.maximum_stock || null }); toast.success("Product created"); reset(); setOpen(false); await load(); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  const remove = async (product: Product) => {
    if (!confirm(`Delete ${product.name}?`)) return;
    try { await api.delete(`/products/${product.id}`); toast.success("Product deleted"); await load(); } catch (e) { toast.error(errorMessage(e)); }
  };
  return <div><PageHeader title="Products" description="Search, filter, and maintain the complete product catalog." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="size-4"/>Add product</button>} />
    <div className="card mb-5">
  <label className="relative block w-full">
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    <input
      className="field pl-10"
      placeholder="Search by product name or SKU"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </label>
</div>
    {!result ? <Spinner/> : !result.items.length ? <EmptyState title="No products found" description="Change the search or add your first product."/> : <div className="table-shell bg-white dark:bg-slate-900"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>{result.items.map((p) => <tr key={p.id}><td><div className="font-semibold">{p.name}</div><div className="text-xs text-slate-500">{p.supplier?.name ?? "No supplier"}</div></td><td>{p.sku}</td><td>{p.category.name}</td><td>₹{Number(p.price).toFixed(2)}</td><td><Badge tone={p.quantity === 0 ? "bad" : p.quantity <= p.minimum_stock ? "warn" : "good"}>{p.quantity} units</Badge></td><td><button className="text-sm font-medium text-rose-600" onClick={() => remove(p)}>Delete</button></td></tr>)}</tbody></table></div>}
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"><div className="mb-5 flex justify-between"><h2 className="text-lg font-bold">New product</h2><button onClick={() => setOpen(false)}><X/></button></div><form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
      <label><span className="label">Name</span><input className="field" required {...register("name")}/></label><label><span className="label">SKU</span><input className="field" required {...register("sku")}/></label>
      <label><span className="label">Barcode</span><input className="field" {...register("barcode")}/></label><label><span className="label">Category</span><select className="field" required {...register("category_id", { valueAsNumber: true })}><option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label><span className="label">Supplier</span><select className="field" {...register("supplier_id", { valueAsNumber: true })}><option value="">None</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label><span className="label">Price</span><input className="field" type="number" min="0" step=".01" required {...register("price", { valueAsNumber: true })}/></label>
      <label><span className="label">Cost</span><input className="field" type="number" min="0" step=".01" required {...register("cost", { valueAsNumber: true })}/></label><label><span className="label">Opening stock</span><input className="field" type="number" min="0" defaultValue="0" {...register("quantity", { valueAsNumber: true })}/></label>
      <label><span className="label">Minimum stock</span><input className="field" type="number" min="0" defaultValue="0" {...register("minimum_stock", { valueAsNumber: true })}/></label><label><span className="label">Maximum stock</span><input className="field" type="number" min="0" {...register("maximum_stock", { valueAsNumber: true })}/></label>
      <label className="sm:col-span-2"><span className="label">Description</span><textarea className="field" rows={3} {...register("description")}/></label><div className="flex justify-end gap-3 sm:col-span-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>Create product</button></div>
    </form></div></div>}
  </div>;
}

