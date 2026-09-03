import { LoaderCircle, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

export function Spinner() {
  return <div className="grid min-h-48 place-items-center"><LoaderCircle className="animate-spin text-teal-700" /></div>;
}
export function EmptyState({ title = "Nothing here yet", description = "New records will appear here." }) {
  return <div className="grid min-h-56 place-items-center text-center"><div><PackageOpen className="mx-auto mb-3 size-10 text-slate-400" /><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div></div>;
}
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold">{title}</h1>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>;
}
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const styles = { neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", good: "bg-emerald-100 text-emerald-700", warn: "bg-amber-100 text-amber-800", bad: "bg-rose-100 text-rose-700" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}
export function Skeleton() { return <div className="card animate-pulse"><div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-700" /><div className="mt-4 h-8 w-3/5 rounded bg-slate-200 dark:bg-slate-700" /></div>; }

