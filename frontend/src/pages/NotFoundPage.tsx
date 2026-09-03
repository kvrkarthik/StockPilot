import { Link } from "react-router";
export default function NotFoundPage() { return <main className="grid min-h-screen place-items-center p-6 text-center"><div><div className="text-7xl font-black text-teal-700">404</div><h1 className="mt-4 text-2xl font-bold">Page not found</h1><p className="mt-2 text-slate-500">The page you requested does not exist.</p><Link to="/" className="btn-primary mt-6">Return to dashboard</Link></div></main>; }

