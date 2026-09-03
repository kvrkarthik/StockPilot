import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import { Spinner } from "../components/ui";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import AppLayout from "../layouts/AppLayout";
import { loadUser } from "../redux/authSlice";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const ProductsPage = lazy(() => import("../pages/ProductsPage"));
const InventoryPage = lazy(() => import("../pages/InventoryPage"));
const genericPages = import("../pages/GenericPages");
const ResourcePage = lazy(() => genericPages.then((module) => ({ default: module.ResourcePage })));
const ReportsPage = lazy(() => genericPages.then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => genericPages.then((module) => ({ default: module.SettingsPage })));

function Protected() {
  const { user, initialized } = useAppSelector((state) => state.auth);
  if (!initialized) return <Spinner/>;
  return user ? <AppLayout/> : <Navigate to="/login" replace/>;
}
export default function AppRouter() {
  const dispatch = useAppDispatch();
  useEffect(() => { if (localStorage.getItem("access_token")) void dispatch(loadUser()); else void dispatch(loadUser()); }, [dispatch]);
  return <Suspense fallback={<Spinner/>}><Routes><Route path="/login" element={<LoginPage/>}/><Route element={<Protected/>}><Route index element={<DashboardPage/>}/><Route path="products" element={<ProductsPage/>}/><Route path="inventory" element={<InventoryPage/>}/><Route path="purchases" element={<ResourcePage title="Purchases" endpoint="/purchases" description="Track supplier orders and receiving status."/>}/><Route path="sales" element={<ResourcePage title="Sales" endpoint="/sales" description="Review invoices and completed sales."/>}/><Route path="suppliers" element={<ResourcePage title="Suppliers" endpoint="/suppliers" description="Manage supply partners and contact details."/>}/><Route path="customers" element={<ResourcePage title="Customers" endpoint="/customers" description="Customer directory and purchase history."/>}/><Route path="reports" element={<ReportsPage/>}/><Route path="settings" element={<SettingsPage/>}/></Route><Route path="*" element={<NotFoundPage/>}/></Routes></Suspense>;
}
