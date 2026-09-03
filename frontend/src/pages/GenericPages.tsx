import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { EmptyState, PageHeader, Spinner } from "../components/ui";
import api, { errorMessage } from "../services/api";
import type { Page } from "../types";

type RecordRow = Record<string, string | number | null | undefined>;
export function ResourcePage({ title, endpoint, description }: { title: string; endpoint: string; description: string }) {
  const [rows, setRows] = useState<RecordRow[]>();
  useEffect(() => { api.get<Page<RecordRow> | RecordRow[]>(endpoint).then((r) => setRows(Array.isArray(r.data) ? r.data : r.data.items)).catch((e) => toast.error(errorMessage(e))); }, [endpoint]);
  return <div><PageHeader title={title} description={description}/>{!rows ? <Spinner/> : !rows.length ? <EmptyState/> : <div className="table-shell bg-white dark:bg-slate-900"><table><thead><tr>{Object.keys(rows[0]).filter((k) => !["items","description","address"].includes(k)).slice(0,6).map((k) => <th key={k}>{k.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={String(row.id ?? i)}>{Object.entries(row).filter(([k]) => !["items","description","address"].includes(k)).slice(0,6).map(([k,v]) => <td key={k}>{v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}</td>)}</tr>)}</tbody></table></div>}</div>;
}
export function ReportsPage() {
  const download = async (type: string, format: string) => { try { const response = await api.get(`/reports/${type}`, { params: { format }, responseType: "blob" }); const link = document.createElement("a"); link.href = URL.createObjectURL(response.data); link.download = `${type}.${format}`; link.click(); URL.revokeObjectURL(link.href); } catch (e) { toast.error(errorMessage(e)); } };
  return <div><PageHeader title="Reports" description="Export operational data for analysis and reconciliation."/><div className="grid gap-5 md:grid-cols-2">{["sales","inventory"].map((type) => <article className="card" key={type}><h2 className="text-lg font-semibold capitalize">{type} report</h2><p className="my-4 text-sm text-slate-500">Current {type} records with financial and quantity fields.</p><div className="flex gap-3"><button className="btn-secondary" onClick={() => download(type,"csv")}><Download className="size-4"/>CSV</button><button className="btn-primary" onClick={() => download(type,"xlsx")}><Download className="size-4"/>Excel</button></div></article>)}</div></div>;
}
export function SettingsPage() {
  const [settings, setSettings] = useState<RecordRow>();
  useEffect(() => { api.get("/settings").then((r) => setSettings(r.data)).catch((e) => toast.error(errorMessage(e))); }, []);
  if (!settings) return <Spinner/>;
  const save = async () => {
    const payload = Object.fromEntries(
      ["company_name", "company_address", "tax_percentage", "currency", "theme"].map((key) => [key, settings[key]]),
    );
    try { await api.put("/settings", payload); toast.success("Settings saved"); } catch(e) { toast.error(errorMessage(e)); }
  };
  return <div><PageHeader title="Settings" description="Company defaults used for invoices and taxation."/><section className="card max-w-2xl space-y-4">{["company_name","company_address","tax_percentage","currency","theme"].map((key) => <label key={key}><span className="label capitalize">{key.replaceAll("_"," ")}</span><input className="field" value={String(settings[key] ?? "")} onChange={(e) => setSettings({...settings,[key]:e.target.value})}/></label>)}<button className="btn-primary" onClick={save}>Save settings</button></section></div>;
}
