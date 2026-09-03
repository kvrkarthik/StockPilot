import { Bell, Boxes, ChartNoAxesCombined, ClipboardList, LayoutDashboard, LogOut, Menu, Moon, Package, Settings, ShoppingCart, Sun, Truck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { logout } from "../redux/authSlice";

const links = [
  ["/", "Dashboard", LayoutDashboard], ["/products", "Products", Package],
  ["/inventory", "Inventory", Boxes], ["/purchases", "Purchases", Truck],
  ["/sales", "Sales", ShoppingCart], ["/suppliers", "Suppliers", ClipboardList],
  ["/customers", "Customers", Users], ["/reports", "Reports", ChartNoAxesCombined],
  ["/settings", "Settings", Settings],
] as const;

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.theme === "dark");
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.theme = dark ? "dark" : "light"; }, [dark]);
  return <div className="min-h-screen">
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-14 items-center justify-between px-2"><div className="flex items-center gap-2 font-bold"><span className="grid size-9 place-items-center rounded-xl bg-teal-700 text-white"><Boxes /></span>StockPilot</div><button className="lg:hidden" onClick={() => setOpen(false)}><X /></button></div>
      <nav className="mt-5 space-y-1">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><Icon className="size-4.5" />{label}</NavLink>)}</nav>
    </aside>
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
        <button className="lg:hidden" onClick={() => setOpen(true)}><Menu /></button><div className="ml-auto flex items-center gap-3">
          <button aria-label="Notifications" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Bell className="size-5" /></button>
          <button aria-label="Toggle theme" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setDark(!dark)}>{dark ? <Sun className="size-5" /> : <Moon className="size-5" />}</button>
          <div className="hidden text-right sm:block"><div className="text-sm font-semibold">{user?.full_name}</div><div className="text-xs text-slate-500">{user?.role?.name ?? "User"}</div></div>
          <button aria-label="Log out" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => dispatch(logout())}><LogOut className="size-5" /></button>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  </div>;
}

