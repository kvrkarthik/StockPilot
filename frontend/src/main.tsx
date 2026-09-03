import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { Toaster } from "react-hot-toast";
import AppRouter from "./routes/AppRouter";
import { store } from "./redux/store";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><Provider store={store}><BrowserRouter><AppRouter/><Toaster position="top-right"/></BrowserRouter></Provider></StrictMode>,
);

