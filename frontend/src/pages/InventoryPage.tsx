import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PageHeader, Spinner } from "../components/ui";
import api, { errorMessage } from "../services/api";
import type { Page, Product, Transaction } from "../types";

type Movement = { product_id: number; transaction_type: string; quantity: number; notes?: string };
export default function InventoryPage() {
  const [history, setHistory] = useState<Page<Transaction>>();
  const [products, setProducts] = useState<Product[]>([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Movement>({ defaultValues: { transaction_type: "stock_in", quantity: 1 } });
  const load = useCallback(() => Promise.all([api.get<Page<Transaction>>("/inventory/history"), api.get<Page<Product>>("/products", { params: { size: 100 } })]).then(([h,p]) => { setHistory(h.data); setProducts(p.data.items); }).catch((e) => toast.error(errorMessage(e))), []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (data: Movement) => { try { await api.post("/inventory/movements", data); toast.success("Stock updated"); reset({ transaction_type: "stock_in", quantity: 1 }); await load(); } catch (e) { toast.error(errorMessage(e)); } };
  return <div><PageHeader title="Inventory" description="Record stock movements with automatic quantity validation."/><div className="grid gap-6 xl:grid-cols-[360px_1fr]"><form className="card h-fit space-y-4" onSubmit={handleSubmit(submit)}><h2 className="font-semibold">Record movement</h2><label><span className="label">Product</span><select className="field" required {...register("product_id", { valueAsNumber: true })}><option value="">Select a product</option>{products.map((p) => <option value={p.id} key={p.id}>{p.name} ({p.quantity})</option>)}</select></label><label><span className="label">Movement type</span><select className="field" {...register("transaction_type")}><option value="stock_in">Stock in</option><option value="stock_out">Stock out</option><option value="transfer">Transfer out</option></select></label><label><span className="label">Quantity</span><input className="field" type="number" min="1" {...register("quantity", { valueAsNumber: true })}/></label><label><span className="label">Notes</span><textarea className="field" {...register("notes")}/></label><button className="btn-primary w-full" disabled={isSubmitting}>Save movement</button></form><section className="card"><h2 className="mb-4 font-semibold">Movement history</h2>{!history ? <Spinner/> : <div className="table-shell"><table><thead><tr><th>Type</th><th>Quantity</th><th>Before</th><th>After</th><th>Time</th></tr></thead><tbody>{history.items.map((t) => <tr key={t.id}><td className="capitalize">{t.transaction_type.replaceAll("_"," ")}</td><td>{t.quantity}</td><td>{t.quantity_before}</td><td>{t.quantity_after}</td><td>{new Date(t.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</section></div></div>;
}

