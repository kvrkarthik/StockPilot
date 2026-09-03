import { AlertTriangle, CircleDollarSign, Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { errorMessage } from "../services/api";
import type { Dashboard } from "../types";
import { PageHeader, Skeleton } from "../components/ui";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard>();
  useEffect(() => { api.get<Dashboard>("/dashboard").then((r) => setData(r.data)).catch((e) => toast.error(errorMessage(e))); }, []);
  const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value));
  if (!data) return <><PageHeader title="Dashboard" /> <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((n) => <Skeleton key={n} />)}</div></>;
  const stats = [
    ["Total products", data.total_products, Package, "text-blue-600 bg-blue-50"],
    ["Low stock", data.low_stock, AlertTriangle, "text-amber-600 bg-amber-50"],
    ["Today's sales", data.today_sales, ShoppingCart, "text-violet-600 bg-violet-50"],
    ["Monthly revenue", money(data.monthly_revenue), CircleDollarSign, "text-emerald-600 bg-emerald-50"],
  ] as const;
  return <div><PageHeader title="Dashboard" description="A live view of sales and inventory health." />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon, color]) => <article className="card" key={label}><div className={`mb-4 grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-5" /></div><p className="text-sm text-slate-500">{label}</p><strong className="mt-1 block text-2xl">{value}</strong></article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-3">
      <article className="card xl:col-span-2"><h2 className="mb-5 font-semibold">Revenue this month</h2><div className="h-72"><ResponsiveContainer><AreaChart data={data.revenue_chart}><defs><linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.35}/><stop offset="95%" stopColor="#0f766e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickLine={false}/><YAxis tickLine={false}/><Tooltip formatter={(v) => money(Number(v))}/><Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="url(#revenue)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></article>
      <article className="card"><h2 className="mb-5 font-semibold">Top-selling products</h2><div className="h-72"><ResponsiveContainer><BarChart data={data.top_products} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number"/><YAxis type="category" dataKey="name" width={90}/><Tooltip/><Bar dataKey="quantity" fill="#0f766e" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div></article>
    </section>
    <article className="card mt-6"><h2 className="mb-4 font-semibold">Recent inventory activity</h2><div className="table-shell"><table><thead><tr><th>Type</th><th>Quantity</th><th>Before</th><th>After</th><th>Date</th></tr></thead><tbody>{data.recent_transactions.map((t) => <tr key={t.id}><td className="capitalize">{t.transaction_type.replaceAll("_", " ")}</td><td>{t.quantity}</td><td>{t.quantity_before}</td><td>{t.quantity_after}</td><td>{new Date(t.created_at).toLocaleString()}</td></tr>)}</tbody></table></div></article>
  </div>;
}

