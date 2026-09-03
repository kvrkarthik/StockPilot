import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Navigate } from "react-router";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { login } from "../redux/authSlice";
import { errorMessage } from "../services/api";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { email: "admin@example.com", password: "ChangeMe123!" },
  });
  if (user) return <Navigate to="/" replace />;
  const submit = async (data: FormData) => {
    try { await dispatch(login(data)).unwrap(); toast.success("Welcome back"); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-4">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl dark:bg-slate-900">
      <div className="mb-8"><span className="mb-5 grid size-12 place-items-center rounded-2xl bg-teal-700 text-white"><Boxes /></span><h1 className="text-2xl font-bold">Sign in to StockPilot</h1><p className="mt-2 text-sm text-slate-500">Manage inventory, purchases, and sales from one workspace.</p></div>
      <form className="space-y-5" onSubmit={handleSubmit(submit)}>
        <label><span className="label">Email address</span><input className="field" type="email" autoComplete="email" {...register("email")} />{errors.email && <small className="text-rose-600">{errors.email.message}</small>}</label>
        <label><span className="label">Password</span><input className="field" type="password" autoComplete="current-password" {...register("password")} />{errors.password && <small className="text-rose-600">{errors.password.message}</small>}</label>
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </section>
  </main>;
}

